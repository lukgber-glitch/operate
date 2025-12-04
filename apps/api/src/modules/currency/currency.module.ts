import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyController } from './currency.controller';
import { MultiCurrencyService } from './multi-currency.service';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateRefreshProcessor, EXCHANGE_RATE_QUEUE } from './jobs/exchange-rate-refresh.processor';
import { ExchangeRateRefreshScheduler } from './jobs/exchange-rate-refresh.scheduler';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';

/**
 * Currency Module
 *
 * Provides comprehensive multi-currency support across the entire platform
 */
@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: EXCHANGE_RATE_QUEUE,
    }),
  ],
  controllers: [CurrencyController],
  providers: [
    MultiCurrencyService,
    ExchangeRateService,
    ExchangeRateRefreshProcessor,
    ExchangeRateRefreshScheduler,
    RedisService,
    PrismaService,
  ],
  exports: [
    MultiCurrencyService,
    ExchangeRateService,
  ],
})
export class CurrencyModule {}
