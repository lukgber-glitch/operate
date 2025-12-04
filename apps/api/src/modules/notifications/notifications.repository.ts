import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Notifications Repository
 * Handles database operations for notifications
 */
@Injectable()
export class NotificationsRepository {
  private readonly logger = new Logger(NotificationsRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification
   */
  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({
      data,
    });
  }

  /**
   * Find notifications with filters
   */
  async findMany(where: Prisma.NotificationWhereInput, options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.NotificationOrderByWithRelationInput[];
  }) {
    return this.prisma.notification.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Find a single notification by ID
   */
  async findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Count notifications matching criteria
   */
  async count(where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({ where });
  }

  /**
   * Update a notification
   */
  async update(id: string, data: Prisma.NotificationUpdateInput) {
    return this.prisma.notification.update({
      where: { id },
      data,
    });
  }

  /**
   * Update many notifications
   */
  async updateMany(
    where: Prisma.NotificationWhereInput,
    data: Prisma.NotificationUpdateInput,
  ) {
    return this.prisma.notification.updateMany({
      where,
      data,
    });
  }

  /**
   * Delete a notification
   */
  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string, orgId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        orgId,
        status: 'UNREAD',
      },
    });
  }

  /**
   * Get recent notifications for user
   */
  async getRecent(userId: string, orgId: string, limit: number = 10) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        orgId,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Get notifications by type
   */
  async findByType(
    userId: string,
    orgId: string,
    type: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        orgId,
        type,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOlderThan(date: Date) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
        status: {
          in: ['READ', 'ARCHIVED'],
        },
      },
    });

    this.logger.log(`Deleted ${result.count} old notifications`);
    return result;
  }

  /**
   * Get notification statistics for user
   */
  async getStats(userId: string, orgId: string) {
    const [total, unread, read, archived] = await Promise.all([
      this.count({ userId, orgId }),
      this.count({ userId, orgId, status: 'UNREAD' }),
      this.count({ userId, orgId, status: 'READ' }),
      this.count({ userId, orgId, status: 'ARCHIVED' }),
    ]);

    return {
      total,
      unread,
      read,
      archived,
    };
  }
}
