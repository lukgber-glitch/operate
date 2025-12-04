import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationFilterDto,
  NotificationResponseDto,
  UnreadCountDto,
} from './dto/notification-filter.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification-preferences.dto';
import { NotificationsRepository } from './notifications.repository';
import { EmailService } from './channels/email.service';
import { PushService } from './channels/push.service';
import { InAppService } from './channels/in-app.service';

/**
 * Enhanced Notifications Service
 * Handles notification creation, delivery, and management with rate limiting
 */
@Injectable()
export class NotificationsServiceEnhanced {
  private readonly logger = new Logger(NotificationsServiceEnhanced.name);
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms
  private readonly RATE_LIMIT_MAX = 10; // Max 10 notifications per hour per channel

  constructor(
    private prisma: PrismaService,
    private repository: NotificationsRepository,
    private cache: RedisService,
    private emailService: EmailService,
    private pushService: PushService,
    private inAppService: InAppService,
    private configService: ConfigService,
  ) {}

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
    const { status, type, page, pageSize } = filters;
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

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

    const total = await this.repository.count(where);

    const notifications = await this.repository.findMany(where, {
      skip: (currentPage - 1) * currentPageSize,
      take: currentPageSize,
    });

    this.logger.log(
      `Retrieved ${notifications.length} notifications for user ${userId}`,
    );

    return {
      data: notifications as NotificationResponseDto[],
      total,
      page: currentPage,
      pageSize: currentPageSize,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, orgId: string): Promise<UnreadCountDto> {
    const count = await this.repository.getUnreadCount(userId, orgId);
    return { count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.repository.findById(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    const updated = await this.repository.update(id, {
      status: 'READ',
      readAt: new Date(),
    });

    this.logger.log(`Notification ${id} marked as read by user ${userId}`);

    return updated as NotificationResponseDto;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(
    userId: string,
    orgId: string,
  ): Promise<{ count: number }> {
    const result = await this.repository.updateMany(
      {
        userId,
        orgId,
        status: 'UNREAD',
      },
      {
        status: 'READ',
        readAt: new Date(),
      },
    );

    this.logger.log(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.repository.findById(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this notification',
      );
    }

    await this.repository.delete(id);

    this.logger.log(`Notification ${id} deleted by user ${userId}`);
  }

  /**
   * Create a notification with multi-channel delivery
   */
  async createNotification(
    data: CreateNotificationDto,
  ): Promise<NotificationResponseDto | null> {
    // Check rate limiting
    const canSend = await this.checkRateLimit(data.userId, data.type);
    if (!canSend) {
      this.logger.warn(
        `Rate limit exceeded for user ${data.userId}, type ${data.type}`,
      );
      throw new Error('Rate limit exceeded for notifications');
    }

    // Get user preferences
    const preferences = await this.getPreferences(data.userId, data.orgId);

    // Check if user has notifications enabled for this type
    if (!this.shouldSendNotification(data.type, preferences)) {
      this.logger.debug(
        `Notification type ${data.type} disabled for user ${data.userId}`,
      );
      return null;
    }

    // Create in-app notification
    const notification = await this.repository.create({
      userId: data.userId,
      orgId: data.orgId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || 3,
      status: 'UNREAD',
    });

    // Send via enabled channels
    await this.deliverToChannels(notification, preferences);

    // Increment rate limit counter
    await this.incrementRateLimitCounter(data.userId, data.type);

    this.logger.log(
      `Created ${data.type} notification for user ${data.userId}: ${data.title}`,
    );

    return notification as NotificationResponseDto;
  }

  /**
   * Deliver notification to all enabled channels
   */
  private async deliverToChannels(
    notification: any,
    preferences: NotificationPreferencesDto,
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // In-app (always enabled)
    promises.push(
      this.inAppService.sendNotification(notification.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt,
      }),
    );

    // Email
    if (preferences.channels.email && this.emailService.isEnabled()) {
      promises.push(
        this.emailService.send({
          to: await this.getUserEmail(notification.userId),
          subject: notification.title,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
        }),
      );
    }

    // Push
    if (preferences.channels.push && this.pushService.isEnabled()) {
      promises.push(
        this.pushService.send({
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          notificationType: notification.type,
          priority: notification.priority,
          data: notification.data,
        }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(
    userId: string,
    orgId: string,
  ): Promise<NotificationPreferencesDto> {
    // Try cache first
    const cacheKey = `notification:preferences:${userId}:${orgId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(typeof cached === 'string' ? cached : JSON.stringify(cached));
    }

    // Get from settings or return defaults
    const userSettings = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!userSettings) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Return default preferences
    const preferences: NotificationPreferencesDto = {
      userId,
      orgId,
      channels: {
        email: true,
        push: true,
        inApp: true,
      },
      types: {
        invoice_due: true,
        task_assigned: true,
        document_classified: true,
        tax_deadline: true,
        approval_needed: true,
        fraud_alert: true,
        system: true,
      },
      doNotDisturb: false,
      updatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cache.set(cacheKey, JSON.stringify(preferences), 3600);

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    orgId: string,
    updates: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const current = await this.getPreferences(userId, orgId);

    const updated: NotificationPreferencesDto = {
      ...current,
      ...updates,
      channels: {
        ...current.channels,
        ...updates.channels,
      },
      types: {
        ...current.types,
        ...updates.types,
      },
      updatedAt: new Date(),
    };

    // Update cache
    const cacheKey = `notification:preferences:${userId}:${orgId}`;
    await this.cache.set(cacheKey, JSON.stringify(updated), 3600);

    this.logger.log(`Updated notification preferences for user ${userId}`);

    return updated;
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    type: string,
    preferences: NotificationPreferencesDto,
  ): boolean {
    if (preferences.doNotDisturb) {
      return false;
    }

    // Check if within quiet hours
    if (this.isQuietHours(preferences)) {
      return false;
    }

    // Check type preferences
    const typeKey = type.toLowerCase();
    if (typeKey in preferences.types) {
      return preferences.types[typeKey];
    }

    return true;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferencesDto): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Check rate limit for notifications
   */
  private async checkRateLimit(userId: string, type: string): Promise<boolean> {
    const key = `notification:ratelimit:${userId}:${type}`;
    const count = await this.cache.get(key);

    if (!count) {
      return true;
    }

    return parseInt(typeof count === 'string' ? count : '0', 10) < this.RATE_LIMIT_MAX;
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimitCounter(
    userId: string,
    type: string,
  ): Promise<void> {
    const key = `notification:ratelimit:${userId}:${type}`;
    const current = await this.cache.get<string>(key);

    if (!current) {
      await this.cache.set(key, '1', Math.floor(this.RATE_LIMIT_WINDOW / 1000));
    } else {
      await this.cache.set(
        key,
        (parseInt(typeof current === 'string' ? current : '0', 10) + 1).toString(),
        Math.floor(this.RATE_LIMIT_WINDOW / 1000),
      );
    }
  }

  /**
   * Get user email (helper)
   */
  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return user?.email || '';
  }

  /**
   * Trigger notification for invoice due
   */
  async notifyInvoiceDue(params: {
    userId: string;
    orgId: string;
    invoiceId: string;
    invoiceNumber: string;
    dueDate: Date;
    amount: number;
  }): Promise<void> {
    await this.createNotification({
      userId: params.userId,
      orgId: params.orgId,
      type: 'invoice_due',
      title: 'Invoice Due Soon',
      message: `Invoice ${params.invoiceNumber} is due on ${params.dueDate.toLocaleDateString()}`,
      data: {
        invoiceId: params.invoiceId,
        invoiceNumber: params.invoiceNumber,
        dueDate: params.dueDate,
        amount: params.amount,
      },
      priority: 4,
    });
  }

  /**
   * Trigger notification for task assigned
   */
  async notifyTaskAssigned(params: {
    userId: string;
    orgId: string;
    taskId: string;
    taskTitle: string;
    assignedBy: string;
  }): Promise<void> {
    await this.createNotification({
      userId: params.userId,
      orgId: params.orgId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: ${params.taskTitle}`,
      data: {
        taskId: params.taskId,
        taskTitle: params.taskTitle,
        assignedBy: params.assignedBy,
      },
      priority: 3,
    });
  }

  /**
   * Trigger notification for document classified
   */
  async notifyDocumentClassified(params: {
    userId: string;
    orgId: string;
    documentId: string;
    documentName: string;
    classification: string;
    confidence: number;
  }): Promise<void> {
    await this.createNotification({
      userId: params.userId,
      orgId: params.orgId,
      type: 'document_classified',
      title: 'Document Classified',
      message: `${params.documentName} has been classified as ${params.classification}`,
      data: {
        documentId: params.documentId,
        documentName: params.documentName,
        classification: params.classification,
        confidence: params.confidence,
      },
      priority: 2,
    });
  }

  /**
   * Trigger notification for tax deadline
   */
  async notifyTaxDeadline(params: {
    userId: string;
    orgId: string;
    deadlineType: string;
    deadlineDate: Date;
    daysUntil: number;
  }): Promise<void> {
    await this.createNotification({
      userId: params.userId,
      orgId: params.orgId,
      type: 'tax_deadline',
      title: 'Tax Deadline Approaching',
      message: `${params.deadlineType} deadline in ${params.daysUntil} days`,
      data: {
        deadlineType: params.deadlineType,
        deadlineDate: params.deadlineDate,
        daysUntil: params.daysUntil,
      },
      priority: 5,
    });
  }

  /**
   * Cleanup old notifications (scheduled job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.repository.deleteOlderThan(thirtyDaysAgo);

    this.logger.log(`Cleaned up old notifications: ${result.count} deleted`);
  }

  /**
   * Heartbeat for SSE connections (scheduled job)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async sendHeartbeat(): Promise<void> {
    this.inAppService.sendHeartbeat();
  }

  /**
   * Clean up dead SSE connections (scheduled job)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupDeadConnections(): Promise<void> {
    this.inAppService.cleanupDeadConnections();
  }
}
