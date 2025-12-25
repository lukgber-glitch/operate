import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationFilterDto,
  NotificationResponseDto,
  UnreadCountDto,
} from './dto/notification-filter.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  NotificationChannelSettings,
} from './dto/notification-preferences.dto';

/**
 * Notifications Service
 * Handles notification creation, retrieval, and management
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's notifications with optional filters
   */
  async getUserNotifications(
    userId: string,
    orgId: string,
    filters: NotificationFilterDto,
  ): Promise<{
    data: NotificationResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { status, type, page = 1, pageSize = 20 } = filters;

    // Build where clause
    const where: any = {
      userId,
      orgId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await this.prisma.notification.count({ where });

    // Get paginated notifications
    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    this.logger.log(
      `Retrieved ${notifications.length} notifications for user ${userId}`,
    );

    return {
      data: notifications as NotificationResponseDto[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, orgId: string): Promise<UnreadCountDto> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        orgId,
        status: 'UNREAD',
      },
    });

    return { count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    // Mark as read
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    this.logger.log(`Notification ${id} marked as read by user ${userId}`);

    return updated as NotificationResponseDto;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, orgId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        orgId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    // Check if notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this notification',
      );
    }

    // Delete notification
    await this.prisma.notification.delete({
      where: { id },
    });

    this.logger.log(`Notification ${id} deleted by user ${userId}`);
  }

  /**
   * Create a notification (internal use by other services)
   */
  async createNotification(
    data: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        orgId: data.orgId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        priority: data.priority || 3,
        status: 'UNREAD',
      },
    });

    this.logger.log(
      `Created ${data.type} notification for user ${data.userId}: ${data.title}`,
    );

    return notification as NotificationResponseDto;
  }

  /**
   * Batch mark notifications as read
   * More efficient than marking one by one
   */
  async batchMarkAsRead(
    ids: string[],
    userId: string,
    orgId: string,
  ): Promise<{ count: number; processed: string[] }> {
    if (!ids || ids.length === 0) {
      return { count: 0, processed: [] };
    }

    // Filter to only notifications owned by user
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId,
        orgId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    this.logger.log(
      `Batch marked ${result.count} notifications as read for user ${userId}`,
    );

    return {
      count: result.count,
      processed: ids, // Return all requested IDs
    };
  }

  /**
   * Batch delete notifications
   * More efficient than deleting one by one
   */
  async batchDelete(
    ids: string[],
    userId: string,
    orgId: string,
  ): Promise<{ count: number; deleted: string[] }> {
    if (!ids || ids.length === 0) {
      return { count: 0, deleted: [] };
    }

    // Delete only notifications owned by user
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId,
        orgId,
      },
    });

    this.logger.log(
      `Batch deleted ${result.count} notifications for user ${userId}`,
    );

    return {
      count: result.count,
      deleted: ids, // Return all requested IDs
    };
  }

  /**
   * Get default channel preferences
   * Returns sensible defaults for all notification types
   */
  private getDefaultChannelPreferences(): Record<
    string,
    NotificationChannelSettings
  > {
    const defaultSettings: NotificationChannelSettings = {
      inApp: true,
      email: true,
      push: true,
    };

    return {
      INVOICE_DUE: { ...defaultSettings },
      PAYMENT_RECEIVED: { ...defaultSettings },
      TASK_ASSIGNED: { ...defaultSettings },
      DOCUMENT_CLASSIFIED: { inApp: true, email: false, push: false },
      TAX_DEADLINE: { ...defaultSettings },
      SYSTEM_UPDATE: { inApp: true, email: false, push: false },
      SYSTEM: { inApp: true, email: false, push: false },
    };
  }

  /**
   * Get notification preferences for a user
   * Returns defaults if no preferences exist
   */
  async getNotificationPreferences(
    userId: string,
    orgId: string,
  ): Promise<NotificationPreferencesDto> {
    try {
      // Try to find existing preferences
      let preferences = await this.prisma.notificationPreferences.findUnique({
        where: { userId },
      });

      // If no preferences exist, create default ones
      if (!preferences) {
        this.logger.log(
          `No preferences found for user ${userId}, creating defaults`,
        );

        preferences = await this.prisma.notificationPreferences.create({
          data: {
            userId,
            orgId,
            doNotDisturb: false,
            quietHoursStart: null,
            quietHoursEnd: null,
            channelPreferences: this.getDefaultChannelPreferences() as any,
          },
        });
      }

      this.logger.log(`Retrieved notification preferences for user ${userId}`);

      return {
        id: preferences.id,
        userId: preferences.userId,
        orgId: preferences.orgId,
        doNotDisturb: preferences.doNotDisturb,
        quietHoursStart: preferences.quietHoursStart || undefined,
        quietHoursEnd: preferences.quietHoursEnd || undefined,
        channelPreferences: preferences.channelPreferences as any,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification preferences for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    orgId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    try {
      // First, try to find existing preferences
      let preferences = await this.prisma.notificationPreferences.findUnique({
        where: { userId },
      });

      // Prepare update data
      const updateData: any = {};

      if (updateDto.doNotDisturb !== undefined) {
        updateData.doNotDisturb = updateDto.doNotDisturb;
      }

      if (updateDto.quietHoursStart !== undefined) {
        updateData.quietHoursStart = updateDto.quietHoursStart;
      }

      if (updateDto.quietHoursEnd !== undefined) {
        updateData.quietHoursEnd = updateDto.quietHoursEnd;
      }

      if (updateDto.channelPreferences !== undefined) {
        // Merge with existing preferences
        const existingPrefs = preferences
          ? (preferences.channelPreferences as any)
          : this.getDefaultChannelPreferences();

        updateData.channelPreferences = {
          ...existingPrefs,
          ...updateDto.channelPreferences,
        };
      }

      // Update or create preferences
      if (preferences) {
        preferences = await this.prisma.notificationPreferences.update({
          where: { userId },
          data: updateData,
        });

        this.logger.log(`Updated notification preferences for user ${userId}`);
      } else {
        // Create new preferences with defaults + updates
        preferences = await this.prisma.notificationPreferences.create({
          data: {
            userId,
            orgId,
            doNotDisturb: updateData.doNotDisturb ?? false,
            quietHoursStart: updateData.quietHoursStart ?? null,
            quietHoursEnd: updateData.quietHoursEnd ?? null,
            channelPreferences:
              (updateData.channelPreferences ??
              this.getDefaultChannelPreferences()) as any,
          },
        });

        this.logger.log(`Created notification preferences for user ${userId}`);
      }

      return {
        id: preferences.id,
        userId: preferences.userId,
        orgId: preferences.orgId,
        doNotDisturb: preferences.doNotDisturb,
        quietHoursStart: preferences.quietHoursStart || undefined,
        quietHoursEnd: preferences.quietHoursEnd || undefined,
        channelPreferences: preferences.channelPreferences as any,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update notification preferences for user ${userId}`,
        error,
      );
      throw error;
    }
  }
}
