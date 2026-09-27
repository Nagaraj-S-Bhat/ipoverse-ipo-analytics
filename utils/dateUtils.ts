/**
 * Safe date serialization utility.
 *
 * IPO dates are DATE-ONLY values (no time component).
 * They must never be shifted by timezone conversion.
 *
 * Problem:
 *   PostgreSQL @db.Date comes back from Neon as a JS Date object
 *   at midnight UTC (e.g., 2026-08-24T00:00:00.000Z).
 *   When the frontend uses new Date("2026-08-24T00:00:00.000Z").toLocaleDateString()
 *   in an IST environment (UTC+5:30), it displays "24 Aug" correctly — BUT
 *   some environments (or the Neon HTTP adapter) may serialize dates differently.
 *
 * Fix:
 *   Always serialize date-only fields as "YYYY-MM-DD" strings.
 *   The frontend must parse these using the local year/month/day,
 *   not by constructing a UTC Date object.
 *
 * Frontend usage (safe):
 *   const [year, month, day] = dateStr.split('-').map(Number);
 *   const label = new Date(year, month - 1, day)
 *     .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
 */

/**
 * Serialize a Date (or null) to a "YYYY-MM-DD" string.
 * Uses the Date's local year/month/day so the stored calendar date
 * is preserved regardless of the server's timezone.
 */
export function serializeDateOnly(date: Date | null | undefined): string | null {
  if (!date) return null;

  // Use UTC getters because Prisma @db.Date returns midnight UTC.
  // e.g., 2026-08-24T00:00:00.000Z → "2026-08-24"
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD value as a calendar date without any timezone shift. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;

  // Matches either "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss..."
  // Extracts the date part only, preventing any timezone shift.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

/** Format a date-only API value while preserving its source calendar day. */
export function formatDateOnly(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' }) : '—';
}
