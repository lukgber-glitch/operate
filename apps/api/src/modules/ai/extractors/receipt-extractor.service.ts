/**
 * Receipt Extractor Service
 * AI-powered receipt extraction using OpenAI GPT-4 Vision
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import OpenAI from 'openai';
import * as sharp from 'sharp';
import * as pdf from 'pdf-lib';
import {
  ExtractReceiptRequestDto,
  ReceiptExtractionResultDto,
  ExtractedReceiptDataDto,
  ReceiptExtractionStatus,
  PaymentMethodType,
  ReceiptType,
  FieldConfidenceDto,
} from './dto/receipt-extraction.dto';
import {
  getReceiptExtractionPrompt,
  getCategorizationPrompt,
} from './prompts/receipt-prompt';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

interface ProcessedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

interface OpenAIExtractionResponse {
  merchantName: string;
  merchantAddress?: string;
  merchantPhone?: string;
  merchantVatId?: string;
  receiptNumber?: string;
  date: string;
  time?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    productCode?: string;
  }>;
  subtotal: number;
  tax: number;
  tip?: number;
  discount?: number;
  total: number;
  currency: string;
  taxRate?: number;
  paymentMethod: PaymentMethodType;
  cardLast4?: string;
  receiptType: ReceiptType;
  fieldConfidences: Array<{
    field: string;
    confidence: number;
    notes?: string;
  }>;
  overallConfidence: number;
  metadata?: {
    language?: string;
    quality?: string;
    calculationVerified?: boolean;
    warnings?: string[];
  };
}

interface CategorizationResponse {
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string;
  taxDeductible: boolean;
  deductionPercentage?: number;
}

@Injectable()
export class ReceiptExtractorService {
  private readonly logger = new Logger(ReceiptExtractorService.name);
  private openai: OpenAI;
  private readonly maxRetries = 3;
  private readonly maxImageSize = 4096; // Max dimension for GPT-4V
  private readonly supportedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
  ];

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue('receipt-extraction') private extractionQueue: Queue,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured. Receipt extraction will fail.');
    } else {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for receipt extraction');
    }
  }

  /**
   * Extract receipt data from image/PDF
   */
  async extractReceipt(
    request: ExtractReceiptRequestDto,
  ): Promise<ReceiptExtractionResultDto> {
    const startTime = Date.now();
    const { file, mimeType, organisationId, userId, fileName, autoCategorize, autoCreateExpense } = request;

    this.logger.log(
      `Starting receipt extraction for org ${organisationId}, file: ${fileName || 'unnamed'}`,
    );

    // Validate file type
    if (!this.supportedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Supported types: ${this.supportedMimeTypes.join(', ')}`,
      );
    }

    // Create extraction record
    const extraction = await this.createExtractionRecord({
      organisationId,
      userId,
      fileName: fileName || `receipt-${Date.now()}.${this.getFileExtension(mimeType)}`,
      mimeType,
      fileSize: file.length,
    });

    try {
      // Update status to processing
      await this.updateExtractionStatus(extraction.id, ReceiptExtractionStatus.PROCESSING);

      // Process file (convert PDF to image if needed, preprocess image)
      const processedImage = await this.preprocessFile(file, mimeType);

      // Extract data using GPT-4 Vision
      const extractedData = await this.extractWithGPT4Vision(processedImage);

      // Categorize if requested
      let categorization: CategorizationResponse | undefined;
      if (autoCategorize) {
        categorization = await this.categorizeReceipt(extractedData);
      }

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Determine final status
      const status =
        extractedData.overallConfidence < 0.6
          ? ReceiptExtractionStatus.NEEDS_REVIEW
          : ReceiptExtractionStatus.COMPLETED;

      // Update extraction record with results
      const result = await this.updateExtractionResults({
        extractionId: extraction.id,
        extractedData,
        categorization,
        status,
        processingTimeMs,
      });

      this.logger.log(
        `Receipt extraction completed: ${extraction.id}, confidence: ${extractedData.overallConfidence.toFixed(2)}, time: ${processingTimeMs}ms`,
      );

      // Queue expense creation if requested
      if (autoCreateExpense && status === ReceiptExtractionStatus.COMPLETED) {
        await this.queueExpenseCreation(extraction.id, organisationId, userId);
      }

      return result;
    } catch (error) {
      this.logger.error(`Receipt extraction failed for ${extraction.id}:`, error);

      // Update extraction with error
      await this.updateExtractionStatus(
        extraction.id,
        ReceiptExtractionStatus.FAILED,
        error.message,
      );

      throw new BadRequestException(`Receipt extraction failed: ${error.message}`);
    }
  }

  /**
   * Get extraction by ID
   */
  async getExtraction(extractionId: string): Promise<ReceiptExtractionResultDto> {
    const extraction = await this.prisma.extractedReceipt.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) {
      throw new BadRequestException(`Extraction ${extractionId} not found`);
    }

    return this.mapToDto(extraction);
  }

  /**
   * Get extraction history with filters
   */
  async getExtractionHistory(
    organisationId: string,
    filters?: any,
  ): Promise<{ data: ReceiptExtractionResultDto[]; total: number; page: number; pageSize: number }> {
    const {
      status,
      userId,
      receiptType,
      fromDate,
      toDate,
      minConfidence,
      page = 1,
      pageSize = 20,
    } = filters || {};

    const where: any = { organisationId };

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (receiptType) where.receiptType = receiptType;
    if (minConfidence) where.overallConfidence = { gte: minConfidence };

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const skip = (page - 1) * pageSize;

    const [extractions, total] = await Promise.all([
      this.prisma.extractedReceipt.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.extractedReceipt.count({ where }),
    ]);

    return {
      data: extractions.map(this.mapToDto),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Preprocess file (PDF to image conversion, image optimization)
   */
  private async preprocessFile(file: Buffer, mimeType: string): Promise<ProcessedImage> {
    try {
      let imageBuffer: Buffer;

      // Convert PDF to image if needed
      if (mimeType === 'application/pdf') {
        imageBuffer = await this.pdfToImage(file);
      } else {
        imageBuffer = file;
      }

      // Preprocess image with Sharp
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Auto-rotate based on EXIF
      image.rotate();

      // Resize if too large
      const maxDim = Math.max(metadata.width || 0, metadata.height || 0);
      if (maxDim > this.maxImageSize) {
        const scale = this.maxImageSize / maxDim;
        image.resize({
          width: Math.round((metadata.width || 0) * scale),
          height: Math.round((metadata.height || 0) * scale),
          fit: 'inside',
        });
      }

      // Enhance contrast and sharpness for better OCR
      image.normalize().sharpen();

      // Convert to PNG for best quality
      const processedBuffer = await image.png().toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      // Convert to base64
      const base64 = processedBuffer.toString('base64');

      return {
        base64,
        mimeType: 'image/png',
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
      };
    } catch (error) {
      this.logger.error('Image preprocessing failed:', error);
      throw new BadRequestException('Failed to process image');
    }
  }

  /**
   * Convert PDF to image
   */
  private async pdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      // Load PDF
      const pdfDoc = await pdf.PDFDocument.load(pdfBuffer);
      const firstPage = pdfDoc.getPage(0);

      // For now, we'll just throw an error and recommend using images
      // In production, you'd use a library like pdf-poppler or ghostscript
      throw new BadRequestException(
        'PDF extraction not fully implemented. Please convert PDF to image (PNG/JPG) first.',
      );

      // TODO: Implement PDF to image conversion using pdf-poppler or similar
      // This is a placeholder for the actual implementation
    } catch (error) {
      this.logger.error('PDF to image conversion failed:', error);
      throw new BadRequestException('Failed to convert PDF to image');
    }
  }

  /**
   * Extract receipt data using GPT-4 Vision
   */
  private async extractWithGPT4Vision(
    image: ProcessedImage,
  ): Promise<OpenAIExtractionResponse> {
    const prompt = getReceiptExtractionPrompt();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`GPT-4 Vision extraction attempt ${attempt}/${this.maxRetries}`);

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: prompt.system,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt.user,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${image.mimeType};base64,${image.base64}`,
                    detail: 'high', // Use high detail for better accuracy
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.1, // Low temperature for consistent extraction
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from GPT-4 Vision');
        }

        // Parse JSON response
        const extractedData = this.parseGPT4Response(content);

        // Validate extracted data
        this.validateExtractedData(extractedData);

        return extractedData;
      } catch (error) {
        this.logger.warn(`Extraction attempt ${attempt} failed:`, error.message);

        if (attempt === this.maxRetries) {
          throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    throw new Error('Extraction failed');
  }

  /**
   * Parse GPT-4 response
   */
  private parseGPT4Response(content: string): OpenAIExtractionResponse {
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      return parsed as OpenAIExtractionResponse;
    } catch (error) {
      this.logger.error('Failed to parse GPT-4 response:', error);
      this.logger.debug('Response content:', content);
      throw new Error('Invalid JSON response from GPT-4');
    }
  }

  /**
   * Validate extracted data
   */
  private validateExtractedData(data: OpenAIExtractionResponse): void {
    if (!data.merchantName) {
      throw new Error('Missing required field: merchantName');
    }
    if (!data.date) {
      throw new Error('Missing required field: date');
    }
    if (typeof data.total !== 'number') {
      throw new Error('Invalid total amount');
    }
    if (!Array.isArray(data.items)) {
      throw new Error('Invalid items array');
    }
    if (typeof data.overallConfidence !== 'number' || data.overallConfidence < 0 || data.overallConfidence > 1) {
      throw new Error('Invalid overall confidence score');
    }
  }

  /**
   * Categorize receipt for expense tracking
   */
  private async categorizeReceipt(
    extractedData: OpenAIExtractionResponse,
  ): Promise<CategorizationResponse> {
    try {
      const prompt = getCategorizationPrompt(extractedData);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No categorization response');
      }

      return this.parseGPT4Response(content) as CategorizationResponse;
    } catch (error) {
      this.logger.warn('Categorization failed:', error.message);
      // Return default categorization
      return {
        category: 'OTHER',
        subcategory: 'Uncategorized',
        confidence: 0.3,
        reasoning: 'Auto-categorization failed',
        taxDeductible: false,
      };
    }
  }

  /**
   * Create extraction record in database
   */
  private async createExtractionRecord(params: {
    organisationId: string;
    userId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }) {
    return await this.prisma.extractedReceipt.create({
      data: {
        organisationId: params.organisationId,
        userId: params.userId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
        status: ReceiptExtractionStatus.PENDING,
        extractedData: {},
        overallConfidence: 0,
        fieldConfidences: [],
      },
    });
  }

  /**
   * Update extraction status
   */
  private async updateExtractionStatus(
    extractionId: string,
    status: ReceiptExtractionStatus,
    errorMessage?: string,
  ) {
    return await this.prisma.extractedReceipt.update({
      where: { id: extractionId },
      data: {
        status,
        ...(errorMessage && { errorMessage }),
      },
    });
  }

  /**
   * Update extraction with results
   */
  private async updateExtractionResults(params: {
    extractionId: string;
    extractedData: OpenAIExtractionResponse;
    categorization?: CategorizationResponse;
    status: ReceiptExtractionStatus;
    processingTimeMs: number;
  }) {
    const updated = await this.prisma.extractedReceipt.update({
      where: { id: params.extractionId },
      data: {
        status: params.status,
        extractedData: params.extractedData as any,
        overallConfidence: params.extractedData.overallConfidence,
        fieldConfidences: params.extractedData.fieldConfidences as any,
        receiptType: params.extractedData.receiptType,
        suggestedCategory: params.categorization?.category,
        suggestedSubcategory: params.categorization?.subcategory,
        categorizationConfidence: params.categorization?.confidence,
        taxDeductible: params.categorization?.taxDeductible,
        processingTimeMs: params.processingTimeMs,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Queue expense creation
   */
  private async queueExpenseCreation(
    extractionId: string,
    organisationId: string,
    userId: string,
  ) {
    try {
      await this.extractionQueue.add('create-expense', {
        extractionId,
        organisationId,
        userId,
      });
      this.logger.debug(`Queued expense creation for extraction ${extractionId}`);
    } catch (error) {
      this.logger.warn('Failed to queue expense creation:', error.message);
    }
  }

  /**
   * Map database record to DTO
   */
  private mapToDto(extraction: any): ReceiptExtractionResultDto {
    return {
      id: extraction.id,
      organisationId: extraction.organisationId,
      userId: extraction.userId,
      fileName: extraction.fileName,
      mimeType: extraction.mimeType,
      status: extraction.status,
      extractedData: extraction.extractedData as ExtractedReceiptDataDto,
      overallConfidence: extraction.overallConfidence,
      fieldConfidences: extraction.fieldConfidences as FieldConfidenceDto[],
      suggestedCategory: extraction.suggestedCategory,
      suggestedSubcategory: extraction.suggestedSubcategory,
      categorizationConfidence: extraction.categorizationConfidence,
      taxDeductible: extraction.taxDeductible,
      processingTimeMs: extraction.processingTimeMs,
      errorMessage: extraction.errorMessage,
      createdAt: extraction.createdAt,
      updatedAt: extraction.updatedAt,
    };
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'application/pdf': 'pdf',
    };
    return map[mimeType] || 'bin';
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
