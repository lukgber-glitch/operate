import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyController } from './currency.controller';
import { MultiCurrencyService } from './multi-currency.service';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateRefreshProcessor, EXCHANGE_RATE_QUEUE } from './jobs/exchange-rate-refresh.processor';
import { ExchangeRateRefreshScheduler } from './jobs/exchange-rate-refresh.scheduler';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

/**
 * Currency Module
 *
 * Provides comprehensive multi-currency support across the entire platform
 */
@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    CacheModule,
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
  ],
  exports: [
    MultiCurrencyService,
    ExchangeRateService,
  ],
})
export class CurrencyModule {}
