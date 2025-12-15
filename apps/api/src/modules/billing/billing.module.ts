import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [DatabaseModule, StripeModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
