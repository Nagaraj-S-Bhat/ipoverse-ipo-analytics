import { NextResponse } from 'next/server';
import { SyncService } from '../../../../services/sync/syncService';

const syncService = new SyncService();

export async function POST() {
  try {
    // Execute synchronization sequentially
    await syncService.syncAll();

    return NextResponse.json(
      {
        success: true,
        message: 'Synchronization triggered and completed successfully.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[POST /api/admin/sync] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sync execution' },
      { status: 500 }
    );
  }
}
