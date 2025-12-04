import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../auth/rbac/rbac.module';
import { TemplateService } from './templates/template.service';

/**
 * Notifications Module
 * Handles notification management for the application
 */
@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, TemplateService],
  exports: [NotificationsService, TemplateService],
})
export class NotificationsModule {}
