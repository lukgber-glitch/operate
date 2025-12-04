import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GoCardlessService } from '../gocardless.service';
import { GoCardlessAuthService } from './gocardless-auth.service';
import { GoCardlessCustomerBankAccount } from '../gocardless.types';

/**
 * GoCardless Customer Service
 * Manages customer records in GoCardless
 *
 * Features:
 * - Create GoCardless customers (linked to Operate customers)
 * - Update customer bank accounts
 * - Get customer details
 * - List customer mandates and payments
 */
@Injectable()
export class GoCardlessCustomerService {
  private readonly logger = new Logger(GoCardlessCustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocardlessService: GoCardlessService,
    private readonly authService: GoCardlessAuthService,
  ) {}

  /**
   * Create a GoCardless customer
   * This is usually done automatically during mandate creation via redirect flow
   * But can be done manually if needed
   */
  async createCustomer(
    customerId: string,
    userId: string,
  ): Promise<string> {
    try {
      // Get customer from database
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { organisation: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Check if already created
      const existing = await this.prisma.goCardlessCustomer.findUnique({
        where: { customerId },
      });

      if (existing) {
        return existing.gcCustomerId;
      }

      // Create customer in GoCardless
      const client = this.gocardlessService.getClient();
      const gcCustomer = await client.customers.create({
        email: customer.email,
        given_name: customer.firstName,
        family_name: customer.lastName,
        address_line1: customer.billingAddress?.street || '',
        city: customer.billingAddress?.city || '',
        postal_code: customer.billingAddress?.postalCode || '',
        country_code: customer.billingAddress?.country || 'GB',
        metadata: {
          operate_customer_id: customerId,
          operate_org_id: customer.orgId,
        },
      });

      // Store in database
      await this.prisma.goCardlessCustomer.create({
        data: {
          customerId,
          gcCustomerId: gcCustomer.id,
          orgId: customer.orgId,
          createdBy: userId,
        },
      });

      this.logger.log('Created GoCardless customer', {
        customerId,
        gcCustomerId: gcCustomer.id,
      });

      return gcCustomer.id;
    } catch (error) {
      this.logger.error('Failed to create GoCardless customer', error);
      throw error;
    }
  }

  /**
   * Get GoCardless customer ID for Operate customer
   */
  async getGoCardlessCustomerId(customerId: string): Promise<string | null> {
    const gcCustomer = await this.prisma.goCardlessCustomer.findUnique({
      where: { customerId },
      select: { gcCustomerId: true },
    });

    return gcCustomer?.gcCustomerId || null;
  }

  /**
   * Get customer details from GoCardless
   */
  async getCustomerDetails(customerId: string): Promise<any> {
    try {
      const gcCustomerId = await this.getGoCardlessCustomerId(customerId);
      if (!gcCustomerId) {
        throw new NotFoundException('GoCardless customer not found');
      }

      const client = this.gocardlessService.getClient();
      return await client.customers.find(gcCustomerId);
    } catch (error) {
      this.logger.error('Failed to get customer details', error);
      throw error;
    }
  }

  /**
   * Update customer bank account
   */
  async updateCustomerBankAccount(
    customerId: string,
    bankAccountData: {
      accountHolderName: string;
      accountNumber?: string;
      iban?: string;
      branchCode?: string;
      countryCode: string;
    },
    userId: string,
  ): Promise<GoCardlessCustomerBankAccount> {
    try {
      const gcCustomerId = await this.getGoCardlessCustomerId(customerId);
      if (!gcCustomerId) {
        throw new NotFoundException('GoCardless customer not found');
      }

      // Create customer bank account
      const client = this.gocardlessService.getClient();
      const bankAccount = await client.customerBankAccounts.create({
        account_holder_name: bankAccountData.accountHolderName,
        account_number: bankAccountData.accountNumber,
        branch_code: bankAccountData.branchCode,
        iban: bankAccountData.iban,
        country_code: bankAccountData.countryCode,
        links: {
          customer: gcCustomerId,
        },
        metadata: {
          updated_by: userId,
        },
      });

      this.logger.log('Updated customer bank account', {
        customerId,
        bankAccountId: bankAccount.id,
      });

      return bankAccount as unknown as GoCardlessCustomerBankAccount;
    } catch (error) {
      this.logger.error('Failed to update customer bank account', error);
      throw error;
    }
  }

  /**
   * List customer bank accounts
   */
  async listCustomerBankAccounts(customerId: string): Promise<GoCardlessCustomerBankAccount[]> {
    try {
      const gcCustomerId = await this.getGoCardlessCustomerId(customerId);
      if (!gcCustomerId) {
        throw new NotFoundException('GoCardless customer not found');
      }

      const client = this.gocardlessService.getClient();
      const response = await client.customerBankAccounts.list({
        customer: gcCustomerId,
      });

      return response.customer_bank_accounts as unknown as GoCardlessCustomerBankAccount[];
    } catch (error) {
      this.logger.error('Failed to list customer bank accounts', error);
      throw error;
    }
  }

  /**
   * Disable a customer bank account
   */
  async disableCustomerBankAccount(bankAccountId: string): Promise<void> {
    try {
      const client = this.gocardlessService.getClient();
      await client.customerBankAccounts.disable(bankAccountId);

      this.logger.log('Disabled customer bank account', { bankAccountId });
    } catch (error) {
      this.logger.error('Failed to disable customer bank account', error);
      throw error;
    }
  }

  /**
   * Remove GoCardless customer mapping
   */
  async removeCustomer(customerId: string): Promise<void> {
    try {
      await this.prisma.goCardlessCustomer.delete({
        where: { customerId },
      });

      this.logger.log('Removed GoCardless customer mapping', { customerId });
    } catch (error) {
      this.logger.error('Failed to remove customer', error);
      throw error;
    }
  }
}
