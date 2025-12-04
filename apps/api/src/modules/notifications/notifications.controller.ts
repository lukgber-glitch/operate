import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
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
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  NotificationFilterDto,
  NotificationResponseDto,
  UnreadCountDto,
} from './dto/notification-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
