import { NextResponse } from 'next/server';
import { SyncLogRepository } from '../../../../../repositories/syncLogRepository';

const syncLogRepo = new SyncLogRepository();

export async function GET() {
  try {
    const latestLog = await syncLogRepo.getGlobalLatestLog();

    if (!latestLog) {
      return NextResponse.json(
        {
          success: true,
          message: 'No synchronization logs found in the database.',
          data: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          lastSync: latestLog.completedAt,
          status: latestLog.status,
          durationMs: latestLog.durationMs,
          recordsRead: latestLog.recordsRead,
          recordsUpdated: latestLog.recordsUpdated,
          recordsCreated: latestLog.recordsCreated,
          recordsDeleted: latestLog.recordsDeleted,
          sheetName: latestLog.sheetName,
          errorMessage: latestLog.errorMessage,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[GET /api/admin/sync/status] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
