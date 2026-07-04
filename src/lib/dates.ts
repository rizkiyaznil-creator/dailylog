// Log dates represent a calendar day. We store them at UTC midnight and always
// format in UTC so the day never drifts across timezones.

const DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** "2026-07-04" -> Date at UTC midnight. Returns null if malformed. */
export function parseDateOnly(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!m) return null;
  const d = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date -> "2026-07-04" (UTC). */
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Date -> "Sabtu, 4 Juli 2026" (UTC). */
export function formatLongID(date: Date): string {
  const day = DAYS[date.getUTCDay()];
  return `${day}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Date -> "4 Jul" short label (UTC). */
export function formatShortID(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)}`;
}

/** Monday (UTC midnight) of the ISO week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0 = Sunday
  const diff = (dow + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** Sunday (UTC midnight) of the ISO week containing `date`. */
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

/** Add `days` to a date, returning a new UTC-midnight Date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** "30 Jun – 6 Jul 2026" range label for a week starting on `monday`. */
export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
  const left = sameMonth
    ? String(monday.getUTCDate())
    : formatShortID(monday);
  return `${left} – ${formatShortID(sunday)} ${sunday.getUTCFullYear()}`;
}
