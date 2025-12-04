import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, ClientStatus, RiskLevel } from '@prisma/client';

/**
 * Enhanced CRM Repository
 *
 * Provides database operations for:
 * - Client management with advanced queries
 * - Contact management
 * - Address management
 * - Communication tracking
 * - Metrics and analytics
 */
@Injectable()
export class CrmRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CLIENT OPERATIONS
  // ============================================================================

  /**
   * Get the last client created in an organization (for clientNumber generation)
   */
  async getLastClientByOrg(orgId: string) {
    return this.prisma.client.findFirst({
      where: { orgId },
      orderBy: { clientNumber: 'desc' },
      select: { clientNumber: true },
    });
  }

  /**
   * Find client by email within organization
   */
  async findClientByEmail(orgId: string, email: string) {
    return this.prisma.client.findFirst({
      where: {
        orgId,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Find client by tax ID within organization
   */
  async findClientByTaxId(orgId: string, taxId: string) {
    return this.prisma.client.findFirst({
      where: {
        orgId,
        taxId: {
          equals: taxId,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Find client by client number
   */
  async findClientByNumber(orgId: string, clientNumber: string) {
    return this.prisma.client.findFirst({
      where: {
        orgId,
        clientNumber: {
          equals: clientNumber,
          mode: 'insensitive',
        },
      },
      include: {
        contacts: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        addresses: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        communications: {
          take: 10,
          orderBy: { occurredAt: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Create a new client
   */
  async createClient(data: Prisma.ClientCreateInput) {
    return this.prisma.client.create({
      data,
      include: {
        contacts: true,
        addresses: true,
        communications: {
          take: 5,
          orderBy: { occurredAt: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Find client by ID with all relations
   */
  async findClientByIdWithRelations(id: string, includeAll = true) {
    return this.prisma.client.findUnique({
      where: { id },
      include: includeAll
        ? {
            contacts: {
              where: { isActive: true },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            addresses: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            communications: {
              take: 20,
              orderBy: { occurredAt: 'desc' },
            },
            payments: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                contacts: true,
                addresses: true,
                communications: true,
                invoices: true,
                payments: true,
              },
            },
          }
        : {
            _count: {
              select: {
                contacts: true,
                addresses: true,
                communications: true,
                invoices: true,
                payments: true,
              },
            },
          },
    });
  }

  /**
   * Find clients with filters (offset-based pagination)
   */
  async findClients(params: {
    where: Prisma.ClientWhereInput;
    include?: Prisma.ClientInclude;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
  }) {
    return this.prisma.client.findMany(params);
  }

  /**
   * Find clients with cursor-based pagination
   */
  async findClientsWithCursor(params: {
    where: Prisma.ClientWhereInput;
    include?: Prisma.ClientInclude;
    cursor?: Prisma.ClientWhereUniqueInput;
    take?: number;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
  }) {
    return this.prisma.client.findMany(params);
  }

  /**
   * Count clients matching filter
   */
  async countClients(where: Prisma.ClientWhereInput) {
    return this.prisma.client.count({ where });
  }

  /**
   * Find multiple clients by IDs
   */
  async findClientsByIds(ids: string[]) {
    return this.prisma.client.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        orgId: true,
        clientNumber: true,
        name: true,
      },
    });
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        contacts: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        addresses: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        communications: {
          take: 5,
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
  }

  /**
   * Soft delete client (set status to CHURNED)
   */
  async softDeleteClient(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: {
        status: ClientStatus.CHURNED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk update clients
   */
  async bulkUpdateClients(ids: string[], data: Prisma.ClientUpdateInput) {
    return this.prisma.client.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data,
    });
  }

  /**
   * Bulk soft delete clients
   */
  async bulkSoftDeleteClients(ids: string[]) {
    return this.prisma.client.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        status: ClientStatus.CHURNED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Search clients by query
   */
  async searchClients(orgId: string, query: string, limit = 20) {
    return this.prisma.client.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { clientNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { taxId: { contains: query, mode: 'insensitive' } },
          { vatId: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        status: true,
        isVip: true,
      },
    });
  }

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  /**
   * Create a new contact
   */
  async createContact(data: Prisma.ClientContactCreateInput) {
    return this.prisma.clientContact.create({
      data,
      include: {
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find all contacts for a client
   */
  async findContactsByClient(clientId: string) {
    return this.prisma.clientContact.findMany({
      where: {
        clientId,
        isActive: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Find contact by ID
   */
  async findContactById(id: string) {
    return this.prisma.clientContact.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update contact
   */
  async updateContact(id: string, data: Prisma.ClientContactUpdateInput) {
    return this.prisma.clientContact.update({
      where: { id },
      data,
    });
  }

  /**
   * Unset all other primary contacts for a client
   */
  async unsetOtherPrimaryContacts(clientId: string, exceptContactId: string) {
    return this.prisma.clientContact.updateMany({
      where: {
        clientId,
        id: {
          not: exceptContactId,
        },
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  /**
   * Soft delete contact
   */
  async deleteContact(id: string) {
    return this.prisma.clientContact.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  // ============================================================================
  // ADDRESS OPERATIONS
  // ============================================================================

  /**
   * Create a new address
   */
  async createAddress(data: Prisma.ClientAddressCreateInput) {
    return this.prisma.clientAddress.create({
      data,
      include: {
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find all addresses for a client
   */
  async findAddressesByClient(clientId: string) {
    return this.prisma.clientAddress.findMany({
      where: { clientId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Find address by ID
   */
  async findAddressById(id: string) {
    return this.prisma.clientAddress.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update address
   */
  async updateAddress(id: string, data: Prisma.ClientAddressUpdateInput) {
    return this.prisma.clientAddress.update({
      where: { id },
      data,
    });
  }

  /**
   * Unset all other primary addresses for a client
   */
  async unsetOtherPrimaryAddresses(clientId: string, exceptAddressId: string) {
    return this.prisma.clientAddress.updateMany({
      where: {
        clientId,
        id: {
          not: exceptAddressId,
        },
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  /**
   * Delete address
   */
  async deleteAddress(id: string) {
    return this.prisma.clientAddress.delete({
      where: { id },
    });
  }

  // ============================================================================
  // COMMUNICATION OPERATIONS
  // ============================================================================

  /**
   * Create a new communication/note
   */
  async createCommunication(data: Prisma.ClientCommunicationCreateInput) {
    return this.prisma.clientCommunication.create({
      data,
      include: {
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find recent activity for a client
   */
  async findRecentActivity(clientId: string, limit = 20) {
    return this.prisma.clientCommunication.findMany({
      where: { clientId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Count recent communications for a client
   */
  async countRecentCommunications(clientId: string, days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.prisma.clientCommunication.count({
      where: {
        clientId,
        occurredAt: {
          gte: date,
        },
      },
    });
  }

  // ============================================================================
  // METRICS & ANALYTICS
  // ============================================================================

  /**
   * Update client metrics from payments and invoices
   */
  async updateClientMetrics(clientId: string) {
    // Get all completed payments for this client
    const payments = await this.prisma.clientPayment.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      orderBy: { paidAt: 'desc' },
    });

    // Calculate metrics
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaidInvoices = payments.filter(p => p.invoiceId).length;

    // Calculate average payment days
    const paymentDelays = payments
      .filter(p => p.paidAt && p.dueDate)
      .map(p => {
        const paid = new Date(p.paidAt!).getTime();
        const due = new Date(p.dueDate!).getTime();
        return (paid - due) / (1000 * 60 * 60 * 24); // days
      });

    const averagePaymentDays =
      paymentDelays.length > 0
        ? paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length
        : null;

    const lastPayment = payments[0];

    // Get invoice count
    const totalInvoices = await this.prisma.invoice.count({
      where: { clientId },
    });

    // Get outstanding balance
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
        status: {
          in: ['SENT', 'OVERDUE', 'PARTIAL'],
        },
      },
    });

    const outstandingBalance = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0) - Number(inv.paidAmount || 0),
      0,
    );

    // Update client
    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalRevenue,
        totalInvoices,
        totalPaidInvoices,
        outstandingBalance,
        lastPaymentDate: lastPayment?.paidAt || null,
        averagePaymentDays,
      },
    });
  }

  /**
   * Get client statistics for organization
   */
  async getClientStats(orgId: string) {
    const [
      totalClients,
      activeClients,
      prospectClients,
      inactiveClients,
      highRiskClients,
      criticalRiskClients,
      vipClients,
      totalRevenue,
      avgRevenue,
    ] = await Promise.all([
      this.prisma.client.count({ where: { orgId } }),
      this.prisma.client.count({ where: { orgId, status: ClientStatus.ACTIVE } }),
      this.prisma.client.count({ where: { orgId, status: ClientStatus.PROSPECT } }),
      this.prisma.client.count({ where: { orgId, status: ClientStatus.INACTIVE } }),
      this.prisma.client.count({ where: { orgId, riskLevel: RiskLevel.HIGH } }),
      this.prisma.client.count({ where: { orgId, riskLevel: 'CRITICAL' as RiskLevel } }),
      this.prisma.client.count({ where: { orgId, isVip: true } }),
      this.prisma.client.aggregate({
        where: { orgId, status: ClientStatus.ACTIVE },
        _sum: { totalRevenue: true },
      }),
      this.prisma.client.aggregate({
        where: { orgId, status: ClientStatus.ACTIVE },
        _avg: { totalRevenue: true },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      prospectClients,
      inactiveClients,
      churnedClients: totalClients - activeClients - prospectClients - inactiveClients,
      highRiskClients,
      criticalRiskClients,
      vipClients,
      totalRevenue: totalRevenue._sum.totalRevenue || 0,
      averageRevenue: avgRevenue._avg.totalRevenue || 0,
    };
  }

  /**
   * Get top clients by revenue
   */
  async getTopClientsByRevenue(orgId: string, limit = 10) {
    return this.prisma.client.findMany({
      where: {
        orgId,
        status: ClientStatus.ACTIVE,
        totalRevenue: {
          gt: 0,
        },
      },
      orderBy: { totalRevenue: 'desc' },
      take: limit,
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Get clients requiring attention (high risk, no recent communication)
   */
  async getClientsRequiringAttention(orgId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.prisma.client.findMany({
      where: {
        orgId,
        status: ClientStatus.ACTIVE,
        OR: [
          { riskLevel: RiskLevel.HIGH },
          { riskLevel: 'CRITICAL' as RiskLevel },
          {
            communications: {
              none: {
                occurredAt: { gte: thirtyDaysAgo },
              },
            },
          },
        ],
      },
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        communications: {
          take: 1,
          orderBy: { occurredAt: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
          },
        },
      },
      orderBy: [{ riskLevel: 'desc' }, { lastPaymentDate: 'asc' }],
      take: 20,
    });
  }
}
