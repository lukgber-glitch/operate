import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CrmRepository } from './crm.repository';
import { CreateClientDto, UpdateClientDto, ClientFiltersDto } from './dto';
import { ClientStatus, ClientType, RiskLevel } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly crmRepository: CrmRepository) {}

  async create(orgId: string, dto: CreateClientDto) {
    try {
      // Check for duplicate email within organization
      if (dto.email) {
        const existing = await this.crmRepository.findClients({
          orgId,
          search: dto.email,
        });

        if (existing.clients.some(c => c.email === dto.email)) {
          throw new ConflictException('Client with this email already exists');
        }
      }

      const client = await this.crmRepository.createClient({
        orgId: orgId,
        type: dto.type,
        status: ClientStatus.ACTIVE,
        name: dto.name,
        displayName: dto.displayName,
        companyName: dto.companyName,
        vatId: dto.vatId,
        taxId: dto.taxId,
        registrationNumber: dto.registrationNumber,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        street: dto.street,
        city: dto.city,
        postalCode: dto.postalCode,
        state: dto.state,
        countryCode: dto.countryCode,
        billingStreet: dto.billingStreet,
        billingCity: dto.billingCity,
        billingPostalCode: dto.billingPostalCode,
        billingState: dto.billingState,
        billingCountryCode: dto.billingCountryCode,
        currency: dto.currency || 'EUR',
        paymentTerms: dto.paymentTerms || 30,
        creditLimit: dto.creditLimit,
        riskLevel: RiskLevel.LOW,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        tags: dto.tags || [],
        metadata: dto.metadata,
        source: dto.source || 'manual',
      });

      return client;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create client');
    }
  }

  async findAll(orgId: string, filters: ClientFiltersDto) {
    const { page = 1, pageSize = 50, ...otherFilters } = filters;
    const skip = (page - 1) * pageSize;

    return this.crmRepository.findClients({
      orgId,
      ...otherFilters,
      skip,
      take: pageSize,
    });
  }

  async findOne(id: string, orgId: string) {
    const client = await this.crmRepository.findClientById(id);

    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(id: string, orgId: string, dto: UpdateClientDto) {
    const client = await this.findOne(id, orgId);

    // Check for duplicate email if changing email
    if (dto.email && dto.email !== client.email) {
      const existing = await this.crmRepository.findClients({
        orgId,
        search: dto.email,
      });

      if (existing.clients.some(c => c.email === dto.email && c.id !== id)) {
        throw new ConflictException('Client with this email already exists');
      }
    }

    try {
      return await this.crmRepository.updateClient(id, dto);
    } catch (error) {
      throw new BadRequestException('Failed to update client');
    }
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);

    try {
      return await this.crmRepository.deleteClient(id);
    } catch (error) {
      throw new BadRequestException('Failed to archive client');
    }
  }

  async updateMetrics(clientId: string, orgId: string) {
    await this.findOne(clientId, orgId);

    try {
      return await this.crmRepository.updateClientMetrics(clientId);
    } catch (error) {
      throw new BadRequestException('Failed to update client metrics');
    }
  }

  async getStats(orgId: string) {
    return this.crmRepository.getClientStats(orgId);
  }

  async getTopByRevenue(orgId: string, limit = 10) {
    return this.crmRepository.getTopClientsByRevenue(orgId, limit);
  }

  async getRequiringAttention(orgId: string) {
    return this.crmRepository.getClientsRequiringAttention(orgId);
  }

  async assessRisk(clientId: string, orgId: string): Promise<{ riskLevel: RiskLevel; riskScore: number }> {
    const client = await this.findOne(clientId, orgId);

    // Simple risk assessment algorithm
    let riskScore = 0;

    // Payment history factors
    if (client.averagePaymentDays) {
      if (client.averagePaymentDays.toNumber() > 60) riskScore += 30;
      else if (client.averagePaymentDays.toNumber() > 30) riskScore += 15;
      else if (client.averagePaymentDays.toNumber() < 0) riskScore -= 10; // Early payment
    }

    // Invoice count vs paid count ratio
    if (client.totalInvoices > 0) {
      const paymentRatio = client.totalPaidInvoices / client.totalInvoices;
      if (paymentRatio < 0.5) riskScore += 40;
      else if (paymentRatio < 0.8) riskScore += 20;
    }

    // Recent activity
    const daysSinceLastPayment = client.lastPaymentDate
      ? Math.floor((Date.now() - new Date(client.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceLastPayment) {
      if (daysSinceLastPayment > 90) riskScore += 25;
      else if (daysSinceLastPayment > 60) riskScore += 15;
    }

    // Determine risk level based on score
    let riskLevel: RiskLevel;
    if (riskScore >= 70) riskLevel = RiskLevel.CRITICAL;
    else if (riskScore >= 50) riskLevel = RiskLevel.HIGH;
    else if (riskScore >= 30) riskLevel = RiskLevel.MEDIUM;
    else riskLevel = RiskLevel.LOW;

    // Update client with new risk assessment
    await this.crmRepository.updateClient(clientId, {
      riskLevel,
      riskScore,
      lastRiskAssessment: new Date(),
    });

    return { riskLevel, riskScore };
  }
}
