import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringInvoiceController } from './recurring-invoice.controller';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceProcessor } from './recurring-invoice.processor';
import { RecurringInvoiceScheduler } from './recurring-invoice.scheduler';
import { DatabaseModule } from '../../../database/database.module';
import { InvoicesModule } from '../invoices.module';
import { RbacModule } from '../../../auth/rbac/rbac.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Recurring Invoice Module
 * Manages recurring invoice templates and automatic generation
 */
@Module({
  imports: [
    DatabaseModule,
    InvoicesModule,
    RbacModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueueAsync({
      name: 'recurring-invoices',
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
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RecurringInvoiceController],
  providers: [
    RecurringInvoiceService,
    RecurringInvoiceProcessor,
    RecurringInvoiceScheduler,
  ],
  exports: [RecurringInvoiceService, RecurringInvoiceScheduler],
})
export class RecurringInvoiceModule {}
