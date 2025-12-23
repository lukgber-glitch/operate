/**
 * Bank Import Job Module
 * Registers Bull queue, processor, and scheduler for bank import jobs
 *
 * Features:
 * - Bull queue configuration
 * - Job processor registration
 * - Scheduler setup
 * - Event emitter integration
 * - Exports scheduler for use in controllers
 */

import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BankImportProcessor, BANK_IMPORT_QUEUE } from './bank-import.processor';
import { BankImportScheduler } from './bank-import.scheduler';
import type { BankSyncModule } from '../bank-sync.module';
import { DatabaseModule } from '@/modules/database/database.module';

/**
 * Bank Import Job Module
 */
@Module({
  imports: [
    // Enable scheduling
    ScheduleModule.forRoot(),

    // Enable event emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),

    // Register Bull queue - inherits Redis connection from BullModule.forRoot in AppModule
    BullModule.registerQueueAsync({
      name: BANK_IMPORT_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // No redis config here - use global config from AppModule
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
        settings: {
          stalledInterval: 30000, // Check for stalled jobs every 30s
          maxStalledCount: 2, // Max times a job can be stalled before failed
          lockDuration: 300000, // Lock jobs for 5 minutes
          lockRenewTime: 150000, // Renew lock every 2.5 minutes
        },
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per second
          bounceBack: false, // Don't delay failed jobs
        },
      }),
    }),

    // Import required modules
    ConfigModule,
    DatabaseModule,
    forwardRef(() => require('../bank-sync.module').BankSyncModule), // Provides BankSyncService - use forwardRef with require to avoid circular dependency
  ],
  providers: [
    BankImportProcessor,
    BankImportScheduler,
  ],
  exports: [
    BankImportScheduler, // Export for use in controllers
  ],
})
export class BankImportJobModule {}
