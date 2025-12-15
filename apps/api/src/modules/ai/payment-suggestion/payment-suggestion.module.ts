/**
 * Payment Suggestion Module
 * Provides payment suggestion and bill payment tracking functionality
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { PaymentSuggestionService } from './payment-suggestion.service';
import { PaymentSuggestionController } from './payment-suggestion.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PaymentSuggestionController],
  providers: [PaymentSuggestionService],
  exports: [PaymentSuggestionService],
})
export class PaymentSuggestionModule {}
