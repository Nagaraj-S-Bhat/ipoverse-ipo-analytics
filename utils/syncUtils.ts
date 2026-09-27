import slugify from 'slugify';
import { Prisma } from '@prisma/client';

/**
 * Generate a stable URL slug.
 */
export function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Convert a value to Prisma Decimal.
 *
 * IMPORTANT:
 * Missing / TBA / N/A values return null instead of fake 0.
 */
export function cleanToDecimal(
  val: string | number | Prisma.Decimal | undefined | null,
  fallback: number = 0
): Prisma.Decimal {
  const result = cleanToDecimalOrNull(val);

  return result ?? new Prisma.Decimal(fallback);
}

/**
 * Convert a value to Prisma Decimal or null.
 *
 * Use this when the source can contain:
 * TBA, N/A, -, --, blank, etc.
 */
export function cleanToDecimalOrNull(
  val: string | number | Prisma.Decimal | undefined | null
): Prisma.Decimal | null {
  if (val === undefined || val === null) {
    return null;
  }

  if (val instanceof Prisma.Decimal) {
    return val;
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? new Prisma.Decimal(val) : null;
  }

  const text = String(val).trim();

  if (!text) {
    return null;
  }

  const normalized = text.toLowerCase();

  if (
    normalized === 'tba' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === '-' ||
    normalized === '--' ||
    normalized === '—' ||
    normalized === '–' ||
    normalized === 'awaited'
  ) {
    return null;
  }

  /*
   * Remove currency, percentage, commas and spaces.
   * Keep digits, minus sign and decimal point.
   */
  const cleaned = text
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '.') {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Prisma.Decimal(parsed);
}

/**
 * Convert a value to integer.
 *
 * Missing values return the supplied fallback.
 */
export function cleanToInt(
  val: string | number | undefined | null,
  fallback: number = 0
): number {
  if (val === undefined || val === null) {
    return fallback;
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.trunc(val) : fallback;
  }

  const text = String(val).trim();

  if (!text) {
    return fallback;
  }

  const normalized = text.toLowerCase();

  if (
    normalized === 'tba' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === '-' ||
    normalized === '--' ||
    normalized === '—' ||
    normalized === '–'
  ) {
    return fallback;
  }

  const cleaned = text.replace(/,/g, '').replace(/[^\d-]/g, '');
  const parsed = Number.parseInt(cleaned, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Month lookup.
 */
const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,

  feb: 1,
  february: 1,

  mar: 2,
  march: 2,

  apr: 3,
  april: 3,

  may: 4,

  jun: 5,
  june: 5,

  jul: 6,
  july: 6,

  aug: 7,
  august: 7,

  sep: 8,
  sept: 8,
  september: 8,

  oct: 9,
  october: 9,

  nov: 10,
  november: 10,

  dec: 11,
  december: 11,
};

/**
 * Normalize all common date separators.
 */
function normalizeDateRange(value: string): string {
  return value
    .replace(/\u2013/g, '-') // en dash
    .replace(/\u2014/g, '-') // em dash
    .replace(/\u2212/g, '-') // minus sign
    .replace(/\s+/g, ' ')
    .replace(/\bto\b/gi, '-')
    .trim();
}

/**
 * Extract month index from a string.
 */
function extractMonth(value: string): number | null {
  const lower = value.toLowerCase();

  for (const [month, index] of Object.entries(MONTHS)) {
    const regex = new RegExp(`\\b${month}\\b`, 'i');

    if (regex.test(lower)) {
      return index;
    }
  }

  /*
   * Also support compact forms such as:
   * 10-Aug
   * Aug10
   */
  for (const [month, index] of Object.entries(MONTHS)) {
    if (lower.includes(month)) {
      return index;
    }
  }

  return null;
}

/**
 * Extract day from a date fragment.
 */
function extractDay(value: string): number | null {
  const match = value.match(/\b(\d{1,2})\b/);

  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);

  if (day < 1 || day > 31) {
    return null;
  }

  return day;
}

/**
 * Extract explicit year.
 */
function extractYear(value: string): number | null {
  const match = value.match(/\b(20\d{2})\b/);

  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Build a safe date.
 */
function buildDate(
  year: number,
  month: number,
  day: number
): Date {
  const date = new Date(Date.UTC(year, month, day));

  /*
   * Prevent JavaScript from silently rolling invalid dates
   * such as 31 Feb into another month.
   */
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      `Invalid date: ${day}-${month + 1}-${year}`
    );
  }

  return date;
}

/**
 * Parse a single IPO date fragment.
 *
 * Supported examples:
 *   12 Aug
 *   12 August 2026
 *   12-Aug
 *   Aug 12
 *   12/08/2026
 */
function parseSingleDate(
  value: string,
  fallbackYear: number,
  fallbackMonth?: number
): Date {
  const text = value.trim();

  if (!text) {
    throw new Error('Empty date value');
  }

  /*
   * Numeric date:
   * 12/08/2026
   * 12-08-2026
   */
  const numeric = text.match(
    /^\s*(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\s*$/
  );

  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = Number(numeric[3]);

    return buildDate(year, month, day);
  }

  const day = extractDay(text);

  if (!day) {
    throw new Error(`Unable to parse day from "${value}"`);
  }

  const explicitYear = extractYear(text);

  const month =
    extractMonth(text) ??
    fallbackMonth;

  if (month === undefined || month === null) {
    throw new Error(`Unable to parse month from "${value}"`);
  }

  return buildDate(
    explicitYear ?? fallbackYear,
    month,
    day
  );
}

/**
 * Parse IPO date ranges.
 *
 * Supported:
 *
 * 11 - 13 Aug
 * 31 Jul - 4 Aug
 * 10-Aug to 12-Aug
 * 12 Aug - 14 Aug
 * 12 August 2026 - 14 August 2026
 *
 * Handles:
 *  -
 *  –
 *  —
 *  "to"
 */
export function parseDateRange(
  rangeStr: string
): {
  openDate: Date;
  closeDate: Date;
} {
  const normalized = normalizeDateRange(rangeStr);

  if (!normalized) {
    throw new Error('Empty IPO date range');
  }

  /*
   * Split only on the range separator.
   */
  const parts = normalized
    .split(/\s+-\s+|(?<=\d)-(?=\d)|\bto\b/i)
    .map((part) => part.trim())
    .filter(Boolean);

  /*
   * Fallback for forms such as:
   * 10-Aug-12-Aug
   */
  let left = '';
  let right = '';

  if (parts.length >= 2) {
    left = parts[0];
    right = parts[1];
  } else {
    /*
     * Try a more permissive split.
     */
    const match = normalized.match(
      /^(.+?)\s*-\s*(.+)$/
    );

    if (match) {
      left = match[1].trim();
      right = match[2].trim();
    } else {
      left = normalized;
      right = normalized;
    }
  }

  const currentYear = new Date().getFullYear();

  /*
   * Parse close date first because it usually contains
   * the month in formats such as:
   *
   * 11 - 13 Aug
   */
  const closeMonth = extractMonth(right);

  let closeDate = parseSingleDate(
    right,
    currentYear,
    closeMonth ?? undefined
  );

  /*
   * If left contains its own month, use it.
   * Otherwise borrow closeDate's month.
   */
  const leftMonth = extractMonth(left);

  let openDate = parseSingleDate(
    left,
    closeDate.getUTCFullYear(),
    leftMonth ?? closeDate.getUTCMonth()
  );

  /*
   * Handle cross-month ranges:
   *
   * 29 Jul - 2 Aug
   *
   * Same year.
   */
  if (openDate > closeDate) {
    if (leftMonth !== null && closeMonth !== null) {
      /*
       * If open month is later than close month,
       * the range crossed a year boundary.
       */
      if (leftMonth > closeMonth) {
        closeDate = buildDate(
          closeDate.getUTCFullYear() + 1,
          closeDate.getUTCMonth(),
          closeDate.getUTCDate()
        );
      } else {
        /*
         * Same month/day ordering issue.
         * Try the next month first.
         */
        closeDate = buildDate(
          closeDate.getUTCFullYear(),
          closeDate.getUTCMonth(),
          closeDate.getUTCDate()
        );
      }
    }

    /*
     * If still reversed, use the next year as final
     * protection rather than returning an impossible range.
     */
    if (openDate > closeDate) {
      closeDate = buildDate(
        closeDate.getUTCFullYear() + 1,
        closeDate.getUTCMonth(),
        closeDate.getUTCDate()
      );
    }
  }

  return {
    openDate,
    closeDate,
  };
}

/**
 * Add calendar days.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Add business days.
 *
 * Saturday and Sunday are skipped.
 *
 * NOTE:
 * This does not know exchange holidays.
 */
function addBusinessDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);

    const day = result.getUTCDay();

    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }

  return result;
}

/**
 * Calculate the standard IPO post-close timeline.
 *
 * This is only a fallback because the source sheets currently
 * provide the IPO open/close dates, not every allotment event date.
 */
export function calculateTimeline(closeDate: Date) {
  return {
    allotmentDate: addBusinessDays(closeDate, 1),
    refundDate: addBusinessDays(closeDate, 2),
    creditDate: addBusinessDays(closeDate, 2),
    listingDate: addBusinessDays(closeDate, 3),
  };
}

/**
 * Normalize company names so different sheets can refer
 * to the same IPO consistently.
 */
export function normalizeCompanyName(
  name: string
): string {
  return name
    .replace(/\r/g, '')
    .split('\n')[0]
    /*
     * Strip trailing board-type and status words that some sheets
     * embed into the company name cell, e.g.
     *   "Tempsens Instruments (India) Mainboard"
     *   "Credent Connect N Care SME Open"
     *
     * These are NOT part of the company's legal name and cause slug
     * mismatches between sheets when left in.
     */
    .replace(
      /\s*\b(mainboard|sme|open|upcoming|closed|listed)\b\s*$/gi,
      ''
    )
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /\b(ltd\.?|limited|pvt\.?|private|sme|ipo)\b/gi,
      ''
    )
    .replace(/[^\p{L}\p{N}\s&.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate GMP percentage.
 */
export function calculateGmpPercent(
  gmp: Prisma.Decimal | null,
  issuePrice: Prisma.Decimal | null
): Prisma.Decimal | null {
  if (!gmp || !issuePrice || issuePrice.lte(0)) {
    return null;
  }

  return gmp
    .div(issuePrice)
    .mul(100);
}

/**
 * Calculate minimum investment.
 */
export function calculateMinimumInvestment(
  price: Prisma.Decimal | null,
  lotSize: number | null
): Prisma.Decimal | null {
  if (
    !price ||
    price.lte(0) ||
    !lotSize ||
    lotSize <= 0
  ) {
    return null;
  }

  return price.mul(lotSize);
}

/**
 * Determine IPO status using dates.
 */
export function calculateIPOStatus(
  openDate: Date | null,
  closeDate: Date | null,
  listingDate: Date | null
): 'UPCOMING' | 'OPEN' | 'CLOSED' | 'LISTED' {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (listingDate) {
    const listing = new Date(listingDate);
    listing.setHours(0, 0, 0, 0);

    if (today >= listing) {
      return 'LISTED';
    }
  }

  if (!openDate) {
    return 'UPCOMING';
  }

  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);

  if (today < open) {
    return 'UPCOMING';
  }

  if (closeDate) {
    const close = new Date(closeDate);
    close.setHours(0, 0, 0, 0);

    if (today <= close) {
      return 'OPEN';
    }
  }

  return 'CLOSED';
}