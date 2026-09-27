import { NextResponse } from 'next/server';
import { IpoRepository } from '../../../../repositories/ipoRepository';
import { IPOType } from '@prisma/client';
import { serializeDateOnly } from '../../../../utils/dateUtils';

const ipoRepo = new IpoRepository();

function toNum(val: any): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ipos = await ipoRepo.findPerformance(IPOType.SME);

    // Google Sheet order: rows synced from the sheet have sheetRowOrder > 0 (1, 2, 3...)
    // Unranked/historical rows (sheetRowOrder 0 or null) appear after the sheet rows.
    ipos.sort((a, b) => {
      const orderA = a.sheetRowOrder && a.sheetRowOrder > 0 ? a.sheetRowOrder : Infinity;
      const orderB = b.sheetRowOrder && b.sheetRowOrder > 0 ? b.sheetRowOrder : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.listingDate ? new Date(a.listingDate).getTime() : 0;
      const dateB = b.listingDate ? new Date(b.listingDate).getTime() : 0;
      return dateB - dateA;
    });

    const data = ipos.map((ipo) => {
      const perf = ipo.listingPerformance;
      const latestGmp = ipo.gmpHistory?.[0] ?? null;

      return {
        id: ipo.id,
        companyName: ipo.companyName,
        slug: ipo.slug,
        type: ipo.type,
        status: ipo.status,

        sheetRowOrder: ipo.sheetRowOrder,

        issuePrice: toNum(ipo.issuePrice ?? ipo.priceMax ?? ipo.priceMin),
        priceMin: toNum(ipo.priceMin),
        priceMax: toNum(ipo.priceMax),

        openDate: serializeDateOnly(ipo.openDate),
        closeDate: serializeDateOnly(ipo.closeDate),
        listingDate: serializeDateOnly(ipo.listingDate),

        listingPrice: toNum(perf?.listingPrice),
        listingGainPercent: toNum(perf?.listingGainPercent),
        currentPrice: toNum(perf?.currentPrice),
        currentGainPercent: toNum(perf?.currentGainPercent),
        allTimeHigh: toNum(perf?.allTimeHigh),
        allTimeLow: toNum(perf?.allTimeLow),
        lastUpdated: perf?.lastUpdated ?? null,

        currentGmp: latestGmp ? toNum(latestGmp.gmp) : null,
        gmpUpdatedAt: latestGmp?.recordedAt ?? null,

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
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/sme/performance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: [],
      },
      { status: 500 }
    );
  }
}
