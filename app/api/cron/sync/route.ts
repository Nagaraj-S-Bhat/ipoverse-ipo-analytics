import { NextResponse } from 'next/server';
import { SyncService } from '../../../../services/sync/syncService';

/**
 * Vercel Cron handler for hourly Google Sheets synchronization.
 *
 * Configured in vercel.json:
 *   { "crons": [{ "path": "/api/cron/sync", "schedule": "0 * * * *" }] }
 *
 * Vercel automatically sends an `Authorization: Bearer <CRON_SECRET>` header
 * when invoking the cron. We validate this to prevent unauthorized triggers.
 *
 * For local development, trigger a manual sync instead at:
 *   POST /api/admin/sync
 *
 * Reference:
 *   https://vercel.com/docs/cron-jobs
 */

const syncService = new SyncService();

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // In production on Vercel, CRON_SECRET must be set.
  // In local development (no CRON_SECRET set), we still allow the call
  // so you can test the cron handler directly if needed.
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization');
    const expectedHeader = `Bearer ${cronSecret}`;

    if (!authHeader || authHeader !== expectedHeader) {
      console.warn('[GET /api/cron/sync] Unauthorized attempt.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    console.log('[GET /api/cron/sync] Hourly cron triggered — starting syncAll()');
    await syncService.syncAll();
    console.log('[GET /api/cron/sync] syncAll() completed successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Hourly sync completed successfully.',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('[GET /api/cron/sync] Error during sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error?.message ?? String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
