/**
 * Invoice Extractor Service
 * AI-powered invoice data extraction using GPT-4 Vision
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import OpenAI from 'openai';
import * as pdfParse from 'pdf-parse';
import * as sharp from 'sharp';
import {
  ExtractedInvoiceDataDto,
  InvoiceExtractionResultDto,
  InvoiceExtractionStatus,
  FieldConfidenceDto,
  InvoiceLineItemDto,
} from './dto/invoice-extraction.dto';
import {
  buildInvoiceExtractionPrompt,
  MULTI_PAGE_MERGE_PROMPT,
  INVOICE_VALIDATION_PROMPT,
} from './prompts/invoice-prompt';

interface ExtractionOptions {
  maxRetries?: number;
  timeout?: number;
  enableFallback?: boolean;
}

interface GPTExtractionResponse extends ExtractedInvoiceDataDto {
  confidence: {
    vendorName: number;
    invoiceNumber: number;
    invoiceDate: number;
    total: number;
    lineItems: number;
    overall: number;
    [key: string]: number;
  };
}

@Injectable()
export class InvoiceExtractorService {
  private readonly logger = new Logger(InvoiceExtractorService.name);
  private readonly openai: OpenAI;
  private readonly supportedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - invoice extraction will fail');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Extract invoice data from a file (PDF or image)
   */
  async extractInvoice(params: {
    organisationId: string;
    file: Buffer;
    mimeType: string;
    fileName?: string;
    userId?: string;
    options?: ExtractionOptions;
  }): Promise<InvoiceExtractionResultDto> {
    const { organisationId, file, mimeType, fileName, userId, options } = params;
    const startTime = Date.now();

    this.logger.log(
      `Starting invoice extraction for org ${organisationId}, file ${fileName}, type ${mimeType}`,
    );

    // Validate mime type
    if (!this.supportedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Supported types: ${this.supportedMimeTypes.join(', ')}`,
      );
    }

    // Create extraction record
    const extraction = await this.createExtractionRecord({
      organisationId,
      fileName,
      mimeType,
      userId,
    });

    try {
      // Update status to processing
      await this.updateExtractionStatus(extraction.id, InvoiceExtractionStatus.PROCESSING);

      // Extract based on file type
      let extractedData: GPTExtractionResponse;
      let pageCount = 1;

      if (mimeType === 'application/pdf') {
        const result = await this.extractFromPdf(file, options);
        extractedData = result.data;
        pageCount = result.pageCount;
      } else {
        extractedData = await this.extractFromImage(file, options);
      }

      // Validate extracted data
      const validation = await this.validateExtractedData(extractedData);
      if (!validation.isValid && validation.correctedData) {
        this.logger.warn(
          `Validation errors: ${validation.errors.join(', ')}. Applying corrections.`,
        );
        extractedData = { ...extractedData, ...validation.correctedData };
      }

      // Calculate field confidences
      const fieldConfidences = this.calculateFieldConfidences(extractedData);
      const overallConfidence = extractedData.confidence.overall;

      // Prepare result
      const processingTime = Date.now() - startTime;
      const result: InvoiceExtractionResultDto = {
        id: extraction.id,
        organisationId,
        status: InvoiceExtractionStatus.COMPLETED,
        data: this.cleanExtractedData(extractedData),
        overallConfidence,
        fieldConfidences,
        pageCount,
        processingTime,
        createdAt: extraction.createdAt,
        updatedAt: new Date(),
      };

      // Save to database
      await this.saveExtractionResult(extraction.id, result, extractedData);

      this.logger.log(
        `Invoice extraction completed for ${extraction.id} in ${processingTime}ms with confidence ${overallConfidence.toFixed(2)}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Invoice extraction failed for ${extraction.id}:`, error);

      // Update with error
      await this.updateExtractionStatus(
        extraction.id,
        InvoiceExtractionStatus.FAILED,
        error.message,
      );

      throw new BadRequestException(`Invoice extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract invoice data from PDF
   */
  private async extractFromPdf(
    file: Buffer,
    options?: ExtractionOptions,
  ): Promise<{ data: GPTExtractionResponse; pageCount: number }> {
    this.logger.debug('Extracting from PDF');

    try {
      // Parse PDF to get page count and text
      const pdfData = await pdfParse(file);
      const pageCount = pdfData.numpages;

      this.logger.debug(`PDF has ${pageCount} pages`);

      // For single page PDFs, convert to image and process
      if (pageCount === 1) {
        const imageBuffer = await this.convertPdfPageToImage(file, 1);
        const data = await this.extractFromImage(imageBuffer, options);
        return { data, pageCount: 1 };
      }

      // For multi-page PDFs, process each page and merge
      const pageExtractions: GPTExtractionResponse[] = [];

      for (let page = 1; page <= Math.min(pageCount, 10); page++) {
        // Limit to 10 pages
        this.logger.debug(`Processing page ${page}/${pageCount}`);

        const imageBuffer = await this.convertPdfPageToImage(file, page);
        const prompt = buildInvoiceExtractionPrompt({
          pageNumber: page,
          totalPages: pageCount,
        });

        const pageData = await this.callGPT4Vision(imageBuffer, prompt, options);
        pageExtractions.push(pageData);
      }

      // Merge multi-page data
      const mergedData = await this.mergeMultiPageExtractions(pageExtractions);

      return { data: mergedData, pageCount };
    } catch (error) {
      this.logger.error('PDF extraction failed:', error);

      // Fallback: try text extraction
      if (options?.enableFallback) {
        this.logger.debug('Attempting fallback text extraction');
        return this.extractFromPdfText(file);
      }

      throw error;
    }
  }

  /**
   * Extract invoice data from image
   */
  private async extractFromImage(
    file: Buffer,
    options?: ExtractionOptions,
  ): Promise<GPTExtractionResponse> {
    this.logger.debug('Extracting from image');

    // Optimize image for GPT-4 Vision
    const optimizedImage = await this.optimizeImage(file);

    // Build prompt
    const prompt = buildInvoiceExtractionPrompt({});

    // Call GPT-4 Vision
    const data = await this.callGPT4Vision(optimizedImage, prompt, options);

    return data;
  }

  /**
   * Call GPT-4 Vision API with invoice image
   */
  private async callGPT4Vision(
    imageBuffer: Buffer,
    prompt: { system: string; user: string },
    options?: ExtractionOptions,
  ): Promise<GPTExtractionResponse> {
    const maxRetries = options?.maxRetries || 3;
    const timeout = options?.timeout || 30000;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`GPT-4 Vision attempt ${attempt}/${maxRetries}`);

        // Convert image to base64
        const base64Image = imageBuffer.toString('base64');
        const mimeType = await this.detectImageMimeType(imageBuffer);
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        // Call OpenAI API
        const response = await Promise.race([
          this.openai.chat.completions.create({
            model: 'gpt-4o', // GPT-4 Vision model
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
                      url: dataUri,
                      detail: 'high',
                    },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Low temperature for consistency
            max_tokens: 4096,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GPT-4 Vision timeout')), timeout),
          ),
        ]) as OpenAI.Chat.Completions.ChatCompletion;

        // Parse response
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from GPT-4 Vision');
        }

        const extractedData = JSON.parse(content) as GPTExtractionResponse;

        // Validate response structure
        this.validateExtractionResponse(extractedData);

        this.logger.debug(
          `GPT-4 Vision successful, confidence: ${extractedData.confidence.overall.toFixed(2)}`,
        );

        return extractedData;
      } catch (error) {
        lastError = error;
        this.logger.warn(`GPT-4 Vision attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw new Error(`GPT-4 Vision failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Convert PDF page to image using sharp
   */
  private async convertPdfPageToImage(pdfBuffer: Buffer, pageNumber: number): Promise<Buffer> {
    // Note: This is a simplified implementation
    // For production, use a library like pdf-to-image or pdf2pic
    this.logger.debug(`Converting PDF page ${pageNumber} to image`);

    // For now, throw an error directing to use a proper PDF conversion library
    throw new Error(
      'PDF to image conversion requires additional dependencies. Please install pdf-to-image or pdf2pic.',
    );

    // Example implementation with pdf2pic (requires installation):
    // const { fromBuffer } = require('pdf2pic');
    // const converter = fromBuffer(pdfBuffer, {
    //   density: 300,
    //   format: 'png',
    //   width: 2000,
    //   height: 2000,
    // });
    // const result = await converter(pageNumber, { responseType: 'buffer' });
    // return result.buffer;
  }

  /**
   * Optimize image for GPT-4 Vision (resize, compress)
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.debug('Optimizing image');

    try {
      // Resize to max 2000px width while maintaining aspect ratio
      // GPT-4 Vision works best with high-quality but reasonable-sized images
      const optimized = await sharp(imageBuffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();

      this.logger.debug(
        `Image optimized: ${imageBuffer.length} -> ${optimized.length} bytes`,
      );

      return optimized;
    } catch (error) {
      this.logger.warn(`Image optimization failed: ${error.message}, using original`);
      return imageBuffer;
    }
  }

  /**
   * Detect image MIME type from buffer
   */
  private async detectImageMimeType(buffer: Buffer): Promise<string> {
    try {
      const metadata = await sharp(buffer).metadata();
      const format = metadata.format;

      const mimeMap: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      return mimeMap[format || 'png'] || 'image/png';
    } catch {
      return 'image/png';
    }
  }

  /**
   * Extract from PDF using text extraction (fallback)
   */
  private async extractFromPdfText(
    pdfBuffer: Buffer,
  ): Promise<{ data: GPTExtractionResponse; pageCount: number }> {
    this.logger.debug('Using fallback text extraction');

    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Use GPT-4 (text) to extract from text content
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: buildInvoiceExtractionPrompt({}).system,
        },
        {
          role: 'user',
          content: `Extract invoice data from this text content:\n\n${text.substring(0, 15000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from GPT-4');
    }

    const data = JSON.parse(content) as GPTExtractionResponse;
    return { data, pageCount: pdfData.numpages };
  }

  /**
   * Merge extractions from multiple pages
   */
  private async mergeMultiPageExtractions(
    extractions: GPTExtractionResponse[],
  ): Promise<GPTExtractionResponse> {
    this.logger.debug(`Merging ${extractions.length} page extractions`);

    if (extractions.length === 1) {
      return extractions[0];
    }

    // Use GPT-4 to intelligently merge
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: MULTI_PAGE_MERGE_PROMPT,
        },
        {
          role: 'user',
          content: `Merge these page extractions:\n\n${JSON.stringify(extractions, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty merge response');
    }

    return JSON.parse(content) as GPTExtractionResponse;
  }

  /**
   * Validate extracted data for logical consistency
   */
  private async validateExtractedData(data: GPTExtractionResponse): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    correctedData: Partial<GPTExtractionResponse> | null;
  }> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: INVOICE_VALIDATION_PROMPT,
        },
        {
          role: 'user',
          content: `Validate this invoice data:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { isValid: true, errors: [], warnings: [], correctedData: null };
    }

    return JSON.parse(content);
  }

  /**
   * Validate extraction response structure
   */
  private validateExtractionResponse(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid extraction response: not an object');
    }

    if (!data.lineItems || !Array.isArray(data.lineItems)) {
      throw new Error('Invalid extraction response: missing lineItems array');
    }

    if (typeof data.total !== 'number') {
      throw new Error('Invalid extraction response: missing or invalid total');
    }

    if (!data.currency || typeof data.currency !== 'string') {
      throw new Error('Invalid extraction response: missing or invalid currency');
    }

    if (!data.confidence || typeof data.confidence !== 'object') {
      throw new Error('Invalid extraction response: missing confidence scores');
    }
  }

  /**
   * Calculate field-level confidence scores
   */
  private calculateFieldConfidences(data: GPTExtractionResponse): FieldConfidenceDto[] {
    const confidences: FieldConfidenceDto[] = [];
    const confidenceMap = data.confidence;

    const fields = [
      'vendorName',
      'vendorAddress',
      'vendorVatId',
      'invoiceNumber',
      'invoiceDate',
      'dueDate',
      'subtotal',
      'taxAmount',
      'total',
      'lineItems',
    ];

    for (const field of fields) {
      confidences.push({
        field,
        confidence: confidenceMap[field] || confidenceMap.overall,
        extracted: data[field] !== null && data[field] !== undefined,
      });
    }

    return confidences;
  }

  /**
   * Clean extracted data (remove confidence object)
   */
  private cleanExtractedData(data: GPTExtractionResponse): ExtractedInvoiceDataDto {
    const { confidence, ...cleanData } = data;
    return cleanData as ExtractedInvoiceDataDto;
  }

  /**
   * Get extraction by ID
   */
  async getExtraction(extractionId: string): Promise<InvoiceExtractionResultDto | null> {
    const extraction = await this.prisma.extractedInvoice.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) {
      return null;
    }

    return this.mapPrismaToDto(extraction);
  }

  /**
   * Get extractions for organization
   */
  async getExtractions(
    organisationId: string,
    filters?: { status?: InvoiceExtractionStatus; limit?: number; offset?: number },
  ): Promise<InvoiceExtractionResultDto[]> {
    const extractions = await this.prisma.extractedInvoice.findMany({
      where: {
        organisationId,
        ...(filters?.status && { status: filters.status }),
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return extractions.map((e) => this.mapPrismaToDto(e));
  }

  // ============================================================================
  // PRIVATE DATABASE METHODS
  // ============================================================================

  private async createExtractionRecord(params: {
    organisationId: string;
    fileName?: string;
    mimeType: string;
    userId?: string;
  }): Promise<{ id: string; createdAt: Date }> {
    const extraction = await this.prisma.extractedInvoice.create({
      data: {
        organisationId: params.organisationId,
        status: InvoiceExtractionStatus.PENDING,
        fileName: params.fileName,
        mimeType: params.mimeType,
        userId: params.userId,
        extractedData: {},
        overallConfidence: 0,
        fieldConfidences: [],
      },
    });

    return { id: extraction.id, createdAt: extraction.createdAt };
  }

  private async updateExtractionStatus(
    id: string,
    status: InvoiceExtractionStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.extractedInvoice.update({
      where: { id },
      data: {
        status,
        ...(errorMessage && { errorMessage }),
      },
    });
  }

  private async saveExtractionResult(
    id: string,
    result: InvoiceExtractionResultDto,
    rawData: GPTExtractionResponse,
  ): Promise<void> {
    await this.prisma.extractedInvoice.update({
      where: { id },
      data: {
        status: result.status,
        extractedData: result.data as any,
        overallConfidence: result.overallConfidence,
        fieldConfidences: result.fieldConfidences as any,
        pageCount: result.pageCount,
        processingTime: result.processingTime,
        rawResponse: rawData as any,
      },
    });
  }

  private mapPrismaToDto(extraction: any): InvoiceExtractionResultDto {
    return {
      id: extraction.id,
      organisationId: extraction.organisationId,
      status: extraction.status,
      data: extraction.extractedData as ExtractedInvoiceDataDto,
      overallConfidence: extraction.overallConfidence,
      fieldConfidences: extraction.fieldConfidences as FieldConfidenceDto[],
      pageCount: extraction.pageCount,
      processingTime: extraction.processingTime,
      errorMessage: extraction.errorMessage,
      createdAt: extraction.createdAt,
      updatedAt: extraction.updatedAt,
    };
  }
}
