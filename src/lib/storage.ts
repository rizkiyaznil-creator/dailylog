import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Files live outside /public so they can only be reached through the
// ownership-checked /api/files/[id] route.
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

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

/**
 * Persist a buffer to disk under uploads/<userId>/ and return the path
 * relative to the uploads root (what we store in Attachment.filePath).
 */
export async function saveFile(
  userId: string,
  buffer: Buffer,
  mime: string,
): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, userId);
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomBytes(16).toString("hex")}.${extFor(mime)}`;
  await fs.writeFile(path.join(dir, name), buffer);
  return path.posix.join(userId, name);
}

/** Absolute path for a stored relative filePath, guarded against traversal. */
export function resolveStoredPath(relativePath: string): string {
  const abs = path.resolve(UPLOADS_ROOT, relativePath);
  if (abs !== UPLOADS_ROOT && !abs.startsWith(UPLOADS_ROOT + path.sep)) {
    throw new Error("Invalid file path");
  }
  return abs;
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(resolveStoredPath(relativePath));
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(resolveStoredPath(relativePath));
  } catch {
    // already gone — ignore
  }
}

export function contentTypeForPath(relativePath: string): string {
  const ext = path.extname(relativePath).slice(1).toLowerCase();
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
