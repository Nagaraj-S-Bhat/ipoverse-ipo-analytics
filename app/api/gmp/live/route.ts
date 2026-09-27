import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../../repositories/ipoRepository';
import { serializeDateOnly } from '../../../../utils/dateUtils';

export const dynamic = 'force-dynamic';

const ipoRepo = new IpoRepository();

export async function GET() {
  try {
    const ipos = await ipoRepo.findLiveGMP();

    const data = ipos.map((ipo) => {
      const latestGmp = ipo.gmpHistory?.[0] ?? null;
      const latestSubscription = ipo.subscriptionHistory?.[0] ?? null;

      const issuePrice = ipo.issuePrice ?? ipo.priceMax ?? null;
      const gmp = latestGmp?.gmp ?? null;

      const subscriptionTotal =
        latestSubscription?.total !== null && latestSubscription?.total !== undefined
          ? Number(latestSubscription.total)
          : null;

      // Use the sheet's authoritative GMP % (currentGmpPercent) if available.
      // This is stored directly from Google Sheet column D during sync.
      // Fall back to recalculation only if the field is missing.
      const gmpPercent: number | null =
        ipo.currentGmpPercent !== null && ipo.currentGmpPercent !== undefined
          ? Number(ipo.currentGmpPercent)
          : issuePrice !== null && gmp !== null && Number(issuePrice) !== 0
            ? (Number(gmp) / Number(issuePrice)) * 100
            : null;

      const estimatedListingPrice =
        issuePrice !== null && gmp !== null
          ? Number(issuePrice) + Number(gmp)
          : null;

      return {
        id: ipo.id,
        companyName: ipo.companyName,
        slug: ipo.slug,
        symbol: ipo.symbol,

        type: ipo.type,
        board: ipo.type,

        status: ipo.status,

        issuePrice:
          issuePrice !== null
            ? Number(issuePrice)
            : null,

        priceMin:
          ipo.priceMin !== null
            ? Number(ipo.priceMin)
            : null,

        priceMax:
          ipo.priceMax !== null
            ? Number(ipo.priceMax)
            : null,

        currentGmp:
          gmp !== null
            ? Number(gmp)
            : null,

        gmpPercent,

        estimatedListingPrice,

        lotSize: ipo.lotSize,

        issueSizeCr:
          ipo.issueSizeCr !== null
            ? Number(ipo.issueSizeCr)
            : null,

        minimumInvestment:
          ipo.minimumInvestment !== null
            ? Number(ipo.minimumInvestment)
            : null,

        subscription: subscriptionTotal,
        subscriptionTotal,
        reviewSummary: ipo.reviewSummary,

        // Dates serialized as "YYYY-MM-DD" — no timezone shift
        openDate: serializeDateOnly(ipo.openDate),
        closeDate: serializeDateOnly(ipo.closeDate),
        listingDate: serializeDateOnly(ipo.listingDate),

        gmpUpdatedAt:
          latestGmp?.recordedAt ?? null,

        companyLogo: ipo.companyLogo,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length,
      },
      {
        status: 200,
        headers: {
          // Prevent Next.js from caching this API response.
          // After a sync the frontend must see fresh data immediately.
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      '[GET /api/gmp/live] Error:',
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