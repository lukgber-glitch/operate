/**
 * Entity Extractor Service
 * AI-powered entity extraction from email content
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ClaudeClient } from '@operate/ai';
import {
  ExtractedEntities,
  ExtractedCompany,
  ExtractedContact,
  ExtractedAmount,
  ExtractedDate,
  ExtractedAddress,
  EmailInput,
  EmailSignature,
  AIEntityExtractionResponse,
  CompanyRole,
} from './types/extracted-entities.types';
import {
  buildEntityExtractionPrompt,
  SIGNATURE_EXTRACTION_PROMPT,
} from './prompts/extraction-prompt';
import {
  extractSignatureBlock,
  parseSignature,
  normalizePhoneNumber,
  validateEmail,
  validatePhone,
  normalizeCompanyName,
  extractDomain,
} from './parsers/signature-parser';

interface ExtractionOptions {
  maxRetries?: number;
  timeout?: number;
  useSignatureParser?: boolean;
}

@Injectable()
export class EntityExtractorService {
  private readonly logger = new Logger(EntityExtractorService.name);
  private readonly claude: ClaudeClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured - entity extraction will fail');
    }
    this.claude = new ClaudeClient({
      apiKey: apiKey || 'dummy',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });
  }

  /**
   * Extract entities from a single email
   */
  async extractEntities(
    email: EmailInput,
    options?: ExtractionOptions,
  ): Promise<ExtractedEntities> {
    const startTime = Date.now();

    this.logger.log(`Extracting entities from email: ${email.subject.substring(0, 50)}...`);

    try {
      // Use regex signature parser first if enabled
      let signatureData: Partial<EmailSignature> | null = null;
      if (options?.useSignatureParser !== false) {
        signatureData = await this.extractFromSignature(email.body);
      }

      // Call AI for full entity extraction
      const aiResponse = await this.callAIExtraction(email, options);

      // Merge AI results with signature parsing
      const entities = this.buildExtractedEntities(aiResponse, signatureData, email);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Entity extraction completed in ${processingTime}ms. Found: ${entities.companies.length} companies, ${entities.contacts.length} contacts, ${entities.amounts.length} amounts`,
      );

      return entities;
    } catch (error) {
      this.logger.error('Entity extraction failed:', error);
      throw new Error(`Entity extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract entities from multiple emails (batch processing)
   */
  async extractBatch(
    emails: EmailInput[],
    options?: ExtractionOptions,
  ): Promise<ExtractedEntities[]> {
    this.logger.log(`Batch extracting entities from ${emails.length} emails`);

    const results: ExtractedEntities[] = [];

    // Process in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map((email) =>
          this.extractEntities(email, options).catch((error) => {
            this.logger.error(
              `Failed to extract entities from email "${email.subject}": ${error.message}`,
            );
            // Return empty entities on error
            return this.emptyEntities(email);
          }),
        ),
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Extract contact info from email signature
   */
  async extractFromSignature(emailBody: string): Promise<EmailSignature> {
    this.logger.debug('Extracting signature information');

    // Try regex-based parsing first (faster)
    const signatureBlock = extractSignatureBlock(emailBody);
    if (!signatureBlock) {
      return {
        confidence: 0,
      };
    }

    const regexSignature = parseSignature(signatureBlock);

    // If we got good results from regex, return them
    if (
      regexSignature.name &&
      (regexSignature.email || regexSignature.phone)
    ) {
      return {
        ...regexSignature,
        confidence: 0.8,
      };
    }

    // Fallback to AI extraction for complex signatures
    try {
      const aiSignature = await this.callAISignatureExtraction(signatureBlock);
      return {
        ...regexSignature, // Keep regex results
        ...aiSignature, // Override with AI results where available
        confidence: aiSignature.confidence || 0.7,
      };
    } catch (error) {
      this.logger.warn(
        `AI signature extraction failed: ${error.message}. Using regex results.`,
      );
      return {
        ...regexSignature,
        confidence: 0.6,
      };
    }
  }

  /**
   * Call Claude AI for entity extraction
   */
  private async callAIExtraction(
    email: EmailInput,
    options?: ExtractionOptions,
  ): Promise<AIEntityExtractionResponse> {
    const maxRetries = options?.maxRetries || 3;

    const prompt = buildEntityExtractionPrompt({
      subject: email.subject,
      body: email.body,
      from: email.from,
      to: email.to,
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`AI extraction attempt ${attempt}/${maxRetries}`);

        const extractedData = await this.claude.promptJson<AIEntityExtractionResponse>(
          prompt.user,
          {
            system: prompt.system,
            maxTokens: 4096,
            temperature: 0.1, // Low temperature for consistency
          },
        );

        this.logger.debug(
          `AI extraction successful, confidence: ${extractedData.confidence.toFixed(2)}`,
        );

        return extractedData;
      } catch (error) {
        lastError = error;
        this.logger.warn(`AI extraction attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
          );
        }
      }
    }

    throw new Error(
      `AI extraction failed after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Call Claude AI for signature extraction
   */
  private async callAISignatureExtraction(
    signatureBlock: string,
  ): Promise<EmailSignature> {
    const signature = await this.claude.promptJson<EmailSignature>(
      `Extract contact information from this email signature:\n\n${signatureBlock}`,
      {
        system: SIGNATURE_EXTRACTION_PROMPT,
        maxTokens: 1024,
        temperature: 0.1,
      },
    );

    return signature;
  }

  /**
   * Build ExtractedEntities from AI response and signature data
   */
  private buildExtractedEntities(
    aiResponse: AIEntityExtractionResponse,
    signatureData: Partial<EmailSignature> | null,
    email: EmailInput,
  ): ExtractedEntities {
    // Process companies
    const companies: ExtractedCompany[] = aiResponse.companies.map((c) => ({
      name: c.name,
      confidence: c.confidence,
      role: c.role as CompanyRole,
      normalizedName: normalizeCompanyName(c.name),
      vatId: c.vatId,
    }));

    // Process contacts and merge with signature data
    const contacts: ExtractedContact[] = aiResponse.contacts.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone ? normalizePhoneNumber(c.phone) : undefined,
      role: c.role,
      company: c.company,
      confidence: validateEmail(c.email) ? 0.9 : 0.6,
    }));

    // Add signature contact if not already in list
    if (signatureData && signatureData.email) {
      const exists = contacts.find((c) => c.email === signatureData.email);
      if (!exists) {
        contacts.push({
          name: signatureData.name || 'Unknown',
          email: signatureData.email,
          phone: signatureData.phone
            ? normalizePhoneNumber(signatureData.phone)
            : signatureData.mobile
              ? normalizePhoneNumber(signatureData.mobile)
              : undefined,
          role: signatureData.title,
          company: signatureData.company,
          confidence: signatureData.confidence || 0.7,
        });
      }
    }

    // Process amounts
    const amounts: ExtractedAmount[] = aiResponse.amounts.map((a) => ({
      value: a.value,
      currency: a.currency,
      context: a.context,
      confidence: 0.8,
    }));

    // Process dates
    const dates: ExtractedDate[] = aiResponse.dates.map((d) => ({
      date: new Date(d.date),
      context: d.context,
      confidence: 0.8,
    }));

    // Process addresses
    const addresses: ExtractedAddress[] = aiResponse.addresses.map((a) => ({
      full: a.full,
      city: a.city,
      country: a.country,
      confidence: 0.7,
    }));

    // Add signature address if available
    if (signatureData?.address) {
      const exists = addresses.find((a) => a.full === signatureData.address);
      if (!exists) {
        addresses.push({
          full: signatureData.address,
          confidence: 0.6,
        });
      }
    }

    return {
      companies,
      contacts,
      amounts,
      invoiceNumbers: aiResponse.invoiceNumbers || [],
      orderNumbers: aiResponse.orderNumbers || [],
      dates,
      projectNames: aiResponse.projectNames || [],
      trackingNumbers: aiResponse.trackingNumbers || [],
      addresses,
      extractedAt: new Date(),
      emailSubject: email.subject,
      overallConfidence: aiResponse.confidence,
    };
  }

  /**
   * Return empty entities structure
   */
  private emptyEntities(email: EmailInput): ExtractedEntities {
    return {
      companies: [],
      contacts: [],
      amounts: [],
      invoiceNumbers: [],
      orderNumbers: [],
      dates: [],
      projectNames: [],
      trackingNumbers: [],
      addresses: [],
      extractedAt: new Date(),
      emailSubject: email.subject,
      overallConfidence: 0,
    };
  }

  /**
   * Validate extracted email addresses
   */
  private validateExtractedEmails(entities: ExtractedEntities): ExtractedEntities {
    // Filter out invalid emails
    entities.contacts = entities.contacts.filter((c) => validateEmail(c.email));

    return entities;
  }

  /**
   * Normalize extracted data
   */
  private normalizeEntities(entities: ExtractedEntities): ExtractedEntities {
    // Normalize phone numbers
    entities.contacts = entities.contacts.map((c) => ({
      ...c,
      phone: c.phone && validatePhone(c.phone) ? normalizePhoneNumber(c.phone) : undefined,
    }));

    // Normalize company names
    entities.companies = entities.companies.map((c) => ({
      ...c,
      normalizedName: normalizeCompanyName(c.name),
      domain: c.name ? this.guessCompanyDomain(c.name) : undefined,
    }));

    return entities;
  }

  /**
   * Guess company domain from name (basic heuristic)
   */
  private guessCompanyDomain(companyName: string): string | undefined {
    // Remove legal suffixes and spaces
    const normalized = normalizeCompanyName(companyName)
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-]/g, '');

    // This is a guess - not always accurate
    return normalized ? `${normalized}.com` : undefined;
  }

  /**
   * Filter entities below confidence threshold
   */
  private filterByConfidence(
    entities: ExtractedEntities,
    minConfidence: number,
  ): ExtractedEntities {
    return {
      ...entities,
      companies: entities.companies?.filter(c => (c.confidence ?? 1.0) >= minConfidence) || [],
      contacts: entities.contacts?.filter(c => (c.confidence ?? 1.0) >= minConfidence) || [],
      amounts: entities.amounts?.filter(a => (a.confidence ?? 1.0) >= minConfidence) || [],
      dates: entities.dates?.filter(d => (d.confidence ?? 1.0) >= minConfidence) || [],
      addresses: entities.addresses?.filter(a => (a.confidence ?? 1.0) >= minConfidence) || [],
      // Keep other fields unchanged
      invoiceNumbers: entities.invoiceNumbers || [],
      orderNumbers: entities.orderNumbers || [],
      projectNames: entities.projectNames || [],
      trackingNumbers: entities.trackingNumbers || [],
      extractedAt: entities.extractedAt,
      emailSubject: entities.emailSubject,
      overallConfidence: entities.overallConfidence,
    };
  }

  /**
   * Extract entities from email with confidence threshold applied
   */
  async extractEntitiesWithThreshold(
    email: EmailInput,
    orgId: string,
    options?: ExtractionOptions,
  ): Promise<ExtractedEntities> {
    // Get org-specific threshold
    const config = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });
    const minConfidence = config?.minEntityConfidence ?? 0.6;

    this.logger.debug(
      `Extracting entities with confidence threshold ${minConfidence} for org ${orgId}`,
    );

    // Extract entities using existing method
    const entities = await this.extractEntities(email, options);

    // Apply confidence filtering
    const filtered = this.filterByConfidence(entities, minConfidence);

    this.logger.debug(
      `Filtered entities: ${filtered.companies.length}/${entities.companies.length} companies, ${filtered.contacts.length}/${entities.contacts.length} contacts`,
    );

    return filtered;
  }
}
