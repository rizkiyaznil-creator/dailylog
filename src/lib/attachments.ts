import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import {
  classify,
  saveFile,
  MAX_FILE_BYTES,
  type AttachmentKind,
} from "@/lib/storage";
import { transcribeAudio } from "@/lib/transcribe";

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Save one uploaded File as an Attachment on the given log. Audio files are
 * transcribed (Whisper if the user has an OpenAI key, otherwise a mock).
 */
export async function addAttachment(params: {
  logId: string;
  userId: string;
  file: File;
  openaiKeyEnc: string | null;
}) {
  const { logId, userId, file, openaiKeyEnc } = params;

  const kind: AttachmentKind | null = classify(file.type);
  if (!kind) {
    throw new UploadError(`Tipe file tidak didukung: ${file.type || "?"}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError("Ukuran file melebihi 15 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await saveFile(userId, buffer, file.type);

  let transcript: string | null = null;
  if (kind === "audio") {
    const openaiKey = openaiKeyEnc ? safeDecrypt(openaiKeyEnc) : null;
    try {
      const result = await transcribeAudio(buffer, file.type, openaiKey);
      transcript = result.text;
    } catch (err) {
      // A transcription failure must not lose the recording — keep the
      // attachment and surface the error inline instead.
      const msg = err instanceof Error ? err.message : "gagal";
      transcript = `[Transkripsi gagal: ${msg}. Coba lagi dari halaman catatan.]`;
    }
  }

  return prisma.attachment.create({
    data: { logId, type: kind, filePath, transcript },
  });
}

function safeDecrypt(enc: string): string | null {
  try {
    return decrypt(enc);
  } catch {
    return null;
  }
}
