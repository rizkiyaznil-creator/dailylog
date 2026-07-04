import type { WeeklyReport } from "@/lib/report";
import { formatLongID, formatWeekRange, parseDateOnly } from "@/lib/dates";

/** Render a weekly report (optionally with an AI narrative) as Markdown. */
export function reportToMarkdown(
  report: WeeklyReport,
  narrative?: string | null,
): string {
  const monday = parseDateOnly(report.weekStart)!;
  const lines: string[] = [];

  lines.push(`# Laporan Mingguan — ${formatWeekRange(monday)}`);
  lines.push("");

  // Statistics
  const s = report.stats;
  lines.push("## Ringkasan");
  lines.push("");
  lines.push(`- **Total catatan:** ${s.totalLogs}`);
  lines.push(`- **Hari aktif:** ${s.activeDays} dari 7`);
  lines.push(`- **Total kata:** ${s.totalWords}`);
  lines.push(`- **Lampiran:** ${s.imageCount} gambar, ${s.audioCount} audio`);
  if (s.busiestDay) {
    const d = parseDateOnly(s.busiestDay);
    if (d) lines.push(`- **Hari tersibuk:** ${formatLongID(d)}`);
  }
  if (s.topKeywords.length > 0) {
    const kw = s.topKeywords.map((k) => `${k.word} (${k.count})`).join(", ");
    lines.push(`- **Tema utama:** ${kw}`);
  }
  lines.push("");

  // AI narrative
  if (narrative) {
    lines.push("## Analisis");
    lines.push("");
    lines.push(narrative.trim());
    lines.push("");
  }

  // Per-day detail
  lines.push("## Rincian Harian");
  lines.push("");
  if (report.days.length === 0) {
    lines.push("_Tidak ada catatan minggu ini._");
    lines.push("");
  }
  for (const day of report.days) {
    const d = parseDateOnly(day.date);
    lines.push(`### ${d ? formatLongID(d) : day.date}`);
    lines.push("");
    for (const log of day.logs) {
      if (log.content.trim()) {
        lines.push(log.content.trim());
        lines.push("");
      }
      for (const a of log.attachments) {
        if (a.type === "image") {
          lines.push(`- 🖼️ _(gambar terlampir)_`);
        } else if (a.type === "audio") {
          const t = a.transcript ? `: ${a.transcript.trim()}` : "";
          lines.push(`- 🎵 _Transkripsi_${t}`);
        }
      }
      if (log.attachments.length > 0) lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
