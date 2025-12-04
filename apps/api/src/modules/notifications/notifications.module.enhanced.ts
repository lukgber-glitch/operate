import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsControllerEnhanced } from './notifications.controller.enhanced';
import { NotificationsServiceEnhanced } from './notifications.service.enhanced';
import { NotificationsRepository } from './notifications.repository';
import { EmailService } from './channels/email.service';
import { PushService } from './channels/push.service';
import { InAppService } from './channels/in-app.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Enhanced Notifications Module
 * Provides comprehensive notification management with multi-channel delivery
 */
@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    RbacModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [NotificationsControllerEnhanced],
  providers: [
    NotificationsServiceEnhanced,
    NotificationsRepository,
    EmailService,
    PushService,
    InAppService,
  ],
  exports: [
    NotificationsServiceEnhanced,
    NotificationsRepository,
    EmailService,
    PushService,
    InAppService,
  ],
})
export class NotificationsModuleEnhanced {}
