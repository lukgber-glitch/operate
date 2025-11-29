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
}
