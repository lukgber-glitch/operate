import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { PersonaService } from '../persona.service';
import {
  PersonaInquiryObject,
  PersonaSessionToken,
  PersonaInquiryStatus,
} from '../types/persona.types';
import { CreateInquiryDto, InquiryResponseDto } from '../dto';

/**
 * Persona Inquiry Service
 * Manages Persona inquiry creation and retrieval
 *
 * Features:
 * - Create new inquiries with session tokens
 * - Retrieve inquiry status and details
 * - List inquiries by user or organization
 * - Handle inquiry expiration
 */
@Injectable()
export class PersonaInquiryService {
  private readonly logger = new Logger(PersonaInquiryService.name);

  constructor(
    private readonly personaService: PersonaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new Persona inquiry
   *
   * @param userId - User ID creating the inquiry
   * @param dto - Inquiry creation data
   * @returns Inquiry response with session token
   */
  async createInquiry(
    userId: string,
    dto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    this.logger.log(`Creating Persona inquiry for user ${userId}`);

    try {
      // Prepare inquiry data for Persona API
      const inquiryData = {
        data: {
          type: 'inquiry',
          attributes: {
            'inquiry-template-id': dto.templateId,
            'reference-id': dto.referenceId,
            ...(dto.fields && { fields: dto.fields }),
            ...(dto.tags && { tags: dto.tags }),
            ...(dto.redirectUrl && { 'redirect-uri': dto.redirectUrl }),
          },
        },
      };

      // Create inquiry via Persona API
      const response = await this.personaService.post<PersonaInquiryObject>(
        '/inquiries',
        inquiryData,
      );

      const inquiry = response.data;

      // Get session token for client-side flow
      const sessionResponse = await this.personaService.post<PersonaSessionToken>(
        `/inquiries/${inquiry.id}/sessions`,
        {},
      );

      const sessionToken = sessionResponse.meta['session-token'];

      // Calculate expiration (typically 7 days for Persona inquiries)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Store inquiry in database
      await this.prisma.$executeRaw`
        INSERT INTO persona_inquiries
        (id, inquiry_id, template_id, reference_id, user_id, organization_id, status, verification_level, created_at, expires_at, metadata)
        VALUES
        (
          gen_random_uuid(),
          ${inquiry.id},
          ${dto.templateId},
          ${dto.referenceId || null},
          ${userId},
          ${dto.organizationId || null},
          ${inquiry.attributes.status},
          ${dto.verificationLevel || null},
          NOW(),
          ${expiresAt},
          ${JSON.stringify(dto.metadata || {})}::jsonb
        )
      `;

      this.logger.log(`Persona inquiry created: ${inquiry.id}`);

      // Build embedded URL for client-side integration
      const embeddedUrl = `https://withpersona.com/verify?inquiry-id=${inquiry.id}&session-token=${sessionToken}`;

      return {
        inquiryId: inquiry.id,
        sessionToken,
        status: inquiry.attributes.status as PersonaInquiryStatus,
        referenceId: dto.referenceId,
        templateId: dto.templateId,
        createdAt: new Date(inquiry.attributes['created-at']),
        expiresAt,
        embeddedUrl,
      };
    } catch (error) {
      this.logger.error('Failed to create Persona inquiry', error);
      throw error;
    }
  }

  /**
   * Get inquiry by ID
   *
   * @param inquiryId - Persona inquiry ID
   * @returns Inquiry details
   */
  async getInquiry(inquiryId: string): Promise<PersonaInquiryObject> {
    this.logger.log(`Retrieving Persona inquiry: ${inquiryId}`);

    try {
      const response = await this.personaService.get<PersonaInquiryObject>(
        `/inquiries/${inquiryId}`,
      );

      // Update status in database if changed
      await this.updateInquiryStatus(
        inquiryId,
        response.data.attributes.status as PersonaInquiryStatus,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve inquiry ${inquiryId}`, error);
      throw error;
    }
  }

  /**
   * Get inquiry by user ID
   *
   * @param userId - User ID
   * @returns List of inquiries for the user
   */
  async getInquiriesByUser(userId: string): Promise<any[]> {
    this.logger.log(`Retrieving Persona inquiries for user ${userId}`);

    try {
      const inquiries = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          inquiry_id,
          template_id,
          reference_id,
          status,
          verification_level,
          created_at,
          updated_at,
          completed_at,
          expires_at,
          metadata
        FROM persona_inquiries
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return inquiries;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve inquiries for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get inquiry by organization ID
   *
   * @param organizationId - Organization ID
   * @returns List of inquiries for the organization
   */
  async getInquiriesByOrganization(organizationId: string): Promise<any[]> {
    this.logger.log(
      `Retrieving Persona inquiries for organization ${organizationId}`,
    );

    try {
      const inquiries = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          inquiry_id,
          template_id,
          reference_id,
          user_id,
          status,
          verification_level,
          created_at,
          updated_at,
          completed_at,
          expires_at,
          metadata
        FROM persona_inquiries
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `;

      return inquiries;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve inquiries for organization ${organizationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update inquiry status in database
   *
   * @param inquiryId - Persona inquiry ID
   * @param status - New status
   */
  async updateInquiryStatus(
    inquiryId: string,
    status: PersonaInquiryStatus,
  ): Promise<void> {
    try {
      const completedAt =
        status === PersonaInquiryStatus.APPROVED ||
        status === PersonaInquiryStatus.DECLINED ||
        status === PersonaInquiryStatus.FAILED
          ? new Date()
          : null;

      await this.prisma.$executeRaw`
        UPDATE persona_inquiries
        SET
          status = ${status},
          completed_at = ${completedAt},
          updated_at = NOW()
        WHERE inquiry_id = ${inquiryId}
      `;

      this.logger.log(`Updated inquiry ${inquiryId} status to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update inquiry status for ${inquiryId}`,
        error,
      );
      // Don't throw - this is a background update
    }
  }

  /**
   * List available inquiry templates
   *
   * @returns List of templates
   */
  async listTemplates(): Promise<any[]> {
    this.logger.log('Retrieving Persona inquiry templates');

    try {
      const response = await this.personaService.get('/inquiry-templates');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to retrieve inquiry templates', error);
      throw error;
    }
  }

  /**
   * Resume an existing inquiry (regenerate session token)
   *
   * @param inquiryId - Persona inquiry ID
   * @returns New session token
   */
  async resumeInquiry(inquiryId: string): Promise<string> {
    this.logger.log(`Resuming Persona inquiry: ${inquiryId}`);

    try {
      // Get fresh session token
      const sessionResponse = await this.personaService.post<PersonaSessionToken>(
        `/inquiries/${inquiryId}/sessions`,
        {},
      );

      return sessionResponse.meta['session-token'];
    } catch (error) {
      this.logger.error(`Failed to resume inquiry ${inquiryId}`, error);
      throw error;
    }
  }

  /**
   * Expire an inquiry manually
   *
   * @param inquiryId - Persona inquiry ID
   */
  async expireInquiry(inquiryId: string): Promise<void> {
    this.logger.log(`Expiring Persona inquiry: ${inquiryId}`);

    try {
      // Mark as expired via Persona API
      await this.personaService.patch(`/inquiries/${inquiryId}`, {
        data: {
          type: 'inquiry',
          attributes: {
            status: PersonaInquiryStatus.EXPIRED,
          },
        },
      });

      // Update in database
      await this.updateInquiryStatus(inquiryId, PersonaInquiryStatus.EXPIRED);

      this.logger.log(`Inquiry ${inquiryId} expired successfully`);
    } catch (error) {
      this.logger.error(`Failed to expire inquiry ${inquiryId}`, error);
      throw error;
    }
  }
}
