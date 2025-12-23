import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { EmailMailboxPurpose } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class MailboxService {
  private readonly logger = new Logger(MailboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new mailbox configuration
   */
  async createMailbox(data: {
    connectionId: string;
    orgId: string;
    userId: string;
    email: string;
    displayName?: string;
    purpose: EmailMailboxPurpose;
    foldersToScan?: string[];
    labelIds?: string[];
    folderIds?: string[];
  }) {
    return this.prisma.emailMailbox.create({
      data: {
        connectionId: data.connectionId,
        orgId: data.orgId,
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        purpose: data.purpose,
        foldersToScan: data.foldersToScan || [],
        scanAllFolders: !data.foldersToScan?.length,
        labelIds: data.labelIds || [],
        folderIds: data.folderIds || [],
      },
    });
  }

  /**
   * Get all mailboxes for an organization
   */
  async getMailboxes(orgId: string) {
    return this.prisma.emailMailbox.findMany({
      where: { orgId, isActive: true },
      include: { connection: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update mailbox configuration
   */
  async updateMailbox(id: string, orgId: string, data: {
    displayName?: string;
    purpose?: EmailMailboxPurpose;
    foldersToScan?: string[];
    labelIds?: string[];
    folderIds?: string[];
    isActive?: boolean;
  }) {
    const mailbox = await this.prisma.emailMailbox.findFirst({
      where: { id, orgId },
    });

    if (!mailbox) {
      throw new NotFoundException('Mailbox not found');
    }

    return this.prisma.emailMailbox.update({
      where: { id },
      data: {
        ...data,
        scanAllFolders: data.foldersToScan ? data.foldersToScan.length === 0 : undefined,
      },
    });
  }

  /**
   * Delete mailbox
   */
  async deleteMailbox(id: string, orgId: string) {
    const mailbox = await this.prisma.emailMailbox.findFirst({
      where: { id, orgId },
    });

    if (!mailbox) {
      throw new NotFoundException('Mailbox not found');
    }

    return this.prisma.emailMailbox.delete({ where: { id } });
  }

  /**
   * Create or get forwarding inbox for org
   */
  async getOrCreateForwardingInbox(orgId: string, purpose: EmailMailboxPurpose = 'BILLS_INVOICES') {
    // Check if exists
    let inbox = await this.prisma.emailForwardingInbox.findFirst({
      where: { orgId, purpose },
    });

    if (!inbox) {
      // Generate unique prefix
      const prefix = `${purpose.toLowerCase().replace('_', '-')}-${randomBytes(4).toString('hex')}`;
      const address = `${prefix}@in.operate.guru`;

      inbox = await this.prisma.emailForwardingInbox.create({
        data: {
          orgId,
          inboxAddress: address,
          inboxPrefix: prefix,
          purpose,
          displayName: this.getPurposeDisplayName(purpose),
        },
      });
    }

    return inbox;
  }

  /**
   * Get all forwarding inboxes for org
   */
  async getForwardingInboxes(orgId: string) {
    return this.prisma.emailForwardingInbox.findMany({
      where: { orgId, isActive: true },
      orderBy: { purpose: 'asc' },
    });
  }

  private getPurposeDisplayName(purpose: EmailMailboxPurpose): string {
    const names: Record<EmailMailboxPurpose, string> = {
      BILLS_INVOICES: 'Bills & Invoices',
      INSURANCE_CONTRACTS: 'Insurance & Contracts',
      CUSTOMER_COMMS: 'Customer Communications',
      GENERAL: 'General',
    };
    return names[purpose] || 'General';
  }
}
