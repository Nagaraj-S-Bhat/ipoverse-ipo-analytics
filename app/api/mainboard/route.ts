import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../repositories/ipoRepository';
import { serializeDateOnly } from '../../../utils/dateUtils';

export const dynamic = 'force-dynamic';

const ipoRepo = new IpoRepository();

export async function GET() {
  try {
    const mainboardIpos =
      await ipoRepo.findMainboard();

    const data = mainboardIpos.map((ipo) => {
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
          (Number(gmp) /
            Number(issuePrice)) *
          100;
      }

      return {
        id: ipo.id,

        companyName:
          ipo.companyName,

        symbol:
          ipo.symbol,

        slug:
          ipo.slug,

        type:
          ipo.type,

        board:
          'MAINBOARD',

        status:
          ipo.status,

        // Price
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

        // Size / lot
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

        // Dates — serialized as "YYYY-MM-DD" to prevent timezone shifts
        openDate: serializeDateOnly(ipo.openDate),
        closeDate: serializeDateOnly(ipo.closeDate),
        allotmentDate: serializeDateOnly(ipo.allotmentDate),
        refundDate: serializeDateOnly(ipo.refundDate),
        creditDate: serializeDateOnly(ipo.creditDate),
        listingDate: serializeDateOnly(ipo.listingDate),

        // GMP
        currentGmp:
          gmp !== null
            ? Number(gmp)
            : null,

        gmpPercent,

        estimatedListingPrice:
          issuePrice !== null &&
            gmp !== null
            ? Number(issuePrice) +
            Number(gmp)
            : null,

        // Subscription
        subscription:
          latestSubscription?.total !== null &&
            latestSubscription?.total !== undefined
            ? Number(
              latestSubscription.total
            )
            : null,

        qib:
          latestSubscription?.qib !== null &&
            latestSubscription?.qib !== undefined
            ? Number(
              latestSubscription.qib
            )
            : null,

        nii:
          latestSubscription?.nii !== null &&
            latestSubscription?.nii !== undefined
            ? Number(
              latestSubscription.nii
            )
            : null,

        retail:
          latestSubscription?.retail !== null &&
            latestSubscription?.retail !== undefined
            ? Number(
              latestSubscription.retail
            )
            : null,

        employee:
          latestSubscription?.employee !== null &&
            latestSubscription?.employee !== undefined
            ? Number(
              latestSubscription.employee
            )
            : null,

        shareholder:
          latestSubscription?.shareholder !== null &&
            latestSubscription?.shareholder !== undefined
            ? Number(
              latestSubscription.shareholder
            )
            : null,

        anchor:
          latestSubscription?.anchor !== null &&
            latestSubscription?.anchor !== undefined
            ? Number(
              latestSubscription.anchor
            )
            : null,

        // Company information
        companyLogo:
          ipo.companyLogo,

        companyDescription:
          ipo.companyDescription,

        website:
          ipo.website,

        sector:
          ipo.sector,

        industry:
          ipo.industry,

        exchange:
          ipo.exchange,

        // Other
        faceValue:
          ipo.faceValue !== null
            ? Number(ipo.faceValue)
            : null,

        registrarName:
          ipo.registrarName,

        registrarUrl:
          ipo.registrarUrl,

        reviewSummary:
          ipo.reviewSummary,

        ratingFireCount:
          ipo.ratingFireCount,

        gmpUpdatedAt:
          latestGmp?.recordedAt ??
          null,

        subscriptionUpdatedAt:
          latestSubscription?.recordedAt ??
          null,

        updatedAt: ipo.updatedAt,
        sheetRowOrder: ipo.sheetRowOrder,
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
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      '[GET /api/mainboard] Error:',
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