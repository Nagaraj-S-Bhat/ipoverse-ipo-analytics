import { prisma } from '../lib/prisma';
import { type Setting } from '@prisma/client';

export class SettingsRepository {
  /**
   * Retrieves a setting value by its unique key
   */
  async getSetting(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({
      where: { key },
    });
  }

  /**
   * Updates or sets a configuration setting
   */
  async upsertSetting(key: string, value: string, description?: string): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      create: { key, value, description },
      update: { value, description },
    });
  }
}
