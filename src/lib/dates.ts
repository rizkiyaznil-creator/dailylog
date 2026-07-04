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
