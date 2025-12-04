import {
  Controller,
  Get,
  Patch,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsServiceEnhanced } from './notifications.service.enhanced';
import {
  NotificationFilterDto,
  NotificationResponseDto,
  UnreadCountDto,
} from './dto/notification-filter.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InAppService } from './channels/in-app.service';

/**
 * Enhanced Notifications Controller
 * Handles notification-related HTTP requests including SSE and preferences
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsControllerEnhanced {
  constructor(
    private notificationsService: NotificationsServiceEnhanced,
    private inAppService: InAppService,
  ) {}

  /**
   * Get user's notifications with optional filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get notifications',
    description: 'Retrieve user notifications with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getNotifications(
    @Req() req: Request,
    @Query() filters: NotificationFilterDto,
  ): Promise<{
    data: NotificationResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.getUserNotifications(
      userId,
      orgId,
      filters,
    );
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread count',
    description: 'Get the count of unread notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: UnreadCountDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUnreadCount(@Req() req: Request): Promise<UnreadCountDto> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.getUnreadCount(userId, orgId);
  }

  /**
   * Server-Sent Events (SSE) endpoint for real-time notifications
   */
  @Get('stream')
  @ApiOperation({
    summary: 'Stream notifications',
    description:
      'SSE endpoint for real-time notification delivery. Keep connection open to receive notifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE connection established',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"id":"123","type":"invoice_due","title":"Invoice Due"}\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async streamNotifications(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { userId } = req.user as any;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`,
    );

    // Register connection
    this.inAppService.registerConnection(userId, res);

    // Handle client disconnect
    req.on('close', () => {
      this.inAppService.unregisterConnection(userId, res);
      res.end();
    });

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000); // Send keep-alive every 30 seconds

    req.on('close', () => {
      clearInterval(keepAliveInterval);
    });
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark as read',
    description: 'Mark a notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - notification does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    const { userId } = req.user as any;
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * Mark all notifications as read
   */
  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all as read',
    description: 'Mark all notifications as read for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async markAllAsRead(@Req() req: Request): Promise<{ count: number }> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.markAllAsRead(userId, orgId);
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a notification',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - notification does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.user as any;
    return this.notificationsService.deleteNotification(id, userId);
  }

  /**
   * Get notification preferences
   */
  @Get('preferences')
  @ApiOperation({
    summary: 'Get preferences',
    description: 'Get notification preferences for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
    type: NotificationPreferencesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPreferences(
    @Req() req: Request,
  ): Promise<NotificationPreferencesDto> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.getPreferences(userId, orgId);
  }

  /**
   * Update notification preferences
   */
  @Put('preferences')
  @ApiOperation({
    summary: 'Update preferences',
    description: 'Update notification preferences for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: NotificationPreferencesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updatePreferences(
    @Req() req: Request,
    @Body() updates: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.updatePreferences(userId, orgId, updates);
  }
}
