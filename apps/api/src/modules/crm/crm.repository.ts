import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, ClientStatus, ClientType, RiskLevel } from '@prisma/client';

@Injectable()
export class CrmRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CLIENT OPERATIONS
  // ============================================================================

  async createClient(data: Prisma.ClientCreateInput) {
    return this.prisma.client.create({
      data,
      include: {
        contacts: true,
        communications: {
          take: 5,
          orderBy: { occurredAt: 'desc' },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findClientById(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        communications: {
          take: 10,
          orderBy: { occurredAt: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findClients(params: {
    orgId: string;
    status?: ClientStatus;
    type?: ClientType;
    riskLevel?: RiskLevel;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { orgId, status, type, riskLevel, search, skip = 0, take = 50 } = params;

    const where: Prisma.ClientWhereInput = {
      orgId,
      ...(status && { status }),
      ...(type && { type }),
      ...(riskLevel && { riskLevel }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { vatId: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              communications: true,
              payments: true,
            },
          },
        },
        orderBy: [{ name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { clients, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  async updateClient(id: string, data: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        contacts: true,
        communications: {
          take: 5,
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
  }

  async deleteClient(id: string) {
    // Soft delete by updating status
    return this.prisma.client.update({
      where: { id },
      data: { status: ClientStatus.CHURNED },
    });
  }

  async updateClientMetrics(clientId: string) {
    // Calculate payment metrics from ClientPayment records
    const payments = await this.prisma.clientPayment.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaidInvoices = payments.filter(p => p.invoiceId).length;

    // Calculate average payment days (if paidAt and dueDate are available)
    const paymentDelays = payments
      .filter(p => p.paidAt && p.dueDate)
      .map(p => {
        const paid = new Date(p.paidAt!).getTime();
        const due = new Date(p.dueDate!).getTime();
        return (paid - due) / (1000 * 60 * 60 * 24); // days
      });

    const averagePaymentDays = paymentDelays.length > 0
      ? paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length
      : null;

    const lastPayment = payments[0];

    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalRevenue,
        totalPaidInvoices,
        lastPaymentDate: lastPayment?.paidAt || null,
        averagePaymentDays,
      },
    });
  }

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  async createContact(data: Prisma.ClientContactCreateInput) {
    return this.prisma.clientContact.create({
      data,
      include: {
        client: true,
      },
    });
  }

  async findContactsByClient(clientId: string) {
    return this.prisma.clientContact.findMany({
      where: { clientId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findContactById(id: string) {
    return this.prisma.clientContact.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });
  }

  async updateContact(id: string, data: Prisma.ClientContactUpdateInput) {
    return this.prisma.clientContact.update({
      where: { id },
      data,
      include: {
        client: true,
      },
    });
  }

  async deleteContact(id: string) {
    // Soft delete
    return this.prisma.clientContact.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async setPrimaryContact(clientId: string, contactId: string) {
    // First, unset all primary contacts for this client
    await this.prisma.clientContact.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Then set the new primary contact
    return this.prisma.clientContact.update({
      where: { id: contactId },
      data: { isPrimary: true },
    });
  }

  // ============================================================================
  // COMMUNICATION OPERATIONS
  // ============================================================================

  async createCommunication(data: Prisma.ClientCommunicationCreateInput) {
    return this.prisma.clientCommunication.create({
      data,
      include: {
        client: true,
      },
    });
  }

  async findCommunicationsByClient(params: {
    clientId: string;
    skip?: number;
    take?: number;
  }) {
    const { clientId, skip = 0, take = 50 } = params;

    const [communications, total] = await Promise.all([
      this.prisma.clientCommunication.findMany({
        where: { clientId },
        orderBy: { occurredAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.clientCommunication.count({ where: { clientId } }),
    ]);

    return { communications, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  async findCommunicationById(id: string) {
    return this.prisma.clientCommunication.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });
  }

  async updateCommunication(id: string, data: Prisma.ClientCommunicationUpdateInput) {
    return this.prisma.clientCommunication.update({
      where: { id },
      data,
      include: {
        client: true,
      },
    });
  }

  async deleteCommunication(id: string) {
    return this.prisma.clientCommunication.delete({
      where: { id },
    });
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  async getClientStats(orgId: string) {
    const [
      totalClients,
      activeClients,
      prospectClients,
      highRiskClients,
      recentCommunications,
    ] = await Promise.all([
      this.prisma.client.count({ where: { orgId } }),
      this.prisma.client.count({ where: { orgId, status: ClientStatus.ACTIVE } }),
      this.prisma.client.count({ where: { orgId, status: ClientStatus.PROSPECT } }),
      this.prisma.client.count({ where: { orgId, riskLevel: RiskLevel.HIGH } }),
      this.prisma.clientCommunication.count({
        where: {
          client: { orgId },
          occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      prospectClients,
      highRiskClients,
      recentCommunications,
    };
  }

  async getTopClientsByRevenue(orgId: string, limit = 10) {
    return this.prisma.client.findMany({
      where: { orgId, status: ClientStatus.ACTIVE },
      orderBy: { totalRevenue: 'desc' },
      take: limit,
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });
  }

  async getClientsRequiringAttention(orgId: string) {
    // Clients with high risk or no recent communication
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.prisma.client.findMany({
      where: {
        orgId,
        status: ClientStatus.ACTIVE,
        OR: [
          { riskLevel: RiskLevel.HIGH },
          { riskLevel: RiskLevel.CRITICAL },
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
      },
      take: 20,
    });
  }
}
