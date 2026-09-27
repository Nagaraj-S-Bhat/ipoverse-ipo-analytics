import { prisma } from '../lib/prisma';
import { type AdminUser, type Prisma } from '@prisma/client';

export class AdminUserRepository {
  /**
   * Finds an admin user by username
   */
  async findByUsername(username: string): Promise<AdminUser | null> {
    return prisma.adminUser.findUnique({
      where: { username },
    });
  }

  /**
   * Finds an admin user by unique ID
   */
  async findById(id: string): Promise<AdminUser | null> {
    return prisma.adminUser.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new admin user (e.g. during seeding)
   */
  async createAdmin(data: Prisma.AdminUserCreateInput): Promise<AdminUser> {
    return prisma.adminUser.create({
      data,
    });
  }

  /**
   * Updates the last login timestamp for audit logs
   */
  async updateLastLogin(id: string): Promise<AdminUser> {
    return prisma.adminUser.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Changes the admin user's password hash
   */
  async changePassword(id: string, newPasswordHash: string): Promise<AdminUser> {
    return prisma.adminUser.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });
  }
}
