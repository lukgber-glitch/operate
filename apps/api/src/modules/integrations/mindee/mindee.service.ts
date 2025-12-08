import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import {
  ReceiptParseResultDto,
  AsyncJobDto,
  MindeeHealthDto,
  MerchantDto,
  DateDto,
  TotalsDto,
  LineItemDto,
} from './dto/mindee.dto';
import {
  MINDEE_CONFIG,
  isMindeeConfigured,
  isSupportedMimeType,
  isValidFileSize,
} from './mindee.config';

/**
 * Mindee Receipt OCR Service
 * Handles receipt parsing using Mindee's API
 */
@Injectable()
export class MindeeService {
  private readonly logger = new Logger(MindeeService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly mockMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.mockMode = !isMindeeConfigured();

    if (this.mockMode) {
      this.logger.warn(
        '⚠️  MINDEE_API_KEY not configured - running in MOCK MODE',
      );
      this.logger.warn(
        'Set MINDEE_API_KEY environment variable to use real API',
      );
    }

    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: MINDEE_CONFIG.baseUrl,
      timeout: MINDEE_CONFIG.timeout,
      headers: {
        Authorization: `Token ${MINDEE_CONFIG.apiKey}`,
      },
    });
  }

  /**
   * Parse a receipt image/PDF (synchronous)
   * @param file - File buffer
   * @param mimeType - MIME type of the file
   * @returns Receipt parse result
   */
  async parseReceipt(
    file: Buffer,
    mimeType: string,
  ): Promise<ReceiptParseResultDto> {
    try {
      // Validate inputs
      this.validateFile(file, mimeType);

      // Return mock data if not configured
      if (this.mockMode) {
        return this.getMockReceipt();
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('document', file, {
        filename: 'receipt',
        contentType: mimeType,
      });

      // Make API request
      const startTime = Date.now();
      const response = await this.axiosInstance.post(
        MINDEE_CONFIG.receiptEndpoint,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Receipt parsed successfully in ${duration}ms`);

      // Transform response to our DTO
      return this.transformResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'parseReceipt');
    }
  }

  /**
   * Parse a receipt asynchronously (for larger files)
   * @param file - File buffer
   * @param mimeType - MIME type of the file
   * @returns Job ID for polling
   */
  async parseReceiptAsync(
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      // Validate inputs
      this.validateFile(file, mimeType);

      // Return mock job ID if not configured
      if (this.mockMode) {
        const jobId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        this.logger.log(`Mock async job created: ${jobId}`);
        return jobId;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('document', file, {
        filename: 'receipt',
        contentType: mimeType,
      });

      // Make async API request
      const response = await this.axiosInstance.post(
        MINDEE_CONFIG.receiptAsyncEndpoint,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      const jobId = response.data.job?.id;
      if (!jobId) {
        throw new InternalServerErrorException(
          'Failed to get job ID from async response',
        );
      }

      this.logger.log(`Async parsing job created: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error('Async parsing failed', error);
      throw this.mapError(error);
    }
  }

  /**
   * Get async job result
   * @param jobId - Job ID from parseReceiptAsync
   * @returns Receipt parse result
   */
  async getParseResult(jobId: string): Promise<ReceiptParseResultDto> {
    try {
      // Return mock data for mock jobs
      if (this.mockMode || jobId.startsWith('mock_')) {
        // Simulate processing delay
        await this.sleep(1000);
        return this.getMockReceipt();
      }

      // Poll for job completion
      const result = await this.pollJobResult(jobId);
      return this.transformResponse(result);
    } catch (error) {
      return this.handleError(error, 'getParseResult');
    }
  }

  /**
   * Check Mindee API connection
   * @returns Health check result
   */
  async checkConnection(): Promise<MindeeHealthDto> {
    if (this.mockMode) {
      return {
        available: true,
        responseTime: 0,
        mockMode: true,
      };
    }

    try {
      const startTime = Date.now();

      // Make a lightweight request to check connection
      await this.axiosInstance.get('/health', {
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      return {
        available: true,
        responseTime,
        mockMode: false,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        available: false,
        responseTime: 0,
        error: error.message,
        mockMode: false,
      };
    }
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: Buffer, mimeType: string): void {
    if (!file || file.length === 0) {
      throw new BadRequestException('File is empty');
    }

    if (!isValidFileSize(file.length)) {
      throw new BadRequestException(
        `File size exceeds maximum of ${MINDEE_CONFIG.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (!isSupportedMimeType(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Supported types: ${MINDEE_CONFIG.supportedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Transform Mindee API response to our DTO
   */
  private transformResponse(apiResponse: any): ReceiptParseResultDto {
    try {
      const prediction = apiResponse.document?.inference?.prediction;

      if (!prediction) {
        throw new InternalServerErrorException(
          'Invalid API response format',
        );
      }

      // Extract merchant info
      const merchant: MerchantDto = {
        name: prediction.supplier_name?.value || undefined,
        address: prediction.supplier_address?.value || undefined,
        phone: prediction.supplier_phone_number?.value || undefined,
        confidence: this.calculateAverageConfidence([
          prediction.supplier_name?.confidence,
          prediction.supplier_address?.confidence,
        ]),
      };

      // Extract date info
      const date: DateDto = {
        value: prediction.date?.value
          ? new Date(prediction.date.value)
          : undefined,
        confidence: prediction.date?.confidence || 0,
      };

      // Extract time
      const time = prediction.time?.value;

      // Extract totals
      const totals: TotalsDto = {
        amount: prediction.total_amount?.value || undefined,
        tax: prediction.total_tax?.value || undefined,
        tip: prediction.tip?.value || undefined,
        currency: prediction.locale?.currency || 'EUR',
        confidence: this.calculateAverageConfidence([
          prediction.total_amount?.confidence,
          prediction.total_tax?.confidence,
        ]),
      };

      // Extract line items
      const lineItems: LineItemDto[] = (prediction.line_items || []).map(
        (item: any) => ({
          description: item.description || 'Unknown item',
          quantity: item.quantity || undefined,
          unitPrice: item.unit_price || undefined,
          totalPrice: item.total_amount || undefined,
          confidence: item.confidence || 0,
        }),
      );

      // Extract payment method and receipt number
      const paymentMethod = prediction.payment_method?.value;
      const receiptNumber = prediction.receipt_number?.value;

      // Calculate overall confidence
      const overallConfidence = this.calculateAverageConfidence([
        merchant.confidence,
        date.confidence,
        totals.confidence,
      ]);

      return {
        success: true,
        confidence: overallConfidence,
        merchant,
        date,
        time,
        totals,
        lineItems,
        paymentMethod,
        receiptNumber,
        rawResponse: apiResponse,
      };
    } catch (error) {
      this.logger.error('Failed to transform response', error);
      throw new InternalServerErrorException(
        'Failed to parse API response',
      );
    }
  }

  /**
   * Calculate average confidence from array of scores
   */
  private calculateAverageConfidence(scores: (number | undefined)[]): number {
    const validScores = scores.filter(
      (score) => score !== undefined && score !== null,
    ) as number[];

    if (validScores.length === 0) {
      return 0;
    }

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return sum / validScores.length;
  }

  /**
   * Poll for async job result
   */
  private async pollJobResult(jobId: string): Promise<any> {
    const { initialDelay, interval, maxAttempts } = MINDEE_CONFIG.polling;

    // Wait initial delay
    await this.sleep(initialDelay);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.axiosInstance.get(
          `/documents/queue/${jobId}`,
        );

        const status = response.data.job?.status;

        if (status === 'completed') {
          this.logger.log(`Job ${jobId} completed after ${attempt} attempts`);
          return response.data;
        }

        if (status === 'failed') {
          throw new InternalServerErrorException(
            `Job ${jobId} failed: ${response.data.job?.error || 'Unknown error'}`,
          );
        }

        // Still processing, wait and retry
        this.logger.debug(
          `Job ${jobId} still processing (attempt ${attempt}/${maxAttempts})`,
        );
        await this.sleep(interval);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        // Continue polling on transient errors
        this.logger.warn(`Poll attempt ${attempt} failed, retrying...`);
        await this.sleep(interval);
      }
    }

    throw new ServiceUnavailableException(
      `Job ${jobId} timed out after ${maxAttempts} attempts`,
    );
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle errors and return graceful response
   */
  private handleError(error: any, context: string): ReceiptParseResultDto {
    this.logger.error(`${context} failed`, error);

    const errorMessage = error?.response?.data?.error?.message || error.message;

    return {
      success: false,
      confidence: 0,
      merchant: { confidence: 0 },
      date: { confidence: 0 },
      totals: { confidence: 0 },
      lineItems: [],
      errorMessage,
    };
  }

  /**
   * Map axios errors to NestJS exceptions
   */
  private mapError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const message =
          (axiosError.response.data as Prisma.InputJsonValue)?.error?.message ||
          'Mindee API error';

        if (status === 400) {
          return new BadRequestException(message);
        }
        if (status === 401 || status === 403) {
          return new BadRequestException('Invalid API key');
        }
        if (status === 429) {
          return new ServiceUnavailableException('Rate limit exceeded');
        }
        if (status >= 500) {
          return new ServiceUnavailableException('Mindee service unavailable');
        }
      }

      if (axiosError.code === 'ECONNABORTED') {
        return new ServiceUnavailableException('Request timeout');
      }
    }

    return new InternalServerErrorException('Failed to parse receipt');
  }

  /**
   * Get mock receipt data for development
   */
  private getMockReceipt(): ReceiptParseResultDto {
    return {
      success: true,
      confidence: 0.92,
      merchant: {
        name: 'Mock Coffee Shop',
        address: '123 Main St, Berlin, 10115',
        phone: '+49 30 12345678',
        confidence: 0.95,
      },
      date: {
        value: new Date('2024-12-02'),
        confidence: 0.98,
      },
      time: '14:30',
      totals: {
        amount: 15.5,
        tax: 2.48,
        tip: 2.0,
        currency: 'EUR',
        confidence: 0.99,
      },
      lineItems: [
        {
          description: 'Cappuccino',
          quantity: 2,
          unitPrice: 4.5,
          totalPrice: 9.0,
          confidence: 0.95,
        },
        {
          description: 'Croissant',
          quantity: 1,
          unitPrice: 3.5,
          totalPrice: 3.5,
          confidence: 0.93,
        },
        {
          description: 'Orange Juice',
          quantity: 1,
          unitPrice: 3.0,
          totalPrice: 3.0,
          confidence: 0.91,
        },
      ],
      paymentMethod: 'Card',
      receiptNumber: 'RCP-2024-001234',
      rawResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
