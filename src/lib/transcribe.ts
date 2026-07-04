export type TranscribeResult = {
  text: string;
  mocked: boolean;
};

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * Transcribe an audio buffer. When an OpenAI key is provided we call Whisper;
 * otherwise we return a mock transcript so the app is usable without a key.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mime: string,
  openaiKey: string | null,
): Promise<TranscribeResult> {
  if (!openaiKey) {
    return {
      text: "[Transkripsi contoh — belum ada API key OpenAI. Tambahkan key di Pengaturan untuk transkripsi otomatis.]",
      mocked: true,
    };
  }

  const form = new FormData();
  const ext = mime.split("/")[1] ?? "webm";
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), `audio.${ext}`);
  form.append("model", "whisper-1");

  const res = await fetch(WHISPER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Whisper gagal (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as { text?: string };
  return { text: data.text?.trim() || "", mocked: false };
}
