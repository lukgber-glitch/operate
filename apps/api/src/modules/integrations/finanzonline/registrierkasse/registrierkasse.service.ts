/**
 * Registrierkasse Service
 * Handles Austrian cash register (Registrierkasse) operations with RKSV compliance
 *
 * Features:
 * - Cash register registration with FinanzOnline
 * - Receipt signing with RKSV signatures
 * - DEP (Datenerfassungsprotokoll) export
 * - QR and OCR code generation
 * - Receipt chain validation
 * - Closing receipts (daily, monthly, annual)
 * - Null receipts (Nullbeleg)
 *
 * IMPORTANT: This implementation provides the interface and service structure.
 * Actual signature creation requires a certified HSM or A-Trust signature device.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../cache/redis.service';
import { FinanzOnlineSessionService } from '../finanzonline-session.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  CashRegisterRegistration,
  CashRegisterStatus,
  ReceiptData,
  ReceiptType,
  SignedReceipt,
  RKSVSignature,
  SignatureAlgorithm,
  VATBreakdown,
  SignReceiptRequest,
  StartReceiptRequest,
  NullReceiptRequest,
  ClosingReceiptRequest,
  ClosingReceiptData,
  QRCodeData,
  OCRCodeData,
  FinanzOnlineRegistrationRequest,
  FinanzOnlineRegistrationResponse,
  SignatureVerificationResult,
  CashRegisterStatistics,
  VATRate,
  PaymentMethod,
} from './registrierkasse.types';
import {
  RKSV_VERSION,
  DEP_VERSION,
  DEFAULT_CURRENCY,
  AUSTRIAN_VAT_RATES,
  RECEIPT_NUMBER_FORMAT,
  SIGNATURE_COUNTER_LIMITS,
  TURNOVER_COUNTER_LIMITS,
  REGISTRIERKASSE_ERROR_CODES,
  REGISTRIERKASSE_CACHE_KEYS,
  REGISTRIERKASSE_CACHE_TTL,
  SOFTWARE_INFO,
  JWS_HEADER,
  QR_CODE_CONFIG,
  OCR_CODE_CONFIG,
  RECEIPT_TYPE_MARKERS,
  VALIDATION_PATTERNS,
} from './registrierkasse.constants';

/**
 * Counter state
 */
interface CounterState {
  receiptCounter: number;
  signatureCounter: number;
  turnoverCounter: number;
  lastReceiptHash?: string;
}

@Injectable()
export class RegistrierkasseService {
  private readonly logger = new Logger(RegistrierkasseService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly sessionService: FinanzOnlineSessionService,
  ) {}

  /**
   * Register a new cash register with FinanzOnline
   */
  async registerCashRegister(
    request: FinanzOnlineRegistrationRequest,
  ): Promise<FinanzOnlineRegistrationResponse> {
    try {
      this.logger.log(
        `Registering cash register ${request.cashRegister.cashRegisterId} for organization ${request.organizationId}`,
      );

      // Validate cash register ID format
      if (!VALIDATION_PATTERNS.CASH_REGISTER_ID.test(request.cashRegister.cashRegisterId)) {
        throw new BadRequestException(
          'Invalid cash register ID format. Must be alphanumeric, 1-20 characters.',
        );
      }

      // Check if already registered
      const existing = await this.getCashRegister(
        request.organizationId,
        request.cashRegister.cashRegisterId,
      );

      if (existing) {
        throw new ConflictException(
          `Cash register ${request.cashRegister.cashRegisterId} is already registered`,
        );
      }

      // Validate session
      const sessionValid = await this.sessionService.validateSession(
        request.sessionId,
        request.organizationId,
      );

      if (!sessionValid) {
        throw new BadRequestException('Invalid or expired FinanzOnline session');
      }

      // TODO: Implement actual FinanzOnline registration via SOAP
      // For now, we simulate a successful registration

      // Store cash register data
      const registration: CashRegisterRegistration = {
        ...request.cashRegister,
        organizationId: request.organizationId,
        status: CashRegisterStatus.ACTIVE,
        registeredAt: new Date(),
      };

      await this.storeCashRegister(registration);

      // Initialize counters
      await this.initializeCounters(request.cashRegister.cashRegisterId);

      // Create start receipt
      await this.createStartReceipt({
        cashRegisterId: request.cashRegister.cashRegisterId,
        organizationId: request.organizationId,
      });

      this.logger.log(
        `Cash register ${request.cashRegister.cashRegisterId} registered successfully`,
      );

      return {
        success: true,
        confirmationNumber: `RK-${Date.now()}-${request.cashRegister.cashRegisterId}`,
        registeredAt: new Date(),
        cashRegisterId: request.cashRegister.cashRegisterId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to register cash register: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create start receipt (Startbeleg)
   */
  async createStartReceipt(request: StartReceiptRequest): Promise<SignedReceipt> {
    try {
      this.logger.log(`Creating start receipt for cash register ${request.cashRegisterId}`);

      const cashRegister = await this.getCashRegister(
        request.organizationId,
        request.cashRegisterId,
      );

      if (!cashRegister) {
        throw new NotFoundException(
          `Cash register ${request.cashRegisterId} not found`,
        );
      }

      const receiptData: ReceiptData = {
        cashRegisterId: request.cashRegisterId,
        receiptNumber: 1, // Start receipt is always #1
        dateTime: new Date(),
        type: ReceiptType.START,
        items: [],
        totalAmount: 0,
        vatBreakdown: [],
        currency: DEFAULT_CURRENCY,
        trainingMode: false,
      };

      return await this.signReceipt({ cashRegisterId: request.cashRegisterId, receiptData });
    } catch (error) {
      this.logger.error(`Failed to create start receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sign a receipt with RKSV signature
   */
  async signReceipt(request: SignReceiptRequest): Promise<SignedReceipt> {
    try {
      this.logger.debug(`Signing receipt for cash register ${request.cashRegisterId}`);

      // Get cash register
      const cashRegister = await this.getCashRegister(
        request.receiptData.cashRegisterId,
        request.cashRegisterId,
      );

      if (!cashRegister) {
        throw new NotFoundException(
          `Cash register ${request.cashRegisterId} not found`,
        );
      }

      if (cashRegister.status !== CashRegisterStatus.ACTIVE) {
        throw new BadRequestException(
          `Cash register ${request.cashRegisterId} is not active`,
        );
      }

      // Validate receipt data
      this.validateReceiptData(request.receiptData);

      // Get current counters
      const counters = await this.getCounters(request.cashRegisterId);

      // Increment counters
      const newReceiptNumber = counters.receiptCounter + 1;
      const newSignatureCounter = counters.signatureCounter + 1;
      const newTurnoverCounter = counters.turnoverCounter + request.receiptData.totalAmount;

      // Check counter limits
      if (newReceiptNumber > RECEIPT_NUMBER_FORMAT.MAX) {
        throw new InternalServerErrorException(
          REGISTRIERKASSE_ERROR_CODES.COUNTER_OVERFLOW,
        );
      }

      if (newSignatureCounter > SIGNATURE_COUNTER_LIMITS.MAX) {
        throw new InternalServerErrorException(
          REGISTRIERKASSE_ERROR_CODES.COUNTER_OVERFLOW,
        );
      }

      // Create signature
      const signature = await this.createRKSVSignature(
        cashRegister,
        request.receiptData,
        newSignatureCounter,
        newTurnoverCounter,
        counters.lastReceiptHash,
      );

      // Create signed receipt
      const signedReceipt: SignedReceipt = {
        id: uuidv4(),
        organizationId: cashRegister.organizationId,
        cashRegisterId: request.cashRegisterId,
        receiptNumber: newReceiptNumber,
        dateTime: request.receiptData.dateTime,
        type: request.receiptData.type,
        items: request.receiptData.items,
        totalAmount: request.receiptData.totalAmount,
        vatBreakdown: request.receiptData.vatBreakdown,
        paymentMethod: request.receiptData.paymentMethod,
        currency: request.receiptData.currency || DEFAULT_CURRENCY,
        trainingMode: request.receiptData.trainingMode || false,
        signature,
        qrCode: this.generateQRCode(request.cashRegisterId, newReceiptNumber, request.receiptData, signature),
        ocrCode: this.generateOCRCode(request.cashRegisterId, newReceiptNumber, request.receiptData, signature),
        depFormat: DEP_VERSION,
        previousReceiptHash: counters.lastReceiptHash,
        previousReceiptId: request.receiptData.previousReceiptId,
        customerReference: request.receiptData.customerReference,
        notes: request.receiptData.notes,
        createdAt: new Date(),
      };

      // Calculate receipt hash for chain
      const receiptHash = this.calculateReceiptHash(signedReceipt);

      // Update counters
      await this.updateCounters(request.cashRegisterId, {
        receiptCounter: newReceiptNumber,
        signatureCounter: newSignatureCounter,
        turnoverCounter: newTurnoverCounter,
        lastReceiptHash: receiptHash,
      });

      // TODO: Store receipt in database (not implemented in this service layer)

      this.logger.debug(
        `Receipt signed successfully: ${signedReceipt.id}, number: ${newReceiptNumber}`,
      );

      return signedReceipt;
    } catch (error) {
      this.logger.error(`Failed to sign receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create null receipt (Nullbeleg)
   */
  async createNullReceipt(request: NullReceiptRequest): Promise<SignedReceipt> {
    try {
      this.logger.log(`Creating null receipt for cash register ${request.cashRegisterId}`);

      const cashRegister = await this.getCashRegister(
        request.organizationId,
        request.cashRegisterId,
      );

      if (!cashRegister) {
        throw new NotFoundException(
          `Cash register ${request.cashRegisterId} not found`,
        );
      }

      const receiptData: ReceiptData = {
        cashRegisterId: request.cashRegisterId,
        receiptNumber: 0, // Will be set by signReceipt
        dateTime: new Date(),
        type: ReceiptType.NULL,
        items: [],
        totalAmount: 0,
        vatBreakdown: [],
        currency: DEFAULT_CURRENCY,
        trainingMode: false,
      };

      return await this.signReceipt({ cashRegisterId: request.cashRegisterId, receiptData });
    } catch (error) {
      this.logger.error(`Failed to create null receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create closing receipt (Tagesabschluss, Monatsabschluss, Jahresabschluss)
   */
  async createClosingReceipt(request: ClosingReceiptRequest): Promise<SignedReceipt> {
    try {
      this.logger.log(
        `Creating ${request.closingType} for cash register ${request.cashRegisterId}`,
      );

      const cashRegister = await this.getCashRegister(
        request.organizationId,
        request.cashRegisterId,
      );

      if (!cashRegister) {
        throw new NotFoundException(
          `Cash register ${request.cashRegisterId} not found`,
        );
      }

      // TODO: Calculate closing data from stored receipts
      // For now, create a simple closing receipt
      const closingData: ClosingReceiptData = {
        totalReceipts: 0,
        totalTurnover: 0,
        vatBreakdown: [],
        startCounter: 0,
        endCounter: 0,
      };

      const receiptData: ReceiptData = {
        cashRegisterId: request.cashRegisterId,
        receiptNumber: 0, // Will be set by signReceipt
        dateTime: new Date(),
        type: request.closingType,
        items: [],
        totalAmount: closingData.totalTurnover,
        vatBreakdown: closingData.vatBreakdown,
        currency: DEFAULT_CURRENCY,
        trainingMode: false,
        notes: `Period: ${request.periodStart.toISOString()} - ${request.periodEnd.toISOString()}`,
      };

      return await this.signReceipt({ cashRegisterId: request.cashRegisterId, receiptData });
    } catch (error) {
      this.logger.error(`Failed to create closing receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create RKSV signature
   * IMPORTANT: This is a simplified implementation for demonstration.
   * Production requires certified HSM or A-Trust signature device.
   */
  private async createRKSVSignature(
    cashRegister: CashRegisterRegistration,
    receiptData: ReceiptData,
    signatureCounter: number,
    turnoverCounter: number,
    previousReceiptHash?: string,
  ): Promise<RKSVSignature> {
    try {
      // Prepare data for signing (simplified)
      const signatureData = {
        cashRegisterId: receiptData.cashRegisterId,
        receiptNumber: receiptData.receiptNumber,
        dateTime: receiptData.dateTime.toISOString(),
        totalAmount: receiptData.totalAmount,
        signatureCounter,
        turnoverCounter,
        previousReceiptHash: previousReceiptHash || '0',
      };

      // In production, this would call HSM/A-Trust API
      // For now, create a mock JWS signature
      const payload = Buffer.from(JSON.stringify(signatureData)).toString('base64url');
      const header = Buffer.from(JSON.stringify(JWS_HEADER)).toString('base64url');

      // Mock signature (in production, this comes from HSM/A-Trust)
      const mockSignature = crypto
        .createHash('sha256')
        .update(`${header}.${payload}.${cashRegister.aesKey}`)
        .digest('base64url');

      const jws = `${header}.${payload}.${mockSignature}`;

      const signature: RKSVSignature = {
        jws,
        certificateSerial: cashRegister.signatureDevice.certificateSerial || 'MOCK-CERT-001',
        algorithm: cashRegister.signatureDevice.algorithm || SignatureAlgorithm.ES256,
        signatureCounter,
        turnoverCounter,
        timestamp: new Date(),
      };

      return signature;
    } catch (error) {
      this.logger.error('Failed to create RKSV signature', error);
      throw new InternalServerErrorException(
        REGISTRIERKASSE_ERROR_CODES.SIGNATURE_DEVICE_ERROR,
      );
    }
  }

  /**
   * Generate QR code data (machine-readable format)
   */
  private generateQRCode(
    cashRegisterId: string,
    receiptNumber: number,
    receiptData: ReceiptData,
    signature: RKSVSignature,
  ): string {
    const qrData: QRCodeData = {
      cashRegisterId,
      receiptNumber,
      dateTime: receiptData.dateTime.toISOString(),
      totalAmount: receiptData.totalAmount,
      jws: signature.jws,
      certificateSerial: signature.certificateSerial,
    };

    // In production, this would generate actual QR code image
    // For now, return URL-encoded data string
    return `_R1-${cashRegisterId}_${receiptNumber}_${receiptData.dateTime.toISOString()}_${receiptData.totalAmount}_${signature.jws}`;
  }

  /**
   * Generate OCR code (human-readable backup)
   */
  private generateOCRCode(
    cashRegisterId: string,
    receiptNumber: number,
    receiptData: ReceiptData,
    signature: RKSVSignature,
  ): string {
    // Simplified OCR code format
    const date = receiptData.dateTime;
    const dateCode = date.toISOString().slice(2, 10).replace(/-/g, '');
    const timeCode = date.toISOString().slice(11, 16).replace(':', '');
    const amountCode = Math.abs(receiptData.totalAmount).toString().padStart(10, '0');

    // Checksum (simplified - first 4 chars of signature)
    const signatureChecksum = signature.jws.slice(0, 4).toUpperCase();

    return `${cashRegisterId}-${receiptNumber}-${dateCode}-${timeCode}-${amountCode}-${signatureChecksum}`;
  }

  /**
   * Calculate receipt hash for chain validation
   */
  private calculateReceiptHash(receipt: SignedReceipt): string {
    const hashData = `${receipt.cashRegisterId}:${receipt.receiptNumber}:${receipt.signature.jws}`;
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Validate receipt data
   */
  private validateReceiptData(receiptData: ReceiptData): void {
    if (!receiptData.cashRegisterId) {
      throw new BadRequestException('Cash register ID is required');
    }

    if (!receiptData.dateTime) {
      throw new BadRequestException('Receipt date/time is required');
    }

    if (!receiptData.type) {
      throw new BadRequestException('Receipt type is required');
    }

    // Validate VAT breakdown matches total
    const vatTotal = receiptData.vatBreakdown.reduce(
      (sum, vat) => sum + vat.grossAmount,
      0,
    );

    if (Math.abs(vatTotal - receiptData.totalAmount) > 1) { // Allow 1 cent rounding
      throw new BadRequestException(
        `VAT breakdown total (${vatTotal}) does not match receipt total (${receiptData.totalAmount})`,
      );
    }

    // Validate items if present
    if (receiptData.items && receiptData.items.length > 0) {
      const itemsTotal = receiptData.items.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );

      if (Math.abs(itemsTotal - receiptData.totalAmount) > 1) {
        throw new BadRequestException(
          `Items total (${itemsTotal}) does not match receipt total (${receiptData.totalAmount})`,
        );
      }
    }
  }

  /**
   * Get cash register from cache/storage
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
   * Store cash register in cache
   */
  private async storeCashRegister(cashRegister: CashRegisterRegistration): Promise<void> {
    const key = `${REGISTRIERKASSE_CACHE_KEYS.CASH_REGISTER}${cashRegister.organizationId}:${cashRegister.cashRegisterId}`;
    await this.redisService.set(
      key,
      cashRegister,
      REGISTRIERKASSE_CACHE_TTL.CASH_REGISTER,
    );
  }

  /**
   * Initialize counters for new cash register
   */
  private async initializeCounters(cashRegisterId: string): Promise<void> {
    const counters: CounterState = {
      receiptCounter: RECEIPT_NUMBER_FORMAT.MIN - 1,
      signatureCounter: SIGNATURE_COUNTER_LIMITS.INITIAL,
      turnoverCounter: TURNOVER_COUNTER_LIMITS.INITIAL,
    };

    await this.updateCounters(cashRegisterId, counters);
  }

  /**
   * Get current counter values
   */
  private async getCounters(cashRegisterId: string): Promise<CounterState> {
    const receiptKey = `${REGISTRIERKASSE_CACHE_KEYS.RECEIPT_COUNTER}${cashRegisterId}`;
    const signatureKey = `${REGISTRIERKASSE_CACHE_KEYS.SIGNATURE_COUNTER}${cashRegisterId}`;
    const turnoverKey = `${REGISTRIERKASSE_CACHE_KEYS.TURNOVER_COUNTER}${cashRegisterId}`;
    const hashKey = `${REGISTRIERKASSE_CACHE_KEYS.LAST_RECEIPT_HASH}${cashRegisterId}`;

    const [receiptCounter, signatureCounter, turnoverCounter, lastReceiptHash] = await Promise.all([
      this.redisService.get<number>(receiptKey),
      this.redisService.get<number>(signatureKey),
      this.redisService.get<number>(turnoverKey),
      this.redisService.get<string>(hashKey),
    ]);

    return {
      receiptCounter: receiptCounter ?? RECEIPT_NUMBER_FORMAT.MIN - 1,
      signatureCounter: signatureCounter ?? SIGNATURE_COUNTER_LIMITS.INITIAL,
      turnoverCounter: turnoverCounter ?? TURNOVER_COUNTER_LIMITS.INITIAL,
      lastReceiptHash: lastReceiptHash ?? undefined,
    };
  }

  /**
   * Update counter values
   */
  private async updateCounters(cashRegisterId: string, counters: CounterState): Promise<void> {
    const receiptKey = `${REGISTRIERKASSE_CACHE_KEYS.RECEIPT_COUNTER}${cashRegisterId}`;
    const signatureKey = `${REGISTRIERKASSE_CACHE_KEYS.SIGNATURE_COUNTER}${cashRegisterId}`;
    const turnoverKey = `${REGISTRIERKASSE_CACHE_KEYS.TURNOVER_COUNTER}${cashRegisterId}`;
    const hashKey = `${REGISTRIERKASSE_CACHE_KEYS.LAST_RECEIPT_HASH}${cashRegisterId}`;

    const ttl = REGISTRIERKASSE_CACHE_TTL.COUNTER;

    await Promise.all([
      this.redisService.set(receiptKey, counters.receiptCounter, ttl),
      this.redisService.set(signatureKey, counters.signatureCounter, ttl),
      this.redisService.set(turnoverKey, counters.turnoverCounter, ttl),
      counters.lastReceiptHash
        ? this.redisService.set(hashKey, counters.lastReceiptHash, ttl)
        : Promise.resolve(),
    ]);
  }

  /**
   * Verify receipt signature
   */
  async verifyReceipt(receipt: SignedReceipt): Promise<SignatureVerificationResult> {
    try {
      this.logger.debug(`Verifying receipt ${receipt.id}`);

      const result: SignatureVerificationResult = {
        valid: false,
        receiptId: receipt.id,
        verifiedAt: new Date(),
        details: {
          jwsValid: false,
          certificateValid: false,
          chainValid: false,
          counterValid: false,
          turnoverValid: false,
        },
        errors: [],
      };

      // TODO: Implement actual signature verification with HSM/A-Trust
      // For now, perform basic checks

      // Check JWS format
      const jwsParts = receipt.signature.jws.split('.');
      if (jwsParts.length !== 3) {
        result.errors!.push('Invalid JWS format');
      } else {
        result.details.jwsValid = true;
      }

      // Check certificate serial
      if (receipt.signature.certificateSerial) {
        result.details.certificateValid = true;
      } else {
        result.errors!.push('Missing certificate serial');
      }

      // Check counter validity
      if (receipt.signature.signatureCounter > 0) {
        result.details.counterValid = true;
      } else {
        result.errors!.push('Invalid signature counter');
      }

      // Check turnover counter
      if (receipt.signature.turnoverCounter >= 0) {
        result.details.turnoverValid = true;
      } else {
        result.errors!.push('Invalid turnover counter');
      }

      // Overall validity
      result.valid =
        result.details.jwsValid &&
        result.details.certificateValid &&
        result.details.counterValid &&
        result.details.turnoverValid;

      return result;
    } catch (error) {
      this.logger.error(`Receipt verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
