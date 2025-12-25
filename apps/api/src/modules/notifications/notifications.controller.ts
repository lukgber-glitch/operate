import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
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

/**
 * DTO for batch operations
 */
class BatchIdsDto {
  ids: string[];
}

/**
 * Notifications Controller
 * Handles notification-related HTTP requests
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

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
   * Batch mark notifications as read
   */
  @Post('batch/read')
  @ApiOperation({
    summary: 'Batch mark as read',
    description: 'Mark multiple notifications as read in a single request',
  })
  @ApiBody({
    type: BatchIdsDto,
    description: 'Array of notification IDs to mark as read',
    examples: {
      example: {
        value: { ids: ['uuid-1', 'uuid-2', 'uuid-3'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
        processed: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async batchMarkAsRead(
    @Req() req: Request,
    @Body() body: BatchIdsDto,
  ): Promise<{ count: number; processed: string[] }> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.batchMarkAsRead(body.ids, userId, orgId);
  }

  /**
   * Batch delete notifications
   */
  @Post('batch/delete')
  @ApiOperation({
    summary: 'Batch delete notifications',
    description: 'Delete multiple notifications in a single request',
  })
  @ApiBody({
    type: BatchIdsDto,
    description: 'Array of notification IDs to delete',
    examples: {
      example: {
        value: { ids: ['uuid-1', 'uuid-2', 'uuid-3'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications deleted',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
        deleted: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async batchDelete(
    @Req() req: Request,
    @Body() body: BatchIdsDto,
  ): Promise<{ count: number; deleted: string[] }> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.batchDelete(body.ids, userId, orgId);
  }

  /**
   * Get notification preferences
   */
  @Get('preferences')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: "Get the user's notification preferences (returns defaults if none exist)",
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
    type: NotificationPreferencesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPreferences(@Req() req: Request): Promise<NotificationPreferencesDto> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.getNotificationPreferences(userId, orgId);
  }

  /**
   * Update notification preferences
   */
  @Patch('preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update the user\'s notification preferences',
  })
  @ApiBody({
    type: UpdateNotificationPreferencesDto,
    description: 'Notification preferences to update',
    examples: {
      doNotDisturb: {
        value: {
          doNotDisturb: true,
        },
        description: 'Enable Do Not Disturb mode',
      },
      quietHours: {
        value: {
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
        description: 'Set quiet hours',
      },
      channelPreferences: {
        value: {
          channelPreferences: {
            INVOICE_DUE: {
              inApp: true,
              email: true,
              push: false,
            },
            SYSTEM: {
              inApp: true,
              email: false,
              push: false,
            },
          },
        },
        description: 'Update channel preferences for specific notification types',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
    type: NotificationPreferencesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updatePreferences(
    @Req() req: Request,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const { userId, orgId } = req.user as any;
    return this.notificationsService.updateNotificationPreferences(
      userId,
      orgId,
      updateDto,
    );
  }
}
