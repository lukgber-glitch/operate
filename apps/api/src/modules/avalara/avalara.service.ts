import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Avatax from 'avatax';
import { AvalaraConfig } from './avalara.config';
import {
  CalculateTaxDto,
  TaxCalculationResponseDto,
  CommitTransactionDto,
  CommitTransactionResponseDto,
  VoidTransactionDto,
  VoidTransactionResponseDto,
  ValidateAddressDto,
  ValidateAddressResponseDto,
} from './dto';

/**
 * Avalara AvaTax Service
 * Handles US sales tax calculations via Avalara AvaTax API
 */
@Injectable()
export class AvalaraService {
  private readonly logger = new Logger(AvalaraService.name);
  private readonly client: any;
  private readonly config: AvalaraConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AvalaraConfig>('avalara');

    if (!this.config.accountId || !this.config.licenseKey) {
      this.logger.warn(
        'Avalara credentials not configured. Service will not be functional.',
      );
    }

    // Initialize AvaTax client
    this.client = new Avatax({
      appName: this.config.appName,
      appVersion: this.config.appVersion,
      environment: this.config.environment,
      machineName: this.config.machineName,
    }).withSecurity(`${this.config.accountId}:${this.config.licenseKey}`);

    this.logger.log(
      `Avalara AvaTax service initialized in ${this.config.environment} mode`,
    );
  }

  /**
   * Calculate sales tax for a transaction
   */
  async calculateTax(
    dto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    try {
      this.logger.debug(
        `Calculating tax for customer ${dto.customerCode} with ${dto.lines.length} line items`,
      );

      // Build transaction model for AvaTax
      const transactionModel = {
        companyCode: this.config.companyCode,
        type: dto.type || 'SalesInvoice',
        customerCode: dto.customerCode,
        date: dto.transactionDate || new Date().toISOString().split('T')[0],
        currencyCode: dto.currencyCode || 'USD',
        addresses: {
          shipFrom: dto.originAddress
            ? {
                line1: dto.originAddress.line1,
                line2: dto.originAddress.line2,
                city: dto.originAddress.city,
                region: dto.originAddress.state,
                country: dto.originAddress.country,
                postalCode: dto.originAddress.postalCode,
              }
            : undefined,
          shipTo: {
            line1: dto.destinationAddress.line1,
            line2: dto.destinationAddress.line2,
            city: dto.destinationAddress.city,
            region: dto.destinationAddress.state,
            country: dto.destinationAddress.country,
            postalCode: dto.destinationAddress.postalCode,
          },
        },
        lines: dto.lines.map((line, index) => ({
          number: String(index + 1),
          itemCode: line.itemCode,
          description: line.description,
          quantity: line.quantity,
          amount: line.amount * line.quantity,
          taxCode: line.taxCode,
          exemptionCode: line.exemptionCode,
        })),
        commit: dto.commit || false,
        purchaseOrderNo: dto.purchaseOrderNo,
        referenceCode: dto.referenceCode,
        exemptionNo: dto.exemptionNo,
      };

      // Call AvaTax API
      const result = await this.client.createTransaction({
        model: transactionModel,
      });

      this.logger.debug('Tax calculation completed');

      // Transform response
      return {
        totalTax: result.totalTax || 0,
        rate: result.rate || 0,
        totalAmount: result.totalAmount || 0,
        taxableAmount: result.totalTaxable || 0,
        exemptAmount: result.totalExempt || 0,
        lines:
          result.lines?.map((line: any) => ({
            lineNumber: line.lineNumber,
            tax: line.tax || 0,
            rate: line.rate || 0,
            exemptAmount: line.exemptAmount || 0,
            taxableAmount: line.taxableAmount || 0,
            details:
              line.details?.map((detail: any) => ({
                jurisdictionType: detail.jurisType,
                jurisdictionName: detail.jurisName,
                rate: detail.rate,
                tax: detail.tax,
                taxName: detail.taxName,
                stateAssignedNo: detail.stateAssignedNo,
              })) || [],
          })) || [],
        summary:
          result.summary?.map((item: any) => ({
            country: item.country,
            region: item.region,
            jurisType: item.jurisType,
            jurisName: item.jurisName,
            taxAuthorityType: item.taxAuthorityType,
            rate: item.rate,
            tax: item.tax,
            taxable: item.taxable,
            exemption: item.exemption,
          })) || [],
        messages: result.messages?.map((msg: any) => ({
          severity: msg.severity,
          summary: msg.summary,
          details: msg.details,
        })),
        taxDate: result.taxDate || new Date().toISOString(),
        code: result.code,
      };
    } catch (error) {
      this.logger.error(`Tax calculation failed: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Failed to calculate tax: ${error.message}`,
      );
    }
  }

  /**
   * Commit a transaction (finalize tax liability)
   */
  async commitTransaction(
    dto: CommitTransactionDto,
  ): Promise<CommitTransactionResponseDto> {
    try {
      this.logger.debug(`Committing transaction: ${dto.transactionCode}`);

      const result = await this.client.commitTransaction({
        companyCode: this.config.companyCode,
        transactionCode: dto.transactionCode,
        documentType: dto.documentType || 'SalesInvoice',
        model: { commit: true },
      });

      this.logger.debug('Transaction committed');

      return {
        code: result.code,
        status: result.status,
        modifiedDate: result.modifiedDate,
        messages: result.messages?.map((msg: any) => ({
          severity: msg.severity,
          summary: msg.summary,
          details: msg.details,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Transaction commit failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to commit transaction: ${error.message}`,
      );
    }
  }

  /**
   * Void a transaction (cancel committed transaction)
   */
  async voidTransaction(
    dto: VoidTransactionDto,
  ): Promise<VoidTransactionResponseDto> {
    try {
      this.logger.debug(
        `Voiding transaction: ${dto.transactionCode} with reason: ${dto.code}`,
      );

      const result = await this.client.voidTransaction({
        companyCode: this.config.companyCode,
        transactionCode: dto.transactionCode,
        documentType: dto.documentType || 'SalesInvoice',
        model: {
          code: dto.code,
        },
      });

      this.logger.debug('Transaction voided');

      return {
        code: result.code,
        status: result.status,
        modifiedDate: result.modifiedDate,
        messages: result.messages?.map((msg: any) => ({
          severity: msg.severity,
          summary: msg.summary,
          details: msg.details,
        })),
      };
    } catch (error) {
      this.logger.error(`Transaction void failed: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Failed to void transaction: ${error.message}`,
      );
    }
  }

  /**
   * Validate and normalize a US address
   */
  async validateAddress(
    dto: ValidateAddressDto,
  ): Promise<ValidateAddressResponseDto> {
    try {
      this.logger.debug(
        `Validating address: ${dto.line1}, ${dto.city}, ${dto.region} ${dto.postalCode}`,
      );

      const result = await this.client.resolveAddress({
        line1: dto.line1,
        line2: dto.line2,
        line3: dto.line3,
        city: dto.city,
        region: dto.region,
        country: dto.country,
        postalCode: dto.postalCode,
        textCase: dto.textCase || 'Mixed',
      });

      this.logger.debug('Address validated');

      return {
        validatedAddresses:
          result.validatedAddresses?.map((addr: any) => ({
            line1: addr.line1,
            line2: addr.line2,
            line3: addr.line3,
            city: addr.city,
            region: addr.region,
            country: addr.country,
            postalCode: addr.postalCode,
            latitude: addr.latitude,
            longitude: addr.longitude,
            addressType: addr.addressType,
          })) || [],
        coordinates: result.coordinates || { latitude: 0, longitude: 0 },
        resolutionQuality: result.resolutionQuality || 'NotCoded',
        taxAuthorities: result.taxAuthorities?.map((auth: any) => ({
          avalaraId: auth.avalaraId,
          jurisdictionName: auth.jurisdictionName,
          jurisdictionType: auth.jurisdictionType,
          signatureCode: auth.signatureCode,
        })),
        messages: result.messages?.map((msg: any) => ({
          severity: msg.severity,
          summary: msg.summary,
          details: msg.details,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Address validation failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to validate address: ${error.message}`,
      );
    }
  }

  /**
   * Health check for Avalara service
   */
  async healthCheck(): Promise<{ status: string; environment: string }> {
    try {
      // Simple ping to check if credentials are valid
      await this.client.ping();
      return {
        status: 'ok',
        environment: this.config.environment,
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'error',
        environment: this.config.environment,
      };
    }
  }
}
