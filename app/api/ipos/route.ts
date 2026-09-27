import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../repositories/ipoRepository';
import { IPOType, IPOStatus } from '@prisma/client';
import { serializeDateOnly } from '../../../utils/dateUtils';


export const dynamic = 'force-dynamic';

const ipoRepo = new IpoRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    const rawPage =
      Number.parseInt(
        searchParams.get('page') ?? '1',
        10
      );

    const rawLimit =
      Number.parseInt(
        searchParams.get('limit') ?? '100',
        10
      );

    const page =
      Number.isFinite(rawPage) && rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 100;

    // ----------------------------------------------------------
    // Search
    // ----------------------------------------------------------

    const search =
      searchParams.get('search')?.trim() || undefined;

    // ----------------------------------------------------------
    // IPO Type
    // ----------------------------------------------------------

    const typeParam =
      searchParams.get('type')?.toUpperCase();

    const type =
      typeParam === 'MAINBOARD' ||
        typeParam === 'SME'
        ? (typeParam as IPOType)
        : undefined;

    // ----------------------------------------------------------
    // IPO Status
    // ----------------------------------------------------------

    const statusParam =
      searchParams.get('status')?.toUpperCase();

    const validStatuses =
      Object.values(IPOStatus);

    const status =
      validStatuses.includes(
        statusParam as IPOStatus
      )
        ? (statusParam as IPOStatus)
        : undefined;

    // ----------------------------------------------------------
    // Sorting
    // ----------------------------------------------------------

    const sort =
      searchParams.get('sort')?.trim() ||
      undefined;

    // ----------------------------------------------------------
    // Repository
    // ----------------------------------------------------------

    const {
      ipos,
      total,
    } = await ipoRepo.findMany({
      page,
      limit,
      search,
      type,
      status,
      sort,
    });

    // ----------------------------------------------------------
    // Transform database data for frontend
    // ----------------------------------------------------------

    const data = ipos.map((ipo) => {
      const latestGmp =
        ipo.gmpHistory?.[0] ?? null;

      const latestSubscription =
        ipo.subscriptionHistory?.[0] ?? null;

      const performance =
        ipo.listingPerformance ?? null;

      const issuePrice =
        ipo.issuePrice ??
        ipo.priceMax ??
        ipo.priceMin ??
        null;

      const currentGmp =
        latestGmp?.gmp ?? null;

      let gmpPercent: number | null = null;

      if (
        issuePrice !== null &&
        currentGmp !== null &&
        Number(issuePrice) !== 0
      ) {
        gmpPercent =
          (Number(currentGmp) /
            Number(issuePrice)) *
          100;
      }

      const estimatedListingPrice =
        issuePrice !== null &&
          currentGmp !== null
          ? Number(issuePrice) +
          Number(currentGmp)
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
        // Lot / investment
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

        openDate: serializeDateOnly(ipo.openDate),
        closeDate: serializeDateOnly(ipo.closeDate),
        allotmentDate: serializeDateOnly(ipo.allotmentDate),
        refundDate: serializeDateOnly(ipo.refundDate),
        creditDate: serializeDateOnly(ipo.creditDate),
        listingDate: serializeDateOnly(ipo.listingDate),

        // ------------------------------------------------------
        // GMP
        // ------------------------------------------------------

        currentGmp:
          currentGmp !== null
            ? Number(currentGmp)
            : null,

        gmp:
          currentGmp !== null
            ? Number(currentGmp)
            : null,

        gmpPercent,

        estimatedListingPrice,

        gmpUpdatedAt:
          latestGmp?.recordedAt ??
          null,

        // ------------------------------------------------------
        // Subscription
        // ------------------------------------------------------

        subscription:
          latestSubscription?.total !== undefined &&
            latestSubscription?.total !== null
            ? Number(
              latestSubscription.total
            )
            : null,

        subscriptionTotal:
          latestSubscription?.total !== undefined &&
            latestSubscription?.total !== null
            ? Number(
              latestSubscription.total
            )
            : null,

        qib:
          latestSubscription?.qib !== undefined &&
            latestSubscription?.qib !== null
            ? Number(
              latestSubscription.qib
            )
            : null,

        nii:
          latestSubscription?.nii !== undefined &&
            latestSubscription?.nii !== null
            ? Number(
              latestSubscription.nii
            )
            : null,

        retail:
          latestSubscription?.retail !== undefined &&
            latestSubscription?.retail !== null
            ? Number(
              latestSubscription.retail
            )
            : null,

        employee:
          latestSubscription?.employee !== undefined &&
            latestSubscription?.employee !== null
            ? Number(
              latestSubscription.employee
            )
            : null,

        shareholder:
          latestSubscription?.shareholder !== undefined &&
            latestSubscription?.shareholder !== null
            ? Number(
              latestSubscription.shareholder
            )
            : null,

        anchor:
          latestSubscription?.anchor !== undefined &&
            latestSubscription?.anchor !== null
            ? Number(
              latestSubscription.anchor
            )
            : null,

        subscriptionUpdatedAt:
          latestSubscription?.recordedAt ??
          null,

        // ------------------------------------------------------
        // Performance
        // ------------------------------------------------------

        listingPrice:
          performance?.listingPrice !== null &&
            performance?.listingPrice !== undefined
            ? Number(
              performance.listingPrice
            )
            : null,

        listingGainPercent:
          performance?.listingGainPercent !== null &&
            performance?.listingGainPercent !== undefined
            ? Number(
              performance.listingGainPercent
            )
            : null,

        currentPrice:
          performance?.currentPrice !== null &&
            performance?.currentPrice !== undefined
            ? Number(
              performance.currentPrice
            )
            : null,

        currentGainPercent:
          performance?.currentGainPercent !== null &&
            performance?.currentGainPercent !== undefined
            ? Number(
              performance.currentGainPercent
            )
            : null,

        allTimeHigh:
          performance?.allTimeHigh !== null &&
            performance?.allTimeHigh !== undefined
            ? Number(
              performance.allTimeHigh
            )
            : null,

        allTimeLow:
          performance?.allTimeLow !== null &&
            performance?.allTimeLow !== undefined
            ? Number(
              performance.allTimeLow
            )
            : null,

        performanceUpdatedAt:
          performance?.lastUpdated ??
          null,

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
        // IPO information
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

    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    const totalPages =
      total > 0
        ? Math.ceil(total / limit)
        : 0;

    return NextResponse.json(
      {
        success: true,

        data,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPrevPage:
            page > 1,
        },
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
      '[GET /api/ipos] Error:',
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