import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './leave.repository';
import { EntitlementsService } from './entitlements/entitlements.service';
import { EntitlementsCalculator } from './entitlements/entitlements.calculator';

/**
 * Leave Management Module
 * Handles leave requests, approvals, and entitlement calculations
 */
@Module({
  controllers: [LeaveController],
  providers: [
    LeaveService,
    LeaveRepository,
    EntitlementsService,
    EntitlementsCalculator,
  ],
  exports: [LeaveService, EntitlementsService],
})
export class LeaveModule {}
