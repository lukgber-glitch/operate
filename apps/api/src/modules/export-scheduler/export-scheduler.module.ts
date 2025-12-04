import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ExportSchedulerController } from './export-scheduler.controller';
import { ExportSchedulerService } from './export-scheduler.service';
import { ExportSchedulerProcessor } from './export-scheduler.processor';

/**
 * Export Scheduler Module
 * Manages scheduled recurring exports (DATEV, SAF-T, BMD)
 *
 * Features:
 * - Create and manage scheduled exports with cron expressions
 * - Automatic execution at scheduled times
 * - Timezone-aware scheduling
 * - Email notifications on completion/failure
 * - Run history tracking
 * - Manual execution trigger
 * - Background job processing with Bull
 */
@Module({
  imports: [
    DatabaseModule,
    ComplianceModule, // Provides DATEV, SAF-T, BMD export services
    BullModule.registerQueueAsync({
      name: 'export-scheduler',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db', 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
          removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: false, // Keep failed jobs for debugging
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ExportSchedulerController],
  providers: [ExportSchedulerService, ExportSchedulerProcessor],
  exports: [ExportSchedulerService],
})
export class ExportSchedulerModule {}
