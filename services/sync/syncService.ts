import { getSheetRowsWithRetry } from '../../lib/google/sheets';
import { IpoRepository } from '../../repositories/ipoRepository';
import { SyncLogRepository } from '../../repositories/syncLogRepository';
import { prisma } from '../../lib/prisma';

import {
  IPOType,
  IPOStatus,
  Exchange,
  SyncStatus,
  Prisma,
} from '@prisma/client';

import {
  generateSlug,
  normalizeCompanyName,
  cleanToDecimalOrNull,
  cleanToInt,
  calculateMinimumInvestment,
  calculateGmpPercent,
  parseDateRange,
} from '../../utils/syncUtils';

export class SyncService {
  private ipoRepo: IpoRepository;
  private syncLogRepo: SyncLogRepository;

  constructor() {
    this.ipoRepo = new IpoRepository();
    this.syncLogRepo = new SyncLogRepository();
  }

  // ============================================================
  // RUN ALL SYNCS
  // ============================================================

  async syncAll(): Promise<void> {
    console.log('==========================================');
    console.log('Starting IPO Google Sheet synchronization');
    console.log('==========================================');

    const jobs: Array<[string, () => Promise<void>]> = [
      ['Live IPO GMP', () => this.syncLiveGMP()],
      ['Mainboard IPO', () => this.syncMainboardIPO()],
      ['SME IPO', () => this.syncSMEIPO()],
      ['Mainboard IPO Performance', () => this.syncMainboardPerformance()],
      ['SME IPO Performance', () => this.syncSMEPerformance()],
      ['Live IPO Summary', () => this.syncLiveSummary()],
    ];

    for (const [name, job] of jobs) {
      try {
        console.log(`[SYNC] Starting: ${name}`);
        await job();
        console.log(`[SYNC] Completed: ${name}`);
      } catch (error) {
        console.error(`[SYNC] Failed: ${name}`, error);
      }
    }

    console.log('==========================================');
    console.log('Google Sheet synchronization completed');
    console.log('==========================================');
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private lines(value: string | undefined | null): string[] {
    if (!value) return [];
    return value
      .replace(/\r/g, '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private getCompanyName(value: string | undefined | null): string {
    if (!value) return '';
    const firstLine = value
      .replace(/\r/g, '')
      .split('\n')[0]
      .trim();
    return normalizeCompanyName(firstLine);
  }

  /**
   * Parse price range: "₹179-189", "₹138", "179 – 189", "-"
   */
  private parsePriceRange(value: string | undefined | null): {
    min: Prisma.Decimal | null;
    max: Prisma.Decimal | null;
  } {
    if (!value) return { min: null, max: null };

    const cleaned = value
      .replace(/₹/g, '')
      .replace(/,/g, '')
      .replace(/[–—]/g, '-')
      .trim();

    if (!cleaned || /^(na|n\/a|tba|--|-)$/i.test(cleaned)) {
      return { min: null, max: null };
    }

    const parts = cleaned.split(/\s*-\s*/).map((x) => x.trim()).filter(Boolean);
    const min = cleanToDecimalOrNull(parts[0]);
    const max = parts.length > 1 ? cleanToDecimalOrNull(parts[1]) : min;
    return { min, max };
  }

  /**
   * Parse issue size: "₹582.8 Cr.", "582.8 Cr.", "-"
   */
  private parseIssueSize(value: string | undefined | null): Prisma.Decimal | null {
    if (!value) return null;
    const cleaned = value
      .replace(/₹/g, '')
      .replace(/,/g, '')
      .replace(/cr\.?/gi, '')
      .trim();
    if (!cleaned || /^[-–—]+$/.test(cleaned)) return null;
    return cleanToDecimalOrNull(cleaned);
  }

  /**
   * Parse percentage: "+32.99%", "-14.60%", "N/A", "--"
   */
  private parsePercent(value: string | undefined | null): Prisma.Decimal | null {
    if (!value) return null;
    const cleaned = value.replace(/%/g, '').replace(/\+/g, '').replace(/,/g, '').trim();
    if (!cleaned || cleaned === '--' || cleaned === '-' || /^n\/a$/i.test(cleaned)) {
      return null;
    }
    return cleanToDecimalOrNull(cleaned);
  }

  /**
   * Parse GMP from a cell.
   * Looks for a number optionally preceded by ₹ on any line.
   */
  private parseGMP(value: string | undefined | null): Prisma.Decimal | null {
    if (!value) return null;
    for (const line of this.lines(value)) {
      const match = line.match(/₹?\s*(-?\d+(?:\.\d+)?)/);
      if (match) return cleanToDecimalOrNull(match[1]);
    }
    return null;
  }

  /**
   * Parse lot size: "Lot 600 shares", "Lot 1,000 shares"
   */
  private parseLotSize(value: string | undefined | null): number | null {
    if (!value) return null;
    let match = value.match(/lot\s*([\d,]+)\s*shares?/i);
    if (!match) match = value.match(/([\d,]+)\s*shares?/i);
    if (!match) return null;
    const n = cleanToInt(match[1], 0);
    return n > 0 ? n : null;
  }

  /**
   * Parse minimum investment: "Min ₹226,800"
   */
  private parseMinimumInvestment(value: string | undefined | null): Prisma.Decimal | null {
    if (!value) return null;
    const match = value.match(/min\s*₹?\s*([\d,]+)/i);
    if (!match) return null;
    return cleanToDecimalOrNull(match[1].replace(/,/g, ''));
  }

  /**
   * Parse subscription: "0.39x", "3.12x"
   */
  private parseSubscriptionValue(value: string | undefined | null): Prisma.Decimal | null {
    if (!value) return null;
    const match = value.match(/(-?\d+(?:\.\d+)?)\s*x?/i);
    if (!match) return null;
    return cleanToDecimalOrNull(match[1]);
  }

  /**
   * Determine IPO type from text.
   */
  private parseIPOType(value: string | undefined | null): IPOType | null {
    if (!value) return null;
    const t = value.toLowerCase();
    if (t.includes('sme')) return IPOType.SME;
    if (t.includes('mainboard')) return IPOType.MAINBOARD;
    return null;
  }

  /**
   * Derive status from dates only.
   * Uses local date comparison so the calendar date is never shifted.
   */
  private calculateStatus(
    openDate: Date | null,
    closeDate: Date | null,
    listingDate: Date | null
  ): IPOStatus {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (listingDate) {
      const listDate = new Date(listingDate.getFullYear(), listingDate.getMonth(), listingDate.getDate());
      if (today >= listDate) {
        return IPOStatus.LISTED;
      }
    }

    if (!openDate || !closeDate) {
      return IPOStatus.UPCOMING;
    }

    const open = new Date(openDate.getFullYear(), openDate.getMonth(), openDate.getDate());
    const close = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate());

    if (today < open) return IPOStatus.UPCOMING;
    if (today <= close) return IPOStatus.OPEN;
    return IPOStatus.CLOSED;
  }

  /**
   * Parse a date range string using the shared parseDateRange utility.
   * Never throws; returns null dates on failure.
   *
   * Also strips board-type prefixes before parsing:
   *   "Mainboard Open 12 Aug - 14 Aug" -> "12 Aug - 14 Aug"
   */
  private tryParseDateRange(value: string | undefined | null): {
    openDate: Date | null;
    closeDate: Date | null;
  } {
    if (!value || !value.trim()) return { openDate: null, closeDate: null };
    const cleaned = value
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^(mainboard|sme)\s+(open|upcoming|closed|listed)\s*/i, '')
      .trim();
    if (!cleaned) return { openDate: null, closeDate: null };
    try {
      const { openDate, closeDate } = parseDateRange(cleaned);
      return { openDate, closeDate };
    } catch {
      return { openDate: null, closeDate: null };
    }
  }

  /**
   * Extract company name and date range from the Live IPO GMP company cell.
   *
   * Cell format:
   *   Line 1: "Shiprocket Mainboard"   <- company (strip Mainboard/SME suffix)
   *   Line 2: "12 Aug - 14 Aug"        <- date range
   */
  private extractGMPCompanyAndDates(value: string | undefined | null): {
    companyName: string;
    openDate: Date | null;
    closeDate: Date | null;
    detectedType: IPOType | null;
  } {
    const ls = this.lines(value);
    if (ls.length === 0) return { companyName: '', openDate: null, closeDate: null, detectedType: null };

    // Detect type from the raw first line BEFORE normalizing (normalizer strips "SME"/"Mainboard")
    const rawLine0 = ls[0];
    const detectedType = this.parseIPOType(rawLine0);

    // normalizeCompanyName strips trailing "Mainboard"/"SME"/"Open" etc.
    const companyName = normalizeCompanyName(rawLine0);
    const dateText = ls.slice(1).join(' ');
    const dates = this.tryParseDateRange(dateText);
    return { companyName, openDate: dates.openDate, closeDate: dates.closeDate, detectedType };
  }

  /**
   * Extract company name from a Performance sheet cell.
   *
   * The cell may contain:
   *   Form 1 – inline Listed (no newline):
   *     "Dhoot TransmissionListed: 17 Aug 2026"
   *
   *   Form 2 – abbreviated thumbnail prefix on its own line:
   *     "Op\nOptimystix Entertainment IndiaListed: 14 Aug 2026"
   *     "LA\nLAPL AutomotiveListed: 13 Aug 2026"
   *
   *   Form 3 – clean name only:
   *     "Technocraft Ventures"
   *
   * Strategy:
   *   1. Strip everything from "Listed:" onward.
   *   2. Split into lines.
   *   3. If first line is ≤ 4 chars (thumbnail abbrev), use line 2.
   *   4. Normalise.
   */
  private extractPerformanceCompanyName(value: string | undefined | null): string {
    if (!value) return '';

    // 1. Strip "Listed: DD Mon YYYY" from anywhere in the cell
    const stripped = value
      .replace(/\r/g, '')
      .replace(/Listed:\s*\d+\s+\w+\s+\d{4}/gi, '')
      .replace(/Listed:/gi, '');

    // 2. Split into non-empty lines
    const rawLines = stripped
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) return '';

    // 3. Skip short abbreviation prefix (≤ 4 chars)
    let nameLine = rawLines[0];
    if (nameLine.length <= 4 && rawLines.length > 1) {
      nameLine = rawLines[1];
    }

    // 4. Normalise (strips Ltd, Limited, Pvt, Mainboard, SME, etc.)
    return normalizeCompanyName(nameLine);
  }

  /**
   * Calculate the standard IPO post-close timeline.
   * Uses local date arithmetic (not millisecond addition) to avoid DST issues.
   */
  private calculateTimeline(closeDate: Date | null) {
    if (!closeDate) {
      return { allotmentDate: null, refundDate: null, creditDate: null, listingDate: null };
    }

    function addDaysLocal(d: Date, n: number): Date {
      const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
      return result;
    }

    return {
      allotmentDate: addDaysLocal(closeDate, 1),
      refundDate: addDaysLocal(closeDate, 2),
      creditDate: addDaysLocal(closeDate, 2),
      listingDate: addDaysLocal(closeDate, 3),
    };
  }

  /**
   * Build a minimal but complete IPO create payload.
   */
  private buildCreateData(
    companyName: string,
    slug: string,
    type: IPOType
  ): Prisma.IPOCreateInput {
    return {
      companyName,
      slug,
      type,
      status: IPOStatus.UPCOMING,
      exchange: Exchange.NSE_BSE,
      ratingFireCount: 0,
      metaTitle: `${companyName} IPO Details & GMP`,
      metaDescription: `Latest ${companyName} IPO price, GMP, issue dates and listing information.`,
      canonicalUrl: `/ipo/${slug}`,
    };
  }

  private maxDecimal(a: Prisma.Decimal | null, b: Prisma.Decimal | null): Prisma.Decimal | null {
    if (!a && !b) return null;
    if (!a) return b;
    if (!b) return a;
    return a.gt(b) ? a : b;
  }

  private minDecimal(a: Prisma.Decimal | null, b: Prisma.Decimal | null): Prisma.Decimal | null {
    if (!a && !b) return null;
    if (!a) return b;
    if (!b) return a;
    return a.lt(b) ? a : b;
  }

  /**
   * Create a GMP history record only if the GMP value has changed since the
   * last recorded entry. This prevents duplicate rows on repeated hourly syncs.
   *
   * Returns true if a new record was created, false if skipped.
   */
  private async upsertGmpHistoryIfChanged(
    ipoId: string,
    gmp: Prisma.Decimal,
    expectedListingGain: Prisma.Decimal | null
  ): Promise<boolean> {
    // Get the most recent GMP history entry
    const latest = await prisma.gMPHistory.findFirst({
      where: { ipoId },
      orderBy: { recordedAt: 'desc' },
      select: { gmp: true },
    });

    // If GMP has not changed, skip
    if (latest && latest.gmp.equals(gmp)) {
      return false;
    }

    await prisma.gMPHistory.create({
      data: {
        ipoId,
        gmp,
        // kostak and subjectToSauda are intentionally null — not tracked
        expectedListingGain: expectedListingGain ?? null,
      },
    });

    return true;
  }

  // ============================================================
  // 1. LIVE IPO GMP
  // ============================================================

  /**
   * Syncs the "Live IPO GMP" sheet.
   *
   * COLUMNS USED (read-only from sheet):
   *   A = Company + date range (two lines)
   *   B = Issue Price
   *   C = IPO GMP
   *   D = GMP %
   *
   * Kostak (column E+) is intentionally IGNORED.
   *
   * MEMBERSHIP RECONCILIATION:
   *   After processing all rows we collect the set of slugs that are
   *   currently in the sheet.  We then:
   *     - Set isLiveGmp = true  for all IPOs in the current sheet.
   *     - Set isLiveGmp = false for all IPOs NOT in the current sheet.
   *
   *   This means /api/gmp/live (which filters on isLiveGmp = true) will
   *   ONLY return IPOs actually present in the Live IPO GMP sheet right now,
   *   regardless of what is already in the database.
   */
  async syncLiveGMP(): Promise<void> {
    const sheetName = 'Live IPO GMP';
    const startedAt = new Date();
    let rowsRead = 0, rowsSkipped = 0, rowsCreated = 0, rowsUpdated = 0, rowsFailed = 0;
    let errorMessage: string | undefined;

    // Track which slugs are present in the CURRENT sheet
    const liveGmpSlugs = new Set<string>();

    try {
      // Read only columns A–D (Company, Issue Price, IPO GMP, GMP %)
      // Kostak and other columns are intentionally excluded from the range.
      const rows = await getSheetRowsWithRetry(`${sheetName}!A2:D100`);
      rowsRead = rows.length;
      console.log(`[${sheetName}] Read ${rowsRead} rows from sheet`);

      for (const row of rows) {
        if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
          rowsSkipped++;
          continue;
        }

        try {
          // Column A: company name + date range on second line
          const parsed = this.extractGMPCompanyAndDates(row[0]);
          const { companyName, openDate, closeDate, detectedType } = parsed;

          if (!companyName || companyName.toLowerCase() === 'company') {
            rowsSkipped++;
            continue;
          }

          const slug = generateSlug(companyName);

          // Track this slug as currently live
          liveGmpSlugs.add(slug);

          // Column B: Issue Price
          const issuePrice = cleanToDecimalOrNull(row[1]);

          // Column C: IPO GMP (only this column — not Kostak)
          const gmp = this.parseGMP(row[2]);

          // Column D: GMP % (authoritative value from sheet)
          const sheetGmpPercent = this.parsePercent(row[3]);

          console.log(`[${sheetName}] Processing: "${companyName}" | slug="${slug}" | issuePrice=${issuePrice} | gmp=${gmp} | gmpPercent=${sheetGmpPercent}`);

          const existing = await this.ipoRepo.findBySlug(slug);
          const timeline = this.calculateTimeline(closeDate);
          const listingDate = existing?.listingDate ?? timeline.listingDate;
          const status = this.calculateStatus(openDate, closeDate, listingDate);
          const minimumInvestment = calculateMinimumInvestment(
            issuePrice,
            existing?.lotSize ?? null
          );

          // Determine the IPO type: prefer type already in DB, then detected from cell, else MAINBOARD
          const ipoType = existing?.type ?? detectedType ?? IPOType.MAINBOARD;

          // Compute GMP % to store — use sheet value if available, otherwise calculate
          const computedGmpPercent = sheetGmpPercent ?? calculateGmpPercent(gmp, issuePrice);

          if (!existing) {
            const createData = this.buildCreateData(companyName, slug, ipoType);
            await prisma.iPO.create({
              data: {
                ...createData,
                type: ipoType,
                status,
                priceMin: issuePrice,
                priceMax: issuePrice,
                issuePrice,
                openDate,
                closeDate,
                allotmentDate: timeline.allotmentDate,
                refundDate: timeline.refundDate,
                creditDate: timeline.creditDate,
                listingDate: timeline.listingDate,
                minimumInvestment: minimumInvestment ?? null,
                isLiveGmp: true,
                currentGmpPercent: computedGmpPercent,
              },
            });
            rowsCreated++;
          } else {
            await prisma.iPO.update({
              where: { id: existing.id },
              data: {
                status,
                currentGmpPercent: computedGmpPercent,
                ...(issuePrice !== null ? { priceMin: issuePrice, priceMax: issuePrice, issuePrice } : {}),
                ...(openDate ? { openDate } : {}),
                ...(closeDate ? { closeDate } : {}),
                ...(timeline.allotmentDate ? { allotmentDate: timeline.allotmentDate } : {}),
                ...(timeline.refundDate ? { refundDate: timeline.refundDate } : {}),
                ...(timeline.creditDate ? { creditDate: timeline.creditDate } : {}),
                ...(timeline.listingDate && !existing.listingDate ? { listingDate: timeline.listingDate } : {}),
                ...(minimumInvestment ? { minimumInvestment } : {}),
              },
            });
            rowsUpdated++;
          }

          // Record GMP history only if value changed (prevents hourly duplicates)
          if (gmp !== null) {
            const ipoRecord = existing ?? await this.ipoRepo.findBySlug(slug);
            if (ipoRecord) {
              const created = await this.upsertGmpHistoryIfChanged(
                ipoRecord.id,
                gmp,
                computedGmpPercent
              );
              if (created) {
                console.log(`[${sheetName}] GMP history created for "${companyName}": ${gmp}`);
              } else {
                console.log(`[${sheetName}] GMP unchanged for "${companyName}" — no new history row`);
              }
            }
          }
        } catch (rowError) {
          console.error(`[${sheetName}] Failed row:`, row, rowError);
          rowsFailed++;
        }
      }

      // ── MEMBERSHIP RECONCILIATION ──────────────────────────────────────────
      // Set isLiveGmp = true  for all slugs seen in the current sheet.
      // Set isLiveGmp = false for every other IPO (including ones that were
      // previously live but are no longer in the sheet).
      //
      // This is the key step that prevents stale records from appearing in
      // /api/gmp/live.  We do NOT delete any records; we just flip the flag.

      if (liveGmpSlugs.size > 0) {
        const slugArray = Array.from(liveGmpSlugs);

        // Mark current sheet members as live
        await prisma.iPO.updateMany({
          where: { slug: { in: slugArray } },
          data: { isLiveGmp: true },
        });

        // Clear the flag for every IPO NOT in the current sheet
        await prisma.iPO.updateMany({
          where: { slug: { notIn: slugArray } },
          data: { isLiveGmp: false },
        });

        console.log(
          `[${sheetName}] Reconciliation: ${slugArray.length} IPOs marked as live: [${slugArray.join(', ')}]`
        );
      } else {
        // If the sheet came back empty (API error?), do NOT wipe all flags —
        // that would incorrectly hide everything.  Just log and skip.
        console.warn(
          `[${sheetName}] No slugs collected — skipping reconciliation to avoid clearing all live flags.`
        );
      }
    } catch (error: any) {
      errorMessage = error?.message ?? String(error);
      console.error(`[${sheetName}] Sync failed:`, error);
    } finally {
      await this.writeSyncLog(
        sheetName, startedAt,
        rowsRead, rowsSkipped, rowsCreated, rowsUpdated, rowsFailed,
        errorMessage
      );
    }
  }

  // ============================================================
  // 2. MAINBOARD IPO
  // ============================================================

  async syncMainboardIPO(): Promise<void> {
    await this.syncIpoTypeWorksheet('Mainboard IPO', IPOType.MAINBOARD);
  }

  // ============================================================
  // 3. SME IPO
  // ============================================================

  async syncSMEIPO(): Promise<void> {
    await this.syncIpoTypeWorksheet('SME IPO', IPOType.SME);
  }

  /**
   * Syncs either "Mainboard IPO" or "SME IPO" sheet.
   *
   * COLUMNS USED:
   *   A = Company
   *   B = Issue Price (or "-")
   *   C = Size in Cr (or "-")
   *   D = Issue Dates
   *
   * "-" values are stored as NULL, never as 0.
   *
   * Lot size is NOT in these sheets; it is preserved from existing records.
   * Listing date is NOT overwritten by this sheet.
   *
   * sheetRowOrder is stored (1-based row index from the Google Sheet)
   * so the frontend can render in the same order as the sheet.
   */
  private async syncIpoTypeWorksheet(sheetName: string, type: IPOType): Promise<void> {
    const startedAt = new Date();
    let rowsRead = 0, rowsSkipped = 0, rowsCreated = 0, rowsUpdated = 0, rowsFailed = 0;
    let errorMessage: string | undefined;

    const currentSlugs = new Set<string>();

    try {
      const rows = await getSheetRowsWithRetry(`${sheetName}!A2:D100`);
      rowsRead = rows.length;
      console.log(`[${sheetName}] Read ${rowsRead} rows from sheet`);

      let sheetRowOrder = 1; // 1-based, incremented for each non-skipped row

      for (const row of rows) {
        if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
          rowsSkipped++;
          continue;
        }

        try {
          const companyName = this.getCompanyName(row[0]);
          if (!companyName || companyName.toLowerCase() === 'company') {
            rowsSkipped++;
            continue;
          }

          const slug = generateSlug(companyName);
          currentSlugs.add(slug);

          const priceRange = this.parsePriceRange(row[1]);
          const issueSizeCr = this.parseIssueSize(row[2]);
          const dates = this.tryParseDateRange(row[3]);
          const { openDate, closeDate } = dates;

          console.log(`[${sheetName}] Row ${sheetRowOrder}: "${companyName}" | slug="${slug}" | openDate=${openDate} | closeDate=${closeDate}`);

          const existing = await this.ipoRepo.findBySlug(slug);
          const lotSize = existing?.lotSize ?? null;
          const issuePrice = priceRange.max ?? priceRange.min ?? existing?.issuePrice ?? null;
          const minimumInvestment = calculateMinimumInvestment(issuePrice, lotSize);
          const listingDate = existing?.listingDate ?? null;
          const status = this.calculateStatus(openDate, closeDate, listingDate);
          const timeline = this.calculateTimeline(closeDate);

          if (!existing) {
            const createData = this.buildCreateData(companyName, slug, type);
            await prisma.iPO.create({
              data: {
                ...createData,
                type,
                status,
                priceMin: priceRange.min,
                priceMax: priceRange.max,
                issuePrice: issuePrice ?? null,
                issueSizeCr: issueSizeCr ?? null,
                lotSize: null,
                minimumInvestment: minimumInvestment ?? null,
                openDate,
                closeDate,
                allotmentDate: timeline.allotmentDate,
                refundDate: timeline.refundDate,
                creditDate: timeline.creditDate,
                listingDate: timeline.listingDate,
                isCurrentMainboard: type === IPOType.MAINBOARD,
                isCurrentSme: type === IPOType.SME,
                sheetRowOrder,
              },
            });
            rowsCreated++;
          } else {
            await prisma.iPO.update({
              where: { id: existing.id },
              data: {
                type,
                status,
                priceMin: priceRange.min,
                priceMax: priceRange.max,
                ...(issuePrice !== null ? { issuePrice } : {}),
                ...(issueSizeCr !== null ? { issueSizeCr } : {}),
                ...(openDate ? { openDate } : {}),
                ...(closeDate ? { closeDate } : {}),
                ...(timeline.allotmentDate ? { allotmentDate: timeline.allotmentDate } : {}),
                ...(timeline.refundDate ? { refundDate: timeline.refundDate } : {}),
                ...(timeline.creditDate ? { creditDate: timeline.creditDate } : {}),
                isCurrentMainboard: type === IPOType.MAINBOARD,
                isCurrentSme: type === IPOType.SME,
                sheetRowOrder,
                // Do NOT overwrite listingDate — performance sheet supplies that.
              },
            });
            rowsUpdated++;
          }

          sheetRowOrder++;
        } catch (rowError) {
          console.error(`[${sheetName}] Failed row:`, row, rowError);
          rowsFailed++;
        }
      }

      // ── MEMBERSHIP RECONCILIATION ──────────────────────────────────────────
      if (currentSlugs.size > 0) {
        const slugArray = Array.from(currentSlugs);
        if (type === IPOType.MAINBOARD) {
          // Set isCurrentMainboard = true for current sheet members
          await prisma.iPO.updateMany({
            where: { slug: { in: slugArray } },
            data: { isCurrentMainboard: true },
          });
          // Set isCurrentMainboard = false for all other Mainboard IPOs
          await prisma.iPO.updateMany({
            where: { slug: { notIn: slugArray }, type: IPOType.MAINBOARD },
            data: { isCurrentMainboard: false },
          });
          console.log(`[${sheetName}] Reconciliation: ${slugArray.length} IPOs marked as current Mainboard: [${slugArray.join(', ')}]`);
        } else {
          // Set isCurrentSme = true for current sheet members
          await prisma.iPO.updateMany({
            where: { slug: { in: slugArray } },
            data: { isCurrentSme: true },
          });
          // Set isCurrentSme = false for all other SME IPOs
          await prisma.iPO.updateMany({
            where: { slug: { notIn: slugArray }, type: IPOType.SME },
            data: { isCurrentSme: false },
          });
          console.log(`[${sheetName}] Reconciliation: ${slugArray.length} IPOs marked as current SME: [${slugArray.join(', ')}]`);
        }
      } else {
        console.warn(`[${sheetName}] No slugs collected — skipping reconciliation.`);
      }
    } catch (error: any) {
      errorMessage = error?.message ?? String(error);
      console.error(`[${sheetName}] Sync failed:`, error);
    } finally {
      await this.writeSyncLog(
        sheetName, startedAt,
        rowsRead, rowsSkipped, rowsCreated, rowsUpdated, rowsFailed,
        errorMessage
      );
    }
  }

  // ============================================================
  // 4. MAINBOARD PERFORMANCE
  // ============================================================

  async syncMainboardPerformance(): Promise<void> {
    await this.syncPerformanceWorksheet('Mainboard IPO Performance', IPOType.MAINBOARD);
  }

  // ============================================================
  // 5. SME PERFORMANCE
  // ============================================================

  async syncSMEPerformance(): Promise<void> {
    await this.syncPerformanceWorksheet('SME IPO Performance', IPOType.SME);
  }

  /**
   * Syncs a Performance sheet.
   *
   * COLUMNS USED:
   *   A = IPO Name  (may have abbreviated prefix + Listed: suffix — see extractor)
   *   B = Issue Price
   *   C = Listing Price
   *   D = Listing Gain %
   *   E = Current Price
   *   F = CMP Gain %
   *
   * "N/A", "--", "-", empty → NULL.  Never store 0 for unavailable values.
   *
   * sheetRowOrder is stored from the Google Sheet row index so the frontend
   * can display entries in exactly the sheet's order (newest-first).
   */
  private async syncPerformanceWorksheet(sheetName: string, type: IPOType): Promise<void> {
    const startedAt = new Date();
    let rowsRead = 0, rowsSkipped = 0, rowsCreated = 0, rowsUpdated = 0, rowsFailed = 0;
    let errorMessage: string | undefined;

    try {
      const rows = await getSheetRowsWithRetry(`${sheetName}!A2:F100`);
      rowsRead = rows.length;
      console.log(`[${sheetName}] Read ${rowsRead} rows from sheet`);

      let sheetRowOrder = 1;

      for (const row of rows) {
        if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
          rowsSkipped++;
          continue;
        }

        try {
          const companyName = this.extractPerformanceCompanyName(row[0]);
          if (
            !companyName ||
            companyName.toLowerCase() === 'ipo name' ||
            companyName.toLowerCase() === 'company'
          ) {
            rowsSkipped++;
            continue;
          }

          const slug = generateSlug(companyName);

          const issuePrice = cleanToDecimalOrNull(row[1]);
          const listingPrice = cleanToDecimalOrNull(row[2]);
          const listingGain = this.parsePercent(row[3]);
          const currentPrice = cleanToDecimalOrNull(row[4]);
          const currentGain = this.parsePercent(row[5]);

          console.log(`[${sheetName}] Row ${sheetRowOrder}: "${companyName}" | slug="${slug}" | issuePrice=${issuePrice} | listingPrice=${listingPrice} | currentPrice=${currentPrice}`);

          let ipo = await this.ipoRepo.findBySlug(slug);

          if (!ipo) {
            const createData = this.buildCreateData(companyName, slug, type);
            await prisma.iPO.create({
              data: {
                ...createData,
                type,
                status: IPOStatus.LISTED,
                issuePrice: issuePrice ?? null,
                priceMin: issuePrice ?? null,
                priceMax: issuePrice ?? null,
                sheetRowOrder,
              },
            });
            ipo = await this.ipoRepo.findBySlug(slug);
            if (!ipo) throw new Error(`Unable to create IPO: ${companyName}`);
            rowsCreated++;
          } else {
            await prisma.iPO.update({
              where: { id: ipo.id },
              data: {
                type,
                status: IPOStatus.LISTED,
                sheetRowOrder,
                ...(issuePrice !== null
                  ? {
                    issuePrice,
                    priceMin: ipo.priceMin ?? issuePrice,
                    priceMax: ipo.priceMax ?? issuePrice,
                  }
                  : {}),
              },
            });
            rowsUpdated++;
          }

          const allTimeHigh = this.maxDecimal(listingPrice, currentPrice);
          const allTimeLow = this.minDecimal(listingPrice, currentPrice);

          await prisma.listingPerformance.upsert({
            where: { ipoId: ipo.id },
            create: {
              ipoId: ipo.id,
              listingPrice,
              listingGainPercent: listingGain,
              currentPrice,
              currentGainPercent: currentGain,
              allTimeHigh,
              allTimeLow,
              lastUpdated: new Date(),
            },
            update: {
              listingPrice,
              listingGainPercent: listingGain,
              currentPrice,
              currentGainPercent: currentGain,
              allTimeHigh,
              allTimeLow,
              lastUpdated: new Date(),
            },
          });

          sheetRowOrder++;
        } catch (rowError) {
          console.error(`[${sheetName}] Failed row:`, row, rowError);
          rowsFailed++;
        }
      }
    } catch (error: any) {
      errorMessage = error?.message ?? String(error);
      console.error(`[${sheetName}] Sync failed:`, error);
    } finally {
      await this.writeSyncLog(
        sheetName, startedAt,
        rowsRead, rowsSkipped, rowsCreated, rowsUpdated, rowsFailed,
        errorMessage
      );
    }
  }

  // ============================================================
  // 6. LIVE IPO SUMMARY
  // ============================================================

  /**
   * Syncs the "Live IPO Summary" sheet.
   *
   * COLUMNS USED:
   *   A = IPO name + metadata (type, dates)
   *   B = Price range + lot size + minimum investment (multi-line cell)
   *   C = GMP
   *   D = Subscription
   *   E = Review
   *   F = GMP Trend (intentionally ignored — no schema field)
   */
  async syncLiveSummary(): Promise<void> {
    const sheetName = 'Live IPO Summary';
    const startedAt = new Date();
    let rowsRead = 0, rowsSkipped = 0, rowsCreated = 0, rowsUpdated = 0, rowsFailed = 0;
    let errorMessage: string | undefined;

    const currentSlugs = new Set<string>();

    try {
      const rows = await getSheetRowsWithRetry(`${sheetName}!A2:F100`);
      rowsRead = rows.length;
      console.log(`[${sheetName}] Read ${rowsRead} rows from sheet`);

      for (const row of rows) {
        if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
          rowsSkipped++;
          continue;
        }

        try {
          const colALines = this.lines(row[0]);
          if (colALines.length === 0) { rowsSkipped++; continue; }

          // First line of column A is the company name
          const companyName = normalizeCompanyName(colALines[0]);
          if (!companyName || companyName.toLowerCase() === 'ipo') {
            rowsSkipped++;
            continue;
          }

          const slug = generateSlug(companyName);
          currentSlugs.add(slug);

          // Remaining lines of column A contain metadata (type, dates)
          const metaText = colALines.slice(1).join(' ');
          const sourceType = this.parseIPOType(metaText);
          const dates = this.tryParseDateRange(metaText);

          let ipo = await this.ipoRepo.findBySlug(slug);
          if (!ipo) {
            const createData = this.buildCreateData(companyName, slug, sourceType ?? IPOType.MAINBOARD);
            await prisma.iPO.create({
              data: {
                ...createData,
                type: sourceType ?? IPOType.MAINBOARD,
                status: this.calculateStatus(dates.openDate, dates.closeDate, null),
                openDate: dates.openDate,
                closeDate: dates.closeDate,
                isLiveSummary: true,
              },
            });
            ipo = await this.ipoRepo.findBySlug(slug);
            if (!ipo) throw new Error(`Unable to create IPO from Summary: ${companyName}`);
            rowsCreated++;
          }

          // Column B: multi-line cell with price, lot size, minimum investment
          const colBLines = this.lines(row[1]);
          const priceRange = this.parsePriceRange(colBLines[0] ?? '');
          let lotSize: number | null = null;
          let minimumInvestment: Prisma.Decimal | null = null;
          for (const line of colBLines) {
            if (!lotSize) lotSize = this.parseLotSize(line);
            if (!minimumInvestment) minimumInvestment = this.parseMinimumInvestment(line);
          }
          // Preserve existing lot size if sheet doesn't provide one
          if (!lotSize && ipo.lotSize) lotSize = ipo.lotSize;

          const issuePrice = priceRange.max ?? priceRange.min ?? ipo.issuePrice ?? null;

          // If sheet provides both lot size and issue price but no min investment, calculate it
          if (!minimumInvestment && issuePrice && lotSize) {
            minimumInvestment = calculateMinimumInvestment(issuePrice, lotSize);
          }

          // Column C: GMP
          const gmp = this.parseGMP(row[2]);

          // Column D: Subscription (total only — QIB/NII/Retail not available)
          const subscription = this.parseSubscriptionValue(row[3]);

          // Column E: Review text
          const review = (row[4] ?? '').trim();

          // F (GMP Trend) is intentionally ignored

          const status = this.calculateStatus(
            dates.openDate ?? ipo.openDate,
            dates.closeDate ?? ipo.closeDate,
            ipo.listingDate
          );

          await prisma.iPO.update({
            where: { id: ipo.id },
            data: {
              ...(sourceType ? { type: sourceType } : {}),
              status,
              ...(priceRange.min ? { priceMin: priceRange.min } : {}),
              ...(priceRange.max ? { priceMax: priceRange.max } : {}),
              ...(issuePrice ? { issuePrice } : {}),
              ...(lotSize ? { lotSize } : {}),
              ...(minimumInvestment ? { minimumInvestment } : {}),
              ...(dates.openDate ? { openDate: dates.openDate } : {}),
              ...(dates.closeDate ? { closeDate: dates.closeDate } : {}),
              ...(review ? { reviewSummary: review } : {}),
              isLiveSummary: true,
            },
          });

          // GMP history — only if changed
          if (gmp !== null) {
            const expectedGain = calculateGmpPercent(gmp, issuePrice);
            await this.upsertGmpHistoryIfChanged(ipo.id, gmp, expectedGain);
          }

          // Subscription history — only total is available; skip if not changed
          if (subscription !== null) {
            // Check if subscription value has changed
            const latestSub = await prisma.subscriptionHistory.findFirst({
              where: { ipoId: ipo.id },
              orderBy: { recordedAt: 'desc' },
              select: { total: true },
            });

            if (!latestSub || !latestSub.total.equals(subscription)) {
              await prisma.subscriptionHistory.create({
                data: {
                  ipoId: ipo.id,
                  total: subscription,
                  // retail/qib/nii/employee/shareholder/anchor intentionally null
                },
              });
            }
          }

          rowsUpdated++;
        } catch (rowError) {
          console.error(`[${sheetName}] Failed row:`, row, rowError);
          rowsFailed++;
        }
      }

      // ── MEMBERSHIP RECONCILIATION ──────────────────────────────────────────
      if (currentSlugs.size > 0) {
        const slugArray = Array.from(currentSlugs);
        // Mark current sheet members as live summary
        await prisma.iPO.updateMany({
          where: { slug: { in: slugArray } },
          data: { isLiveSummary: true },
        });
        // Clear the flag for every IPO NOT in the current sheet
        await prisma.iPO.updateMany({
          where: { slug: { notIn: slugArray } },
          data: { isLiveSummary: false },
        });
        console.log(`[${sheetName}] Reconciliation: ${slugArray.length} IPOs marked as live summary`);
      } else {
        console.warn(`[${sheetName}] No slugs collected — skipping reconciliation.`);
      }
    } catch (error: any) {
      errorMessage = error?.message ?? String(error);
      console.error(`[${sheetName}] Sync failed:`, error);
    } finally {
      await this.writeSyncLog(
        sheetName, startedAt,
        rowsRead, rowsSkipped, rowsCreated, rowsUpdated, rowsFailed,
        errorMessage
      );
    }
  }

  // ============================================================
  // SYNC LOG
  // ============================================================

  private async writeSyncLog(
    sheetName: string,
    startedAt: Date,
    rowsRead: number,
    rowsSkipped: number,
    rowsCreated: number,
    rowsUpdated: number,
    rowsFailed: number,
    errorMessage?: string
  ): Promise<void> {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    let status: SyncStatus;
    if (errorMessage) {
      status = SyncStatus.FAILED;
    } else if (rowsFailed > 0) {
      status = SyncStatus.PARTIAL;
    } else {
      status = SyncStatus.SUCCESS;
    }

    const logErrorMessage: string | undefined =
      errorMessage ??
      (rowsFailed > 0
        ? `Partial: Read=${rowsRead} Skip=${rowsSkipped} Created=${rowsCreated} Updated=${rowsUpdated} Failed=${rowsFailed}`
        : undefined);

    console.log(
      `[SYNC LOG] ${sheetName} | status=${status} | read=${rowsRead} skip=${rowsSkipped} ` +
      `created=${rowsCreated} updated=${rowsUpdated} failed=${rowsFailed} | ${durationMs}ms`
    );

    try {
      await this.syncLogRepo.createLog({
        sheetName,
        status,
        recordsRead: rowsRead,
        recordsCreated: rowsCreated,
        recordsUpdated: rowsUpdated,
        recordsDeleted: 0,
        durationMs,
        errorMessage: logErrorMessage,
        startedAt,
        completedAt,
      });
    } catch (logError) {
      console.error(`[SYNC LOG] Failed to write log for ${sheetName}:`, logError);
    }
  }
}