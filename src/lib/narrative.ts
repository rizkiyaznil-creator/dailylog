import Anthropic from "@anthropic-ai/sdk";
import type { WeeklyReport } from "@/lib/report";
import { formatLongID, formatWeekRange, parseDateOnly } from "@/lib/dates";

const MODEL = "claude-opus-4-8";

function buildDigest(report: WeeklyReport): string {
  const parts: string[] = [];
  for (const day of report.days) {
    const d = parseDateOnly(day.date);
    parts.push(`## ${d ? formatLongID(d) : day.date}`);
    for (const log of day.logs) {
      if (log.content.trim()) parts.push(log.content.trim());
      for (const a of log.attachments) {
        if (a.type === "audio" && a.transcript) {
          parts.push(`(transkripsi suara) ${a.transcript.trim()}`);
        }
      }
    }
    parts.push("");
  }
  return parts.join("\n");
}

/**
 * Generate a narrative weekly analysis with Claude using the user's own key.
 * Throws on API/network failure — the caller decides how to surface it.
 */
export async function generateNarrative(
  report: WeeklyReport,
  anthropicKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey: anthropicKey });

  const monday = parseDateOnly(report.weekStart)!;
  const digest = buildDigest(report);
  const s = report.stats;

  const system =
    "Kamu adalah asisten yang menulis analisis laporan mingguan dari catatan " +
    "harian seseorang. Tulis dalam Bahasa Indonesia yang rapi dan mengalir. " +
    "Fokus pada: ringkasan pencapaian utama, pola/tema yang muncul, dan " +
    "1-3 saran atau hal yang bisa diperhatikan minggu depan. Gunakan Markdown " +
    "(paragraf dan bila perlu poin). Jangan mengarang fakta di luar catatan. " +
    "Panjang secukupnya (sekitar 150-300 kata).";

  const prompt =
    `Periode: ${formatWeekRange(monday)}\n` +
    `Statistik: ${s.totalLogs} catatan, ${s.activeDays} hari aktif, ` +
    `${s.totalWords} kata, ${s.imageCount} gambar, ${s.audioCount} audio.\n\n` +
    `Berikut catatan hariannya:\n\n${digest}\n\n` +
    `Tuliskan analisis mingguannya.`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    // Map SDK errors to friendly Indonesian messages.
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("API key Anthropic tidak valid. Periksa di Pengaturan.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Terlalu banyak permintaan ke Claude. Coba lagi nanti.");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new Error("Tidak bisa terhubung ke Claude. Cek koneksi.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Claude error (${err.status ?? "?"}).`);
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Permintaan ditolak oleh model.");
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || "(Narasi kosong.)";
}
