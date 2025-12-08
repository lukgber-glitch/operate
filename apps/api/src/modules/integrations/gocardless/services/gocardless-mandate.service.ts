import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GoCardlessService } from '../gocardless.service';
import { GoCardlessAuthService } from './gocardless-auth.service';
import {
  CreateMandateRequest,
  GoCardlessMandate,
  GoCardlessMandateStatus,
  GoCardlessMandateScheme,
} from '../gocardless.types';

/**
 * GoCardless Mandate Service
 * Handles Direct Debit mandate creation and management
 *
 * Features:
 * - Create mandates for BACS (UK) and SEPA (EU)
 * - Generate mandate creation flows (redirect flow)
 * - Get mandate status
 * - Cancel mandates
 * - List customer mandates
 *
 * Supported Schemes:
 * - BACS (UK) - 3-day payment cycle
 * - SEPA Core (EU) - 2-day payment cycle
 * - SEPA COR1 (EU - faster) - 1-day payment cycle
 */
@Injectable()
export class GoCardlessMandateService {
  private readonly logger = new Logger(GoCardlessMandateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocardlessService: GoCardlessService,
    private readonly authService: GoCardlessAuthService,
  ) {}

  /**
   * Create a new mandate via redirect flow
   * Returns a redirect URL where the customer can authorize the mandate
   */
  async createMandateFlow(
    orgId: string,
    customerId: string,
    scheme: GoCardlessMandateScheme,
    successRedirectUrl: string,
    description?: string,
  ): Promise<{ redirectUrl: string; redirectFlowId: string }> {
    try {
      // Check if organization is connected
      const isConnected = await this.authService.isConnected(orgId);
      if (!isConnected) {
        throw new BadRequestException('GoCardless not connected for this organization');
      }

      // Get customer details
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { organisation: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Generate session token (unique identifier for this flow)
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create redirect flow
      const redirectFlow = await this.gocardlessService.createRedirectFlow({
        description: description || `Direct Debit setup for ${customer.organisation.name}`,
        sessionToken,
        successRedirectUrl,
        scheme,
        prefilled_customer: {
          given_name: customer.firstName,
          family_name: customer.lastName,
          email: customer.email,
        },
      });

      // Store redirect flow in database for later completion
      await this.prisma.goCardlessRedirectFlow.create({
        data: {
          redirectFlowId: redirectFlow.id,
          orgId,
          customerId,
          sessionToken,
          scheme,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });

      this.logger.log('Created mandate redirect flow', {
        redirectFlowId: redirectFlow.id,
        customerId,
        scheme,
      });

      return {
        redirectUrl: redirectFlow.redirect_url,
        redirectFlowId: redirectFlow.id,
      };
    } catch (error) {
      this.logger.error('Failed to create mandate flow', error);
      throw error;
    }
  }

  /**
   * Complete redirect flow and create mandate
   * Called after customer has authorized the mandate
   */
  async completeMandateFlow(
    redirectFlowId: string,
  ): Promise<GoCardlessMandate> {
    try {
      // Get redirect flow from database
      const redirectFlow = await this.prisma.goCardlessRedirectFlow.findUnique({
        where: { redirectFlowId },
      });

      if (!redirectFlow) {
        throw new NotFoundException('Redirect flow not found');
      }

      if (redirectFlow.status !== 'PENDING') {
        throw new BadRequestException('Redirect flow already completed or expired');
      }

      if (redirectFlow.expiresAt < new Date()) {
        throw new BadRequestException('Redirect flow has expired');
      }

      // Complete the redirect flow with GoCardless
      const mandate = await this.gocardlessService.completeRedirectFlow({
        redirectFlowId,
        sessionToken: redirectFlow.sessionToken,
      });

      // Store mandate in database
      await this.prisma.goCardlessMandate.create({
        data: {
          mandateId: mandate.id,
          orgId: redirectFlow.orgId,
          customerId: redirectFlow.customerId,
          scheme: mandate.scheme as Prisma.InputJsonValue,
          status: mandate.status as Prisma.InputJsonValue,
          reference: mandate.reference,
          nextPossibleChargeDate: new Date(mandate.next_possible_charge_date),
          customerBankAccountId: mandate.links.customer_bank_account,
          creditorId: mandate.links.creditor,
        },
      });

      // Update redirect flow status
      await this.prisma.goCardlessRedirectFlow.update({
        where: { redirectFlowId },
        data: {
          status: 'COMPLETED',
          mandateId: mandate.id,
        },
      });

      this.logger.log('Completed mandate flow', {
        mandateId: mandate.id,
        customerId: redirectFlow.customerId,
      });

      return mandate;
    } catch (error) {
      this.logger.error('Failed to complete mandate flow', error);
      throw error;
    }
  }

  /**
   * Get mandate by ID
   */
  async getMandate(mandateId: string): Promise<GoCardlessMandate> {
    try {
      const mandate = await this.prisma.goCardlessMandate.findUnique({
        where: { mandateId },
      });

      if (!mandate) {
        throw new NotFoundException('Mandate not found');
      }

      // Get fresh data from GoCardless
      const client = this.gocardlessService.getClient();
      const gcMandate = await client.mandates.find(mandateId);

      // Update local database
      await this.prisma.goCardlessMandate.update({
        where: { mandateId },
        data: {
          status: gcMandate.status as Prisma.InputJsonValue,
          nextPossibleChargeDate: new Date(gcMandate.next_possible_charge_date),
        },
      });

      return gcMandate as unknown as GoCardlessMandate;
    } catch (error) {
      this.logger.error('Failed to get mandate', error);
      throw error;
    }
  }

  /**
   * List mandates for a customer
   */
  async listCustomerMandates(customerId: string): Promise<GoCardlessMandate[]> {
    try {
      const mandates = await this.prisma.goCardlessMandate.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      // Get fresh data from GoCardless for active mandates
      const client = this.gocardlessService.getClient();
      const updatedMandates: GoCardlessMandate[] = [];

      for (const mandate of mandates) {
        try {
          const gcMandate = await client.mandates.find(mandate.mandateId);
          updatedMandates.push(gcMandate as unknown as GoCardlessMandate);

          // Update local database
          await this.prisma.goCardlessMandate.update({
            where: { mandateId: mandate.mandateId },
            data: {
              status: gcMandate.status as Prisma.InputJsonValue,
              nextPossibleChargeDate: new Date(gcMandate.next_possible_charge_date),
            },
          });
        } catch (error) {
          this.logger.warn('Failed to fetch mandate from GoCardless', {
            mandateId: mandate.mandateId,
            error: error.message,
          });
        }
      }

      return updatedMandates;
    } catch (error) {
      this.logger.error('Failed to list customer mandates', error);
      throw error;
    }
  }

  /**
   * Cancel a mandate
   */
  async cancelMandate(mandateId: string, userId: string): Promise<void> {
    try {
      const mandate = await this.prisma.goCardlessMandate.findUnique({
        where: { mandateId },
      });

      if (!mandate) {
        throw new NotFoundException('Mandate not found');
      }

      // Cancel with GoCardless
      const client = this.gocardlessService.getClient();
      await client.mandates.cancel(mandateId);

      // Update local database
      await this.prisma.goCardlessMandate.update({
        where: { mandateId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });

      this.logger.log('Cancelled mandate', { mandateId });
    } catch (error) {
      this.logger.error('Failed to cancel mandate', error);
      throw error;
    }
  }

  /**
   * Reinstate a cancelled mandate
   */
  async reinstateMandate(mandateId: string): Promise<GoCardlessMandate> {
    try {
      const client = this.gocardlessService.getClient();
      const mandate = await client.mandates.reinstate(mandateId);

      // Update local database
      await this.prisma.goCardlessMandate.update({
        where: { mandateId },
        data: {
          status: mandate.status as Prisma.InputJsonValue,
          cancelledAt: null,
          cancelledBy: null,
        },
      });

      this.logger.log('Reinstated mandate', { mandateId });

      return mandate as unknown as GoCardlessMandate;
    } catch (error) {
      this.logger.error('Failed to reinstate mandate', error);
      throw error;
    }
  }

  /**
   * Get mandate status
   */
  async getMandateStatus(mandateId: string): Promise<GoCardlessMandateStatus> {
    const mandate = await this.getMandate(mandateId);
    return mandate.status;
  }

  /**
   * Check if mandate is active and can be used for payments
   */
  async isMandateActive(mandateId: string): Promise<boolean> {
    const status = await this.getMandateStatus(mandateId);
    return status === GoCardlessMandateStatus.ACTIVE;
  }
}
