/**
 * DEP Export Service
 * Handles export of Datenerfassungsprotokoll (DEP) for Austrian cash registers
 *
 * DEP Format Specification:
 * - DEP7 (current standard)
 * - JSON-based export format
 * - Required for FinanzOnline submission
 * - Contains all receipts with RKSV signatures
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RedisService } from '../../../cache/redis.service';
import {
  DEPExport,
  DEPReceipt,
  DEPMetadata,
  DEPExportRequest,
  SignedReceipt,
  CashRegisterRegistration,
} from './registrierkasse.types';
import {
  DEP_VERSION,
  SOFTWARE_INFO,
  DEP_EXPORT_LIMITS,
  REGISTRIERKASSE_ERROR_CODES,
  REGISTRIERKASSE_CACHE_KEYS,
} from './registrierkasse.constants';
import * as crypto from 'crypto';

@Injectable()
export class DEPExportService {
  private readonly logger = new Logger(DEPExportService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Export DEP for a cash register
   */
  async exportDEP(request: DEPExportRequest): Promise<DEPExport> {
    try {
      this.logger.log(
        `Exporting DEP for cash register ${request.cashRegisterId}, period: ${request.periodStart.toISOString()} - ${request.periodEnd.toISOString()}`,
      );

      // Validate period
      this.validateExportPeriod(request.periodStart, request.periodEnd);

      // Get cash register
      const cashRegister = await this.getCashRegister(
        request.organizationId,
        request.cashRegisterId,
      );

      if (!cashRegister) {
        throw new NotFoundException(
          `Cash register ${request.cashRegisterId} not found`,
        );
      }

      // TODO: Fetch receipts from database for the period
      // For now, return empty export structure
      const receipts: SignedReceipt[] = [];

      // Convert to DEP format
      const depReceipts = receipts.map(receipt => this.convertToDepReceipt(receipt));

      // Calculate metadata
      const metadata = this.calculateMetadata(depReceipts);

      // Create DEP export
      const depExport: DEPExport = {
        version: request.format || DEP_VERSION,
        cashRegisterId: request.cashRegisterId,
        companyName: cashRegister.companyName,
        taxNumber: cashRegister.taxNumber,
        vatId: cashRegister.vatId,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        certificateSerial: cashRegister.signatureDevice.certificateSerial || 'UNKNOWN',
        receipts: depReceipts,
        metadata,
        exportedAt: new Date(),
      };

      this.logger.log(
        `DEP export completed: ${depReceipts.length} receipts exported`,
      );

      return depExport;
    } catch (error) {
      this.logger.error(`DEP export failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Export DEP as JSON string
   */
  async exportDEPAsJSON(request: DEPExportRequest): Promise<string> {
    const depExport = await this.exportDEP(request);
    return JSON.stringify(depExport, null, 2);
  }

  /**
   * Export DEP as signed JSON (with checksum)
   */
  async exportDEPAsSignedJSON(request: DEPExportRequest): Promise<{
    data: string;
    checksum: string;
    algorithm: string;
  }> {
    const json = await this.exportDEPAsJSON(request);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(json).digest('hex');

    return {
      data: json,
      checksum,
      algorithm: 'SHA-256',
    };
  }

  /**
   * Validate DEP export
   */
  async validateDEPExport(depExport: DEPExport): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check version
    if (!depExport.version || depExport.version !== DEP_VERSION) {
      errors.push(`Invalid DEP version: ${depExport.version}, expected ${DEP_VERSION}`);
    }

    // Check required fields
    if (!depExport.cashRegisterId) {
      errors.push('Missing cash register ID');
    }

    if (!depExport.companyName) {
      errors.push('Missing company name');
    }

    if (!depExport.taxNumber) {
      errors.push('Missing tax number');
    }

    if (!depExport.certificateSerial) {
      errors.push('Missing certificate serial');
    }

    // Check period
    if (!depExport.periodStart || !depExport.periodEnd) {
      errors.push('Missing export period');
    } else if (depExport.periodStart >= depExport.periodEnd) {
      errors.push('Invalid period: start date must be before end date');
    }

    // Check receipts
    if (!depExport.receipts || depExport.receipts.length === 0) {
      errors.push('No receipts in export');
    } else {
      // Validate each receipt
      for (let i = 0; i < depExport.receipts.length; i++) {
        const receipt = depExport.receipts[i];
        const receiptErrors = this.validateDEPReceipt(receipt, i);
        errors.push(...receiptErrors);
      }

      // Check receipt number sequence
      const receiptNumbers = depExport.receipts.map(r => r.receiptNumber);
      const sorted = [...receiptNumbers].sort((a, b) => a - b);
      if (JSON.stringify(receiptNumbers) !== JSON.stringify(sorted)) {
        errors.push('Receipt numbers are not in sequential order');
      }

      // Check signature counter sequence
      const signatureCounters = depExport.receipts.map(r => r.signatureCounter);
      for (let i = 1; i < signatureCounters.length; i++) {
        if (signatureCounters[i] <= signatureCounters[i - 1]) {
          errors.push(
            `Signature counter at index ${i} is not greater than previous`,
          );
        }
      }
    }

    // Check metadata consistency
    if (depExport.metadata) {
      if (depExport.metadata.totalReceipts !== depExport.receipts.length) {
        errors.push(
          `Metadata total receipts (${depExport.metadata.totalReceipts}) does not match actual count (${depExport.receipts.length})`,
        );
      }

      if (depExport.receipts.length > 0) {
        const firstReceipt = depExport.receipts[0];
        const lastReceipt = depExport.receipts[depExport.receipts.length - 1];

        if (depExport.metadata.firstReceiptNumber !== firstReceipt.receiptNumber) {
          errors.push('Metadata first receipt number mismatch');
        }

        if (depExport.metadata.lastReceiptNumber !== lastReceipt.receiptNumber) {
          errors.push('Metadata last receipt number mismatch');
        }

        if (depExport.metadata.firstSignatureCounter !== firstReceipt.signatureCounter) {
          errors.push('Metadata first signature counter mismatch');
        }

        if (depExport.metadata.lastSignatureCounter !== lastReceipt.signatureCounter) {
          errors.push('Metadata last signature counter mismatch');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert signed receipt to DEP format
   */
  private convertToDepReceipt(receipt: SignedReceipt): DEPReceipt {
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      dateTime: receipt.dateTime.toISOString(),
      type: receipt.type,
      totalAmount: receipt.totalAmount,
      vatBreakdown: receipt.vatBreakdown.map(vat => ({
        rate: vat.rate,
        netAmount: vat.netAmount,
        vatAmount: vat.vatAmount,
        grossAmount: vat.grossAmount,
      })),
      jws: receipt.signature.jws,
      certificateSerial: receipt.signature.certificateSerial,
      signatureCounter: receipt.signature.signatureCounter,
      turnoverCounter: receipt.signature.turnoverCounter,
      trainingMode: receipt.trainingMode,
      previousReceiptHash: receipt.previousReceiptHash,
    };
  }

  /**
   * Calculate DEP export metadata
   */
  private calculateMetadata(receipts: DEPReceipt[]): DEPMetadata {
    if (receipts.length === 0) {
      return {
        totalReceipts: 0,
        totalTurnover: 0,
        firstReceiptNumber: 0,
        lastReceiptNumber: 0,
        firstSignatureCounter: 0,
        lastSignatureCounter: 0,
        format: DEP_VERSION,
        softwareVersion: SOFTWARE_INFO.VERSION,
        softwareManufacturer: SOFTWARE_INFO.MANUFACTURER,
      };
    }

    const totalTurnover = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const firstReceipt = receipts[0];
    const lastReceipt = receipts[receipts.length - 1];

    return {
      totalReceipts: receipts.length,
      totalTurnover,
      firstReceiptNumber: firstReceipt.receiptNumber,
      lastReceiptNumber: lastReceipt.receiptNumber,
      firstSignatureCounter: firstReceipt.signatureCounter,
      lastSignatureCounter: lastReceipt.signatureCounter,
      format: DEP_VERSION,
      softwareVersion: SOFTWARE_INFO.VERSION,
      softwareManufacturer: SOFTWARE_INFO.MANUFACTURER,
    };
  }

  /**
   * Validate export period
   */
  private validateExportPeriod(periodStart: Date, periodEnd: Date): void {
    if (periodStart >= periodEnd) {
      throw new BadRequestException(
        'Period start must be before period end',
      );
    }

    const periodDays = Math.floor(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (periodDays > DEP_EXPORT_LIMITS.MAX_PERIOD_DAYS) {
      throw new BadRequestException(
        `Export period exceeds maximum of ${DEP_EXPORT_LIMITS.MAX_PERIOD_DAYS} days`,
      );
    }

    const now = new Date();
    if (periodEnd > now) {
      throw new BadRequestException('Period end cannot be in the future');
    }
  }

  /**
   * Validate individual DEP receipt
   */
  private validateDEPReceipt(receipt: DEPReceipt, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Receipt ${index}`;

    if (!receipt.id) {
      errors.push(`${prefix}: Missing receipt ID`);
    }

    if (!receipt.receiptNumber || receipt.receiptNumber < 1) {
      errors.push(`${prefix}: Invalid receipt number`);
    }

    if (!receipt.dateTime) {
      errors.push(`${prefix}: Missing date/time`);
    }

    if (!receipt.type) {
      errors.push(`${prefix}: Missing receipt type`);
    }

    if (receipt.totalAmount === undefined || receipt.totalAmount === null) {
      errors.push(`${prefix}: Missing total amount`);
    }

    if (!receipt.vatBreakdown || receipt.vatBreakdown.length === 0) {
      errors.push(`${prefix}: Missing VAT breakdown`);
    } else {
      // Validate VAT breakdown totals
      const vatTotal = receipt.vatBreakdown.reduce(
        (sum, vat) => sum + vat.grossAmount,
        0,
      );

      if (Math.abs(vatTotal - receipt.totalAmount) > 1) {
        errors.push(
          `${prefix}: VAT breakdown total (${vatTotal}) does not match receipt total (${receipt.totalAmount})`,
        );
      }
    }

    if (!receipt.jws) {
      errors.push(`${prefix}: Missing JWS signature`);
    } else {
      // Validate JWS format
      const jwsParts = receipt.jws.split('.');
      if (jwsParts.length !== 3) {
        errors.push(`${prefix}: Invalid JWS format`);
      }
    }

    if (!receipt.certificateSerial) {
      errors.push(`${prefix}: Missing certificate serial`);
    }

    if (receipt.signatureCounter === undefined || receipt.signatureCounter < 0) {
      errors.push(`${prefix}: Invalid signature counter`);
    }

    if (receipt.turnoverCounter === undefined || receipt.turnoverCounter < 0) {
      errors.push(`${prefix}: Invalid turnover counter`);
    }

    return errors;
  }

  /**
   * Get cash register from cache
   */
  private async getCashRegister(
    organizationId: string,
    cashRegisterId: string,
  ): Promise<CashRegisterRegistration | null> {
    const key = `${REGISTRIERKASSE_CACHE_KEYS.CASH_REGISTER}${organizationId}:${cashRegisterId}`;
    const data = await this.redisService.get<CashRegisterRegistration>(key);

    if (data && data.registeredAt) {
      data.registeredAt = new Date(data.registeredAt);
    }

    return data;
  }

  /**
   * Generate DEP export filename
   */
  generateFilename(cashRegisterId: string, periodStart: Date, periodEnd: Date): string {
    const startStr = periodStart.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = periodEnd.toISOString().split('T')[0].replace(/-/g, '');
    return `DEP_${cashRegisterId}_${startStr}_${endStr}.json`;
  }

  /**
   * Calculate DEP export checksum
   */
  calculateChecksum(depExport: DEPExport): string {
    const json = JSON.stringify(depExport, null, 0); // No formatting for checksum
    return crypto.createHash('sha256').update(json).digest('hex');
  }
}
