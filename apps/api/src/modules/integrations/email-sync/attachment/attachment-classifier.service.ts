import { Injectable, Logger } from '@nestjs/common';
import { AttachmentClassificationType } from '@prisma/client';

/**
 * Attachment Classifier Service
 * Uses AI/ML and heuristics to classify attachment types
 *
 * Features:
 * - Filename-based classification
 * - MIME type analysis
 * - Content-based classification (OCR/text extraction)
 * - Confidence scoring
 *
 * Classification Types:
 * - INVOICE: Invoice documents
 * - RECEIPT: Receipt/proof of payment
 * - STATEMENT: Bank/financial statements
 * - CONTRACT: Contracts/agreements
 * - QUOTE: Quotes/estimates
 * - DELIVERY_NOTE: Delivery notes/packing slips
 * - PAYMENT_PROOF: Payment confirmations
 * - TAX_DOCUMENT: Tax-related documents
 * - OTHER: Other financial documents
 * - NON_FINANCIAL: Not a financial document
 *
 * TODO: Integrate with AI service (Claude/OpenAI) for advanced classification
 */
@Injectable()
export class AttachmentClassifierService {
  private readonly logger = new Logger(AttachmentClassifierService.name);

  // Keywords for classification
  private readonly classificationKeywords = {
    [AttachmentClassificationType.INVOICE]: [
      'invoice',
      'rechnung',
      'facture',
      'factura',
      'fattura',
      'nota fiscal',
      'bill',
    ],
    [AttachmentClassificationType.RECEIPT]: [
      'receipt',
      'beleg',
      'quittung',
      'recu',
      'recibo',
      'ricevuta',
    ],
    [AttachmentClassificationType.STATEMENT]: [
      'statement',
      'kontoauszug',
      'releve',
      'extracto',
      'estratto',
      'bank statement',
    ],
    [AttachmentClassificationType.CONTRACT]: [
      'contract',
      'vertrag',
      'contrat',
      'contrato',
      'contratto',
      'agreement',
    ],
    [AttachmentClassificationType.QUOTE]: [
      'quote',
      'estimate',
      'angebot',
      'kostenvoranschlag',
      'devis',
      'presupuesto',
      'preventivo',
    ],
    [AttachmentClassificationType.DELIVERY_NOTE]: [
      'delivery note',
      'lieferschein',
      'bon de livraison',
      'albaran',
      'bolla',
      'packing slip',
    ],
    [AttachmentClassificationType.PAYMENT_PROOF]: [
      'payment',
      'zahlung',
      'paiement',
      'pago',
      'pagamento',
      'confirmation',
      'paid',
    ],
    [AttachmentClassificationType.TAX_DOCUMENT]: [
      'tax',
      'steuer',
      'impot',
      'impuesto',
      'tassa',
      'vat',
      'mwst',
      'ust',
      'tva',
      'iva',
    ],
  };

  // Financial MIME types
  private readonly financialMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-excel', // XLS
    'text/csv',
  ];

  /**
   * Classify an attachment based on filename and MIME type
   * Returns classification type and confidence score (0-1)
   *
   * @param filename - Original filename
   * @param mimeType - MIME type
   * @param emailSubject - Email subject (optional, provides context)
   * @returns Classification result
   */
  async classifyAttachment(
    filename: string,
    mimeType: string,
    emailSubject?: string,
  ): Promise<{
    classifiedType: AttachmentClassificationType;
    confidence: number;
  }> {
    this.logger.debug(
      `Classifying attachment: ${filename} (${mimeType})`,
    );

    // Check if it's a financial document type
    if (!this.isFinancialMimeType(mimeType)) {
      return {
        classifiedType: AttachmentClassificationType.NON_FINANCIAL,
        confidence: 0.9,
      };
    }

    // Combine filename and email subject for better context
    const context = [filename, emailSubject || '']
      .join(' ')
      .toLowerCase();

    // Try to classify based on keywords
    const classification = this.classifyByKeywords(context);

    if (classification) {
      return classification;
    }

    // Default to OTHER if we can't confidently classify
    return {
      classifiedType: AttachmentClassificationType.OTHER,
      confidence: 0.5,
    };
  }

  /**
   * Classify based on keywords in filename/subject
   */
  private classifyByKeywords(text: string): {
    classifiedType: AttachmentClassificationType;
    confidence: number;
  } | null {
    const scores: Partial<Record<AttachmentClassificationType, number>> = {};

    // Score each classification type based on keyword matches
    for (const [type, keywords] of Object.entries(
      this.classificationKeywords,
    )) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        scores[type as AttachmentClassificationType] = score;
      }
    }

    // Find the highest scoring classification
    if (Object.keys(scores).length === 0) {
      return null;
    }

    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    const [topType, topScore] = entries[0];
    const totalMatches = entries.reduce((sum, [, score]) => sum + score, 0);

    // Calculate confidence based on how much stronger the top match is
    const confidence = Math.min(topScore / (totalMatches || 1), 0.95);

    return {
      classifiedType: topType as AttachmentClassificationType,
      confidence,
    };
  }

  /**
   * Check if MIME type is likely a financial document
   */
  private isFinancialMimeType(mimeType: string): boolean {
    return this.financialMimeTypes.includes(mimeType);
  }

  /**
   * Advanced classification using AI (placeholder)
   * TODO: Integrate with Claude/OpenAI for content-based classification
   *
   * This would involve:
   * 1. Extracting text from PDF/images using OCR
   * 2. Sending text to AI for classification
   * 3. Parsing AI response for classification and confidence
   *
   * @param content - File content as Buffer
   * @param filename - Original filename
   * @param mimeType - MIME type
   */
  async classifyWithAI(
    content: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{
    classifiedType: AttachmentClassificationType;
    confidence: number;
  }> {
    this.logger.warn(
      'AI-based classification not yet implemented, falling back to heuristics',
    );

    // For now, fall back to keyword-based classification
    return this.classifyAttachment(filename, mimeType);
  }

  /**
   * Batch classify multiple attachments
   *
   * @param attachments - Array of attachments to classify
   * @returns Array of classification results
   */
  async batchClassify(
    attachments: Array<{
      filename: string;
      mimeType: string;
      emailSubject?: string;
    }>,
  ): Promise<
    Array<{
      filename: string;
      classifiedType: AttachmentClassificationType;
      confidence: number;
    }>
  > {
    const results = await Promise.all(
      attachments.map(async (attachment) => {
        const classification = await this.classifyAttachment(
          attachment.filename,
          attachment.mimeType,
          attachment.emailSubject,
        );

        return {
          filename: attachment.filename,
          ...classification,
        };
      }),
    );

    return results;
  }

  /**
   * Re-classify an attachment with updated context
   * Useful when email subject or other metadata becomes available
   *
   * @param currentClassification - Current classification
   * @param newContext - Additional context for re-classification
   * @returns Updated classification if confidence improved
   */
  async reclassify(
    currentClassification: {
      type: AttachmentClassificationType;
      confidence: number;
      filename: string;
      mimeType: string;
    },
    newContext: {
      emailSubject?: string;
      emailBody?: string;
      senderDomain?: string;
    },
  ): Promise<{
    classifiedType: AttachmentClassificationType;
    confidence: number;
    improved: boolean;
  }> {
    const combinedContext = [
      currentClassification.filename,
      newContext.emailSubject || '',
      newContext.emailBody || '',
      newContext.senderDomain || '',
    ]
      .join(' ')
      .toLowerCase();

    const newClassification = this.classifyByKeywords(combinedContext);

    if (!newClassification) {
      return {
        classifiedType: currentClassification.type,
        confidence: currentClassification.confidence,
        improved: false,
      };
    }

    // Only update if confidence improved significantly
    const improved =
      newClassification.confidence > currentClassification.confidence + 0.1;

    return {
      classifiedType: improved
        ? newClassification.classifiedType
        : currentClassification.type,
      confidence: improved
        ? newClassification.confidence
        : currentClassification.confidence,
      improved,
    };
  }

  /**
   * Get classification confidence threshold for routing to extractors
   * Documents with confidence above this threshold are sent to extractors
   */
  getConfidenceThreshold(
    type: AttachmentClassificationType,
  ): number {
    const thresholds: Partial<
      Record<AttachmentClassificationType, number>
    > = {
      [AttachmentClassificationType.INVOICE]: 0.6,
      [AttachmentClassificationType.RECEIPT]: 0.6,
      [AttachmentClassificationType.STATEMENT]: 0.7,
      [AttachmentClassificationType.CONTRACT]: 0.8,
      [AttachmentClassificationType.QUOTE]: 0.7,
      [AttachmentClassificationType.DELIVERY_NOTE]: 0.7,
      [AttachmentClassificationType.PAYMENT_PROOF]: 0.6,
      [AttachmentClassificationType.TAX_DOCUMENT]: 0.7,
      [AttachmentClassificationType.OTHER]: 0.5,
      [AttachmentClassificationType.NON_FINANCIAL]: 0.9,
    };

    return thresholds[type] || 0.7;
  }

  /**
   * Check if attachment should be sent to extractor based on classification
   *
   * @param classifiedType - Classification type
   * @param confidence - Classification confidence
   * @returns True if should extract
   */
  shouldExtract(
    classifiedType: AttachmentClassificationType,
    confidence: number,
  ): boolean {
    // Never extract non-financial documents
    if (classifiedType === AttachmentClassificationType.NON_FINANCIAL) {
      return false;
    }

    // Check confidence threshold
    const threshold = this.getConfidenceThreshold(classifiedType);
    return confidence >= threshold;
  }

  /**
   * Get extractor route for classified attachment
   * Returns the queue/service to route to for extraction
   *
   * @param classifiedType - Classification type
   * @returns Extractor route
   */
  getExtractorRoute(
    classifiedType: AttachmentClassificationType,
  ): 'invoice-extractor' | 'receipt-extractor' | null {
    const routes: Partial<
      Record<
        AttachmentClassificationType,
        'invoice-extractor' | 'receipt-extractor'
      >
    > = {
      [AttachmentClassificationType.INVOICE]: 'invoice-extractor',
      [AttachmentClassificationType.RECEIPT]: 'receipt-extractor',
      [AttachmentClassificationType.STATEMENT]: 'invoice-extractor', // Can extract structured data
      [AttachmentClassificationType.QUOTE]: 'invoice-extractor',
      [AttachmentClassificationType.DELIVERY_NOTE]: 'invoice-extractor',
    };

    return routes[classifiedType] || null;
  }

  /**
   * Get statistics about classification accuracy
   * (This would be used with feedback loop for improving classification)
   */
  async getClassificationStats(): Promise<{
    totalClassifications: number;
    averageConfidence: number;
    typeBreakdown: Record<string, number>;
  }> {
    // TODO: Implement with actual statistics from database
    this.logger.warn('Classification statistics not yet implemented');

    return {
      totalClassifications: 0,
      averageConfidence: 0,
      typeBreakdown: {},
    };
  }
}
