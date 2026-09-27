import { prisma } from '../lib/prisma';
import { type Prisma, type SyncLog } from '@prisma/client';

export class SyncLogRepository {
  /**
   * Logs a synchronization event into the sync_logs table
   */
  async createLog(data: Prisma.SyncLogCreateInput): Promise<SyncLog> {
    return prisma.syncLog.create({
      data,
    });
  }

  /**
   * Fetches the latest sync execution details for a sheet
   */
  async getLatestLog(sheetName: string): Promise<SyncLog | null> {
    return prisma.syncLog.findFirst({
      where: { sheetName },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Fetches the overall latest successful/failed sync status across all worksheets
   */
  async getGlobalLatestLog(): Promise<SyncLog | null> {
    return prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Paginated logs retrieve for Admin control panel
   */
  async findMany(page: number, limit: number): Promise<{ logs: SyncLog[]; total: number }> {
    const skip = (page - 1) * limit;

    const logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await prisma.syncLog.count();

    return { logs, total };
  }
}
