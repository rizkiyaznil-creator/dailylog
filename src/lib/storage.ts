import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { put, del } from "@vercel/blob";

// Storage is adaptive:
//   - If BLOB_READ_WRITE_TOKEN is set (production) → Vercel Blob.
//   - Otherwise (local dev) → files under ./uploads.
// Attachment.filePath holds either a relative local path or a full blob URL.
// Files are always served through the ownership-checked /api/files/[id] route,
// so blob URLs are never exposed to the client.

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const useBlob = Boolean(BLOB_TOKEN);

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
  "audio/m4a",
]);

export type AttachmentKind = "image" | "audio";

export function classify(mime: string): AttachmentKind | null {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (AUDIO_TYPES.has(mime)) return "audio";
  return null;
}

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/wav": "wav",
  };
  return map[mime] ?? "bin";
}

function isUrl(p: string): boolean {
  return p.startsWith("http://") || p.startsWith("https://");
}

/**
 * Persist a buffer and return the value to store in Attachment.filePath:
 * a blob URL (production) or a path relative to the uploads root (local dev).
 */
export async function saveFile(
  userId: string,
  buffer: Buffer,
  mime: string,
): Promise<string> {
  const name = `${crypto.randomBytes(16).toString("hex")}.${extFor(mime)}`;
  const key = path.posix.join(userId, name);

  if (useBlob) {
    const blob = await put(key, buffer, {
      access: "public",
      token: BLOB_TOKEN,
      contentType: mime,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const dir = path.join(UPLOADS_ROOT, userId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return key;
}

/** Absolute path for a stored relative filePath, guarded against traversal. */
export function resolveStoredPath(relativePath: string): string {
  const abs = path.resolve(UPLOADS_ROOT, relativePath);
  if (abs !== UPLOADS_ROOT && !abs.startsWith(UPLOADS_ROOT + path.sep)) {
    throw new Error("Invalid file path");
  }
  return abs;
}

export async function readStoredFile(filePath: string): Promise<Buffer> {
  if (isUrl(filePath)) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Blob fetch failed (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(resolveStoredPath(filePath));
}

export async function deleteStoredFile(filePath: string): Promise<void> {
  try {
    if (isUrl(filePath)) {
      await del(filePath, { token: BLOB_TOKEN });
    } else {
      await fs.unlink(resolveStoredPath(filePath));
    }
  } catch {
    // already gone — ignore
  }
}

export function contentTypeForPath(filePath: string): string {
  const clean = filePath.split("?")[0];
  const ext = path.extname(clean).slice(1).toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    webm: "audio/webm",
    ogg: "audio/ogg",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
  };
  return map[ext] ?? "application/octet-stream";
}
