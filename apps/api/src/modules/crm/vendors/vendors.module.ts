import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorDeduplicationService } from './vendor-deduplication.service';

/**
 * Vendors Module
 *
 * Manages vendor (supplier) entities for Accounts Payable (AP) automation.
 * Vendors are companies or individuals who provide goods/services and bill the organization.
 *
 * This module provides:
 * - Vendor CRUD operations
 * - Vendor payment information management
 * - Default expense categorization per vendor
 * - Payment terms tracking
 * - Vendor deduplication and matching
 *
 * Related to:
 * - Bill module (for incoming bills from vendors)
 * - Payment module (for paying vendor bills)
 * - Expense module (for vendor expense categorization)
 * - Email Intelligence (for matching extracted vendors)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [VendorsController],
  providers: [VendorsService, VendorDeduplicationService],
  exports: [VendorsService, VendorDeduplicationService],
})
export class VendorsModule {}
