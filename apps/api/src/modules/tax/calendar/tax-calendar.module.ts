import { Module } from '@nestjs/common';
import { TaxCalendarService } from './tax-calendar.service';
import { TaxCalendarController } from './tax-calendar.controller';
import { PrismaService } from '../../database/prisma.service';
import { TaxDeadlineService } from '../deadlines/tax-deadline.service';

/**
 * Tax Calendar Module
 * Manages automatic tax deadline calendar generation
 */
@Module({
  controllers: [TaxCalendarController],
  providers: [TaxCalendarService, TaxDeadlineService, PrismaService],
  exports: [TaxCalendarService, TaxDeadlineService],
})
export class TaxCalendarModule {}
