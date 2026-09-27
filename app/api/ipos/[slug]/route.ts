import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../../repositories/ipoRepository';
import { serializeDateOnly } from '../../../../utils/dateUtils';

export const dynamic = 'force-dynamic';

const ipoRepo = new IpoRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug parameter is required',
        },
        { status: 400 }
      );
    }

    const ipo = await ipoRepo.findBySlug(slug);

    if (!ipo) {
      return NextResponse.json(
        {
          success: false,
          error: 'IPO listing not found',
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // Latest GMP
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    const data = {
      // Identity
      id: ipo.id,
      companyName: ipo.companyName,
      symbol: ipo.symbol,
      slug: ipo.slug,

      // Classification
      type: ipo.type,
      board: ipo.type,
      status: ipo.status,
      exchange: ipo.exchange,

      // Pricing
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

      faceValue:
        ipo.faceValue !== null
          ? Number(ipo.faceValue)
          : null,

      // Lot / investment
      lotSize: ipo.lotSize,

      issueSizeCr:
        ipo.issueSizeCr !== null
          ? Number(ipo.issueSizeCr)
          : null,

      minimumInvestment:
        ipo.minimumInvestment !== null
          ? Number(ipo.minimumInvestment)
          : null,

      // Dates
      openDate: serializeDateOnly(ipo.openDate),
      closeDate: serializeDateOnly(ipo.closeDate),
      allotmentDate: serializeDateOnly(ipo.allotmentDate),
      refundDate: serializeDateOnly(ipo.refundDate),
      creditDate: serializeDateOnly(ipo.creditDate),
      listingDate: serializeDateOnly(ipo.listingDate),

      // GMP summary
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
        latestGmp?.recordedAt ?? null,

      // --------------------------------------------------------
      // Complete GMP history
      // --------------------------------------------------------

      gmpHistory:
        ipo.gmpHistory.map((item) => ({
          id: item.id,

          gmp:
            Number(item.gmp),

          kostak:
            Number(item.kostak),

          subjectToSauda:
            Number(item.subjectToSauda),

          expectedListingGain:
            Number(
              item.expectedListingGain
            ),

          recordedAt:
            item.recordedAt,
        })),

      // --------------------------------------------------------
      // Latest subscription
      // --------------------------------------------------------

      subscription:
        latestSubscription
          ? {
            retail:
              Number(
                latestSubscription.retail
              ),

            qib:
              Number(
                latestSubscription.qib
              ),

            nii:
              Number(
                latestSubscription.nii
              ),

            hni:
              Number(
                latestSubscription.nii
              ),

            employee:
              Number(
                latestSubscription.employee
              ),

            shareholder:
              Number(
                latestSubscription.shareholder
              ),

            anchor:
              Number(
                latestSubscription.anchor
              ),

            total:
              Number(
                latestSubscription.total
              ),

            recordedAt:
              latestSubscription.recordedAt,
          }
          : null,

      subscriptionHistory:
        ipo.subscriptionHistory.map(
          (item) => ({
            id: item.id,

            retail:
              Number(item.retail),

            qib:
              Number(item.qib),

            nii:
              Number(item.nii),

            hni:
              Number(item.nii),

            employee:
              Number(item.employee),

            shareholder:
              Number(item.shareholder),

            anchor:
              Number(item.anchor),

            total:
              Number(item.total),

            recordedAt:
              item.recordedAt,
          })
        ),

      // --------------------------------------------------------
      // Listing performance
      // --------------------------------------------------------

      listingPerformance:
        performance
          ? {
            listingPrice:
              performance.listingPrice !== null
                ? Number(
                  performance.listingPrice
                )
                : null,

            listingGainPercent:
              performance.listingGainPercent !== null
                ? Number(
                  performance.listingGainPercent
                )
                : null,

            currentPrice:
              performance.currentPrice !== null
                ? Number(
                  performance.currentPrice
                )
                : null,

            currentGainPercent:
              performance.currentGainPercent !== null
                ? Number(
                  performance.currentGainPercent
                )
                : null,

            allTimeHigh:
              performance.allTimeHigh !== null
                ? Number(
                  performance.allTimeHigh
                )
                : null,

            allTimeLow:
              performance.allTimeLow !== null
                ? Number(
                  performance.allTimeLow
                )
                : null,

            lastUpdated:
              performance.lastUpdated,
          }
          : null,

      // Company information
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

      // IPO information
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

      // Reservations
      employeeReservation:
        ipo.employeeReservation !== null
          ? Number(
            ipo.employeeReservation
          )
          : null,

      shareholderReservation:
        ipo.shareholderReservation !== null
          ? Number(
            ipo.shareholderReservation
          )
          : null,

      // Review / SEO
      reviewSummary:
        ipo.reviewSummary,

      ratingFireCount:
        ipo.ratingFireCount,

      searchKeywords:
        ipo.searchKeywords,

      metaTitle:
        ipo.metaTitle,

      metaDescription:
        ipo.metaDescription,

      canonicalUrl:
        ipo.canonicalUrl,

      // System
      createdAt:
        ipo.createdAt,

      updatedAt:
        ipo.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '[GET /api/ipos/[slug]] Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: null,
      },
      { status: 500 }
    );
  }
}