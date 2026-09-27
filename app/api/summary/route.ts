import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../repositories/ipoRepository';
import { serializeDateOnly } from '../../../utils/dateUtils';
import { IPOStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ipoRepo = new IpoRepository();

/**
 * Sort live summary records in this order:
 *   1. OPEN IPOs — ordered by closeDate ASC (nearest closing first)
 *   2. UPCOMING IPOs — ordered by openDate ASC (earliest opening first)
 *   3. Everything else — by companyName ASC
 */
function sortSummaryRecords<T extends {
  status: string;
  closeDate: string | null;
  openDate: string | null;
  companyName: string;
}>(records: T[]): T[] {
  const priority = (status: string): number => {
    const s = status?.toUpperCase();
    if (s === IPOStatus.OPEN) return 0;
    if (s === IPOStatus.UPCOMING) return 1;
    return 2;
  };

  return [...records].sort((a, b) => {
    const pa = priority(a.status);
    const pb = priority(b.status);

    if (pa !== pb) return pa - pb;

    // Within OPEN: closeDate ASC (nearest closing first)
    if (pa === 0) {
      if (a.closeDate && b.closeDate) return a.closeDate.localeCompare(b.closeDate);
      if (a.closeDate) return -1;
      if (b.closeDate) return 1;
    }

    // Within UPCOMING: openDate ASC (earliest opening first)
    if (pa === 1) {
      if (a.openDate && b.openDate) return a.openDate.localeCompare(b.openDate);
      if (a.openDate) return -1;
      if (b.openDate) return 1;
    }

    return a.companyName.localeCompare(b.companyName);
  });
}

export async function GET() {
  try {
    const liveSummary =
      await ipoRepo.findLiveSummary();

    const data = liveSummary.map((ipo) => {
      const latestGmp =
        ipo.gmpHistory?.[0] ?? null;

      const latestSubscription =
        ipo.subscriptionHistory?.[0] ?? null;

      const issuePrice =
        ipo.issuePrice ??
        ipo.priceMax ??
        ipo.priceMin ??
        null;

      const gmp =
        latestGmp?.gmp ?? null;

      let gmpPercent: number | null = null;

      if (
        issuePrice !== null &&
        gmp !== null &&
        Number(issuePrice) !== 0
      ) {
        gmpPercent =
          (Number(gmp) / Number(issuePrice)) * 100;
      }

      const estimatedListingPrice =
        issuePrice !== null &&
          gmp !== null
          ? Number(issuePrice) + Number(gmp)
          : null;

      return {
        // ------------------------------------------------------
        // Identity
        // ------------------------------------------------------

        id: ipo.id,

        companyName:
          ipo.companyName,

        symbol:
          ipo.symbol,

        slug:
          ipo.slug,

        // ------------------------------------------------------
        // Classification
        // ------------------------------------------------------

        type:
          ipo.type,

        board:
          ipo.type,

        status:
          ipo.status,

        exchange:
          ipo.exchange,

        // ------------------------------------------------------
        // Pricing
        // ------------------------------------------------------

        priceMin:
          ipo.priceMin !== null
            ? Number(ipo.priceMin)
            : null,

        priceMax:
          ipo.priceMax !== null
            ? Number(ipo.priceMax)
            : null,

        issuePrice:
          issuePrice !== null
            ? Number(issuePrice)
            : null,

        // ------------------------------------------------------
        // IPO size / lot
        // ------------------------------------------------------

        lotSize:
          ipo.lotSize,

        issueSizeCr:
          ipo.issueSizeCr !== null
            ? Number(ipo.issueSizeCr)
            : null,

        minimumInvestment:
          ipo.minimumInvestment !== null
            ? Number(ipo.minimumInvestment)
            : null,

        // ------------------------------------------------------
        // Dates
        // ------------------------------------------------------

        // Dates — serialized as "YYYY-MM-DD" to prevent timezone shifts
        openDate: serializeDateOnly(ipo.openDate),
        closeDate: serializeDateOnly(ipo.closeDate),
        allotmentDate: serializeDateOnly(ipo.allotmentDate),
        refundDate: serializeDateOnly(ipo.refundDate),
        creditDate: serializeDateOnly(ipo.creditDate),
        listingDate: serializeDateOnly(ipo.listingDate),

        // ------------------------------------------------------
        // GMP
        // ------------------------------------------------------

        gmp:
          gmp !== null
            ? Number(gmp)
            : null,

        currentGmp:
          gmp !== null
            ? Number(gmp)
            : null,

        gmpPercent,

        estimatedListingPrice,

        gmpUpdatedAt:
          latestGmp?.recordedAt ?? null,

        // ------------------------------------------------------
        // Subscription
        // ------------------------------------------------------

        subscription:
          latestSubscription?.total !== null &&
            latestSubscription?.total !== undefined
            ? Number(latestSubscription.total)
            : null,

        subscriptionTotal:
          latestSubscription?.total !== null &&
            latestSubscription?.total !== undefined
            ? Number(latestSubscription.total)
            : null,

        qib:
          latestSubscription?.qib !== null &&
            latestSubscription?.qib !== undefined
            ? Number(latestSubscription.qib)
            : null,

        nii:
          latestSubscription?.nii !== null &&
            latestSubscription?.nii !== undefined
            ? Number(latestSubscription.nii)
            : null,

        hni:
          latestSubscription?.nii !== null &&
            latestSubscription?.nii !== undefined
            ? Number(latestSubscription.nii)
            : null,

        retail:
          latestSubscription?.retail !== null &&
            latestSubscription?.retail !== undefined
            ? Number(latestSubscription.retail)
            : null,

        employee:
          latestSubscription?.employee !== null &&
            latestSubscription?.employee !== undefined
            ? Number(latestSubscription.employee)
            : null,

        shareholder:
          latestSubscription?.shareholder !== null &&
            latestSubscription?.shareholder !== undefined
            ? Number(latestSubscription.shareholder)
            : null,

        anchor:
          latestSubscription?.anchor !== null &&
            latestSubscription?.anchor !== undefined
            ? Number(latestSubscription.anchor)
            : null,

        subscriptionUpdatedAt:
          latestSubscription?.recordedAt ?? null,

        // ------------------------------------------------------
        // Company information
        // ------------------------------------------------------

        companyLogo:
          ipo.companyLogo,

        companyBanner:
          ipo.companyBanner,

        companyDescription:
          ipo.companyDescription,

        website:
          ipo.website,

        sector:
          ipo.sector,

        industry:
          ipo.industry,

        // ------------------------------------------------------
        // Additional IPO information
        // ------------------------------------------------------

        faceValue:
          ipo.faceValue !== null
            ? Number(ipo.faceValue)
            : null,

        leadManager:
          ipo.leadManager,

        registrarName:
          ipo.registrarName,

        registrarUrl:
          ipo.registrarUrl,

        prospectusUrl:
          ipo.prospectusUrl,

        drhpUrl:
          ipo.drhpUrl,

        isin:
          ipo.isin,

        marketMaker:
          ipo.marketMaker,

        listingAt:
          ipo.listingAt,

        // ------------------------------------------------------
        // Review
        // ------------------------------------------------------

        reviewSummary:
          ipo.reviewSummary,

        ratingFireCount:
          ipo.ratingFireCount,

        // ------------------------------------------------------
        // System
        // ------------------------------------------------------

        createdAt:
          ipo.createdAt,

        updatedAt:
          ipo.updatedAt,
      };
    });

    // Apply correct ordering:
    //   1. Open IPOs → closeDate ASC (nearest closing first)
    //   2. Upcoming IPOs → openDate ASC
    //   3. Others → companyName ASC
    const sortedData = sortSummaryRecords(data);

    return NextResponse.json(
      {
        success: true,
        data: sortedData,
        count: sortedData.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      '[GET /api/summary] Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}