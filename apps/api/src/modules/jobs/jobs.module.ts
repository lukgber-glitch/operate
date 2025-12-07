/**
 * Jobs Module
 * Manages background jobs and scheduled tasks
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { DailyInsightProcessor, DAILY_INSIGHT_QUEUE } from './daily-insight.processor';
import { JobSchedulerService } from './job-scheduler.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: DAILY_INSIGHT_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    DatabaseModule,
  ],
  controllers: [JobsController],
  providers: [DailyInsightProcessor, JobSchedulerService],
  exports: [JobSchedulerService],
})
export class JobsModule {}
