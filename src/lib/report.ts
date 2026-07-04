import { prisma } from "@/lib/prisma";
import {
  startOfWeek,
  addDays,
  toDateOnlyString,
  parseDateOnly,
} from "@/lib/dates";

// Common Indonesian + English stopwords, filtered out of keyword stats.
const STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "ini", "itu",
  "atau", "juga", "sudah", "akan", "saya", "aku", "kita", "kami", "tidak",
  "ada", "adalah", "dalam", "karena", "agar", "supaya", "bisa", "dapat",
  "lebih", "masih", "saat", "jadi", "oleh", "buat", "sebagai", "hari",
  "the", "and", "to", "of", "for", "in", "on", "with", "is", "are", "was",
  "a", "an", "it", "this", "that", "as", "at", "be", "by", "or", "so",
]);

export type ReportDay = {
  date: string; // YYYY-MM-DD
  logs: {
    id: string;
    content: string;
    attachments: {
      id: string;
      type: "image" | "audio";
      transcript: string | null;
    }[];
  }[];
};

export type ReportStats = {
  totalLogs: number;
  activeDays: number;
  totalWords: number;
  imageCount: number;
  audioCount: number;
  busiestDay: string | null; // YYYY-MM-DD
  topKeywords: { word: string; count: number }[];
};

export type WeeklyReport = {
  weekStart: string; // Monday YYYY-MM-DD
  weekEnd: string; // Sunday YYYY-MM-DD
  days: ReportDay[]; // only days that have logs, ascending
  stats: ReportStats;
};

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function extractKeywords(texts: string[]): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/);
    for (const w of words) {
      if (w.length < 4 || STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Build the weekly report for the week containing `weekStartStr` (any date in
 * the week works; it is normalized to Monday).
 */
export async function buildWeeklyReport(
  userId: string,
  weekStartStr: string,
): Promise<WeeklyReport | null> {
  const anchor = parseDateOnly(weekStartStr);
  if (!anchor) return null;

  const monday = startOfWeek(anchor);
  const sunday = addDays(monday, 6);
  const rangeEnd = addDays(monday, 7); // exclusive upper bound

  const logs = await prisma.dailyLog.findMany({
    where: { userId, logDate: { gte: monday, lt: rangeEnd } },
    orderBy: [{ logDate: "asc" }, { createdAt: "asc" }],
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });

  // Group by calendar day.
  const byDay = new Map<string, ReportDay>();
  for (const log of logs) {
    const key = toDateOnlyString(log.logDate);
    if (!byDay.has(key)) byDay.set(key, { date: key, logs: [] });
    byDay.get(key)!.logs.push({
      id: log.id,
      content: log.content,
      attachments: log.attachments.map((a) => ({
        id: a.id,
        type: a.type as "image" | "audio",
        transcript: a.transcript,
      })),
    });
  }
  const days = [...byDay.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Statistics.
  let totalWords = 0;
  let imageCount = 0;
  let audioCount = 0;
  const perDayCount = new Map<string, number>();
  const texts: string[] = [];

  for (const log of logs) {
    totalWords += countWords(log.content);
    if (log.content) texts.push(log.content);
    const key = toDateOnlyString(log.logDate);
    perDayCount.set(key, (perDayCount.get(key) ?? 0) + 1);
    for (const a of log.attachments) {
      if (a.type === "image") imageCount++;
      else if (a.type === "audio") {
        audioCount++;
        if (a.transcript) texts.push(a.transcript);
      }
    }
  }

  let busiestDay: string | null = null;
  let busiestCount = 0;
  for (const [day, count] of perDayCount) {
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = day;
    }
  }

  const stats: ReportStats = {
    totalLogs: logs.length,
    activeDays: byDay.size,
    totalWords,
    imageCount,
    audioCount,
    busiestDay,
    topKeywords: extractKeywords(texts),
  };

  return {
    weekStart: toDateOnlyString(monday),
    weekEnd: toDateOnlyString(sunday),
    days,
    stats,
  };
}

/** Distinct week-start dates (Monday, desc) that have at least one log. */
export async function listReportWeeks(
  userId: string,
): Promise<{ weekStart: string; count: number }[]> {
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    select: { logDate: true },
  });

  const weeks = new Map<string, number>();
  for (const { logDate } of logs) {
    const key = toDateOnlyString(startOfWeek(logDate));
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }

  return [...weeks.entries()]
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}
