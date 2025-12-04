/**
 * Classification Service
 * AI-powered document classification and data extraction
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeClient } from '@operate/ai';
import { DocumentType } from '@prisma/client';

export interface ClassificationResult {
  type: DocumentType;
  confidence: number;
  extractedData: Record<string, any>;
  rawResponse?: string;
}

export interface ClassificationOptions {
  useVision?: boolean;
  model?: string;
  temperature?: number;
}

/**
 * Classification Service
 * Handles AI-powered document type classification and field extraction
 */
@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private claudeClient: ClaudeClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured - classification will fail');
    }

    this.claudeClient = new ClaudeClient({
      apiKey: apiKey || '',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 2048,
      temperature: 0.1, // Low temperature for consistent classification
    });
  }

  /**
   * Classify a document and extract key fields
   * Supports both text and vision-based classification
   */
  async classifyDocument(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    options?: ClassificationOptions,
  ): Promise<ClassificationResult> {
    this.logger.log(`Classifying document: ${fileName} (${mimeType})`);

    try {
      // Determine if we should use vision API
      const useVision = options?.useVision ?? this.shouldUseVision(mimeType);

      if (useVision) {
        return await this.classifyWithVision(fileBuffer, mimeType, fileName, options);
      } else {
        return await this.classifyWithText(fileBuffer, fileName, options);
      }
    } catch (error) {
      this.logger.error(`Classification failed for ${fileName}:`, error);

      // Fallback to basic classification
      return this.fallbackClassification(fileName, mimeType);
    }
  }

  /**
   * Classify document using Claude's vision capabilities (for images and PDFs)
   */
  private async classifyWithVision(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    options?: ClassificationOptions,
  ): Promise<ClassificationResult> {
    const base64Data = fileBuffer.toString('base64');

    const systemPrompt = this.buildClassificationSystemPrompt();
    const userPrompt = this.buildVisionPrompt(fileName);

    const response = await this.claudeClient.sendMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: this.normalizeMediaType(mimeType),
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      {
        system: systemPrompt,
        model: options?.model || 'claude-3-5-sonnet-20241022',
        maxTokens: 2048,
        temperature: options?.temperature ?? 0.1,
      },
    );

    return this.parseClassificationResponse(response, fileName);
  }

  /**
   * Classify document using text extraction (for text-based PDFs or plain text)
   */
  private async classifyWithText(
    fileBuffer: Buffer,
    fileName: string,
    options?: ClassificationOptions,
  ): Promise<ClassificationResult> {
    // For text-based documents, we'd normally extract text first
    // For now, we'll use filename-based classification with AI enhancement
    const textContent = fileBuffer.toString('utf-8', 0, 2000); // First 2KB

    const systemPrompt = this.buildClassificationSystemPrompt();
    const userPrompt = `Classify this document based on its filename and content preview:

**Filename:** ${fileName}

**Content Preview:**
${textContent}

${this.buildClassificationInstructions()}`;

    const responseText = await this.claudeClient.prompt(userPrompt, {
      system: systemPrompt,
      model: options?.model || 'claude-3-5-sonnet-20241022',
      maxTokens: 2048,
      temperature: options?.temperature ?? 0.1,
    });

    return this.parseTextClassificationResponse(responseText, fileName);
  }

  /**
   * Build system prompt for classification
   */
  private buildClassificationSystemPrompt(): string {
    return `You are a document classification expert. Your task is to analyze documents and:
1. Classify the document type accurately
2. Extract key fields relevant to that document type
3. Provide a confidence score (0.0 to 1.0)

You must respond ONLY with valid JSON in this exact format:
{
  "type": "DOCUMENT_TYPE",
  "confidence": 0.95,
  "extractedData": {
    "field1": "value1",
    "field2": "value2"
  }
}

Available document types:
- CONTRACT: Employment contracts, service agreements, NDAs
- INVOICE: Sales invoices, purchase invoices, proforma invoices
- RECEIPT: Purchase receipts, payment receipts, expense receipts
- REPORT: Financial reports, business reports, analytics
- POLICY: Company policies, insurance policies, procedures
- FORM: Tax forms, application forms, registration forms
- CERTIFICATE: Business certificates, licenses, certifications
- OTHER: Any other document type

Be conservative with confidence scores. Use < 0.8 if uncertain.`;
  }

  /**
   * Build vision-specific prompt
   */
  private buildVisionPrompt(fileName: string): string {
    return `Analyze this document image and classify it.

**Filename:** ${fileName}

${this.buildClassificationInstructions()}

Extract relevant fields based on the document type:
- INVOICE: invoiceNumber, date, totalAmount, currency, vendor, customerName
- RECEIPT: receiptNumber, date, totalAmount, currency, merchant, paymentMethod
- CONTRACT: contractType, parties, startDate, endDate, value
- FORM: formType, formNumber, date, applicantName
- CERTIFICATE: certificateType, issuer, recipient, issueDate, expiryDate
- REPORT: reportType, period, author, date

Respond with JSON only.`;
  }

  /**
   * Build classification instructions
   */
  private buildClassificationInstructions(): string {
    return `Classify the document type and provide:
1. type: One of CONTRACT, INVOICE, RECEIPT, REPORT, POLICY, FORM, CERTIFICATE, OTHER
2. confidence: Float between 0.0 and 1.0 (be conservative, use < 0.8 if uncertain)
3. extractedData: Object with relevant fields extracted from the document

Respond with valid JSON only.`;
  }

  /**
   * Parse Claude's classification response
   */
  private parseClassificationResponse(
    response: any,
    fileName: string,
  ): ClassificationResult {
    try {
      const content = response.content?.[0]?.text || '';
      return this.parseTextClassificationResponse(content, fileName);
    } catch (error) {
      this.logger.error(`Failed to parse classification response:`, error);
      return this.fallbackClassification(fileName, '');
    }
  }

  /**
   * Parse text classification response
   */
  private parseTextClassificationResponse(
    text: string,
    fileName: string,
  ): ClassificationResult {
    try {
      // Extract JSON from response (handle code blocks)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                       text.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, text];

      const jsonText = jsonMatch[1] || text;
      const parsed = JSON.parse(jsonText.trim());

      // Validate response structure
      if (!parsed.type || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }

      // Validate document type
      const validTypes = ['CONTRACT', 'INVOICE', 'RECEIPT', 'REPORT', 'POLICY', 'FORM', 'CERTIFICATE', 'OTHER'];
      if (!validTypes.includes(parsed.type)) {
        this.logger.warn(`Invalid type ${parsed.type}, defaulting to OTHER`);
        parsed.type = 'OTHER';
      }

      return {
        type: parsed.type as DocumentType,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        extractedData: parsed.extractedData || {},
        rawResponse: text,
      };
    } catch (error) {
      this.logger.error(`Failed to parse classification text:`, error);
      return this.fallbackClassification(fileName, '');
    }
  }

  /**
   * Fallback classification based on filename and mime type
   */
  private fallbackClassification(
    fileName: string,
    mimeType: string,
  ): ClassificationResult {
    const lowerFileName = fileName.toLowerCase();

    // Simple keyword-based classification
    if (lowerFileName.includes('invoice') || lowerFileName.includes('rechnung')) {
      return {
        type: DocumentType.INVOICE,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('receipt') || lowerFileName.includes('beleg')) {
      return {
        type: DocumentType.RECEIPT,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('contract') || lowerFileName.includes('vertrag')) {
      return {
        type: DocumentType.CONTRACT,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('report') || lowerFileName.includes('bericht')) {
      return {
        type: DocumentType.REPORT,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('form') || lowerFileName.includes('formular')) {
      return {
        type: DocumentType.FORM,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('certificate') || lowerFileName.includes('zertifikat')) {
      return {
        type: DocumentType.CERTIFICATE,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    if (lowerFileName.includes('policy') || lowerFileName.includes('richtlinie')) {
      return {
        type: DocumentType.POLICY,
        confidence: 0.6,
        extractedData: { source: 'fallback', method: 'filename' },
      };
    }

    // Default to OTHER with low confidence
    return {
      type: DocumentType.OTHER,
      confidence: 0.3,
      extractedData: { source: 'fallback', method: 'default' },
    };
  }

  /**
   * Determine if we should use vision API based on mime type
   */
  private shouldUseVision(mimeType: string): boolean {
    const visionTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    return visionTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Normalize media type for Claude API
   */
  private normalizeMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    const normalized = mimeType.toLowerCase();

    if (normalized === 'image/jpg') return 'image/jpeg';
    if (normalized === 'image/jpeg') return 'image/jpeg';
    if (normalized === 'image/png') return 'image/png';
    if (normalized === 'image/gif') return 'image/gif';
    if (normalized === 'image/webp') return 'image/webp';

    // Default to jpeg for unknown types
    return 'image/jpeg';
  }

  /**
   * Validate classification confidence threshold
   */
  isHighConfidence(confidence: number, threshold: number = 0.8): boolean {
    return confidence >= threshold;
  }
}
