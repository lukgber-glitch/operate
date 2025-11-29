import { Module } from '@nestjs/common';
import { CountryContextController } from './country-context.controller';
import { CountryContextService } from './country-context.service';
import { CountryContextRepository } from './country-context.repository';

/**
 * Country Context Module
 * Manages country-specific configuration, VAT rates, deduction categories,
 * and organisation country relationships
 */
@Module({
  controllers: [CountryContextController],
  providers: [CountryContextService, CountryContextRepository],
  exports: [CountryContextService, CountryContextRepository],
})
export class CountryContextModule {}
