import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CrmRepository } from './crm.repository';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFilterDto,
  BulkUpdateDto,
  CreateContactDto,
  CreateAddressDto,
  CreateNoteDto,
} from './dto/client.dto';
import { ClientStatus, ClientType, RiskLevel, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'client:';

  constructor(
    private readonly crmRepository: CrmRepository,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Generate unique client number for organization
   * Format: CLT-001, CLT-002, etc.
   */
  private async generateClientNumber(orgId: string): Promise<string> {
    const lastClient = await this.crmRepository.getLastClientByOrg(orgId);

    if (!lastClient || !lastClient.clientNumber) {
      return 'CLT-001';
    }

    // Extract number from CLT-XXX format
    const match = lastClient.clientNumber.match(/CLT-(\d+)/);
    if (!match) {
      return 'CLT-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `CLT-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create a new client with auto-generated client number
   */
  async create(orgId: string, dto: CreateClientDto, userId: string) {
    try {
      // Check for duplicate email within organization
      if (dto.email) {
        const existing = await this.crmRepository.findClientByEmail(orgId, dto.email);
        if (existing) {
          throw new ConflictException('Client with this email already exists');
        }
      }

      // Check for duplicate taxId/vatId if provided
      if (dto.taxId) {
        const existing = await this.crmRepository.findClientByTaxId(orgId, dto.taxId);
        if (existing) {
          throw new ConflictException('Client with this tax ID already exists');
        }
      }

      // Generate client number
      const clientNumber = await this.generateClientNumber(orgId);

      // Prepare client data
      const clientData: Prisma.ClientCreateInput = {
        clientNumber,
        organisation: { connect: { id: orgId } },
        type: dto.type || ClientType.COMPANY,
        status: ClientStatus.ACTIVE,
        name: dto.name,
        displayName: dto.displayName,
        legalName: dto.legalName,
        companyName: dto.companyName,
        vatId: dto.vatId,
        taxId: dto.taxId,
        registrationNumber: dto.registrationNumber,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        website: dto.website,
        industry: dto.industry,
        companySize: dto.companySize,
        currency: dto.currency || 'EUR',
        paymentTerms: dto.paymentTerms || 30,
        creditLimit: dto.creditLimit,
        discount: dto.discount,
        riskLevel: RiskLevel.LOW,
        riskScore: 0,
        isVip: dto.isVip || false,
        preferredLanguage: dto.preferredLanguage || 'en',
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        tags: dto.tags || [],
        metadata: dto.metadata || {},
        source: dto.source || 'manual',
        referredBy: dto.referredBy,
      };

      const client = await this.crmRepository.createClient(clientData);

      // Log audit
      this.logger.log(`Client ${client.clientNumber} created by user ${userId}`);

      // Clear cache for this org's client list
      await this.invalidateOrgCache(orgId);

      return client;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create client: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create client');
    }
  }

  /**
   * Find all clients with advanced filtering and pagination
   */
  async findAll(orgId: string, filters: ClientFilterDto) {
    const cacheKey = `${this.CACHE_PREFIX}${orgId}:list:${JSON.stringify(filters)}`;

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      page = 1,
      pageSize = 50,
      search,
      status,
      type,
      riskLevel,
      tags,
      isVip,
      cursor,
      sortBy = 'name',
      sortOrder = 'asc',
      includeContacts = false,
      includeAddresses = false,
      includeActivity = false,
    } = filters;

    // Build where clause
    const where: Prisma.ClientWhereInput = {
      orgId,
      ...(status && { status }),
      ...(type && { type }),
      ...(riskLevel && { riskLevel }),
      ...(isVip !== undefined && { isVip }),
      ...(tags && tags.length > 0 && {
        tags: {
          hasSome: tags,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { clientNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { taxId: { contains: search, mode: 'insensitive' } },
          { vatId: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build include clause
    const include: Prisma.ClientInclude = {
      ...(includeContacts && {
        contacts: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 5,
        },
      }),
      ...(includeAddresses && {
        addresses: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 5,
        },
      }),
      ...(includeActivity && {
        communications: {
          orderBy: { occurredAt: 'desc' },
          take: 5,
        },
      }),
      _count: {
        select: {
          contacts: true,
          addresses: true,
          communications: true,
          invoices: true,
          payments: true,
        },
      },
    };

    // Determine pagination method
    if (cursor) {
      // Cursor-based pagination
      const clients = await this.crmRepository.findClientsWithCursor({
        where,
        include,
        cursor: { id: cursor },
        take: pageSize + 1, // Take one extra to check if there's a next page
        orderBy: { [sortBy]: sortOrder },
      });

      const hasNextPage = clients.length > pageSize;
      const items = hasNextPage ? clients.slice(0, -1) : clients;
      const nextCursor = hasNextPage ? items[items.length - 1].id : null;

      const result = {
        clients: items,
        meta: {
          hasNextPage,
          nextCursor,
          count: items.length,
        },
      };

      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } else {
      // Offset-based pagination
      const skip = (page - 1) * pageSize;
      const [clients, total] = await Promise.all([
        this.crmRepository.findClients({
          where,
          include,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.crmRepository.countClients(where),
      ]);

      const result = {
        clients,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };

      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    }
  }

  /**
   * Find a single client by ID with all relations
   */
  async findOne(id: string, orgId: string, includeAll = true) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached && cached.orgId === orgId) {
      return cached;
    }

    const client = await this.crmRepository.findClientByIdWithRelations(id, includeAll);

    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    // Calculate computed metrics if not already done
    if (client.totalRevenue === null || client.totalInvoices === 0) {
      await this.updateMetrics(id, orgId);
      return this.findOne(id, orgId, includeAll);
    }

    await this.cacheService.set(cacheKey, client, this.CACHE_TTL);
    return client;
  }

  /**
   * Find client by client number
   */
  async findByClientNumber(orgId: string, clientNumber: string) {
    return this.crmRepository.findClientByNumber(orgId, clientNumber);
  }

  /**
   * Update client
   */
  async update(id: string, orgId: string, dto: UpdateClientDto, userId: string) {
    const client = await this.findOne(id, orgId, false);

    // Check for duplicate email if changing email
    if (dto.email && dto.email !== client.email) {
      const existing = await this.crmRepository.findClientByEmail(orgId, dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Client with this email already exists');
      }
    }

    // Check for duplicate taxId if changing taxId
    if (dto.taxId && dto.taxId !== client.taxId) {
      const existing = await this.crmRepository.findClientByTaxId(orgId, dto.taxId);
      if (existing && existing.id !== id) {
        throw new ConflictException('Client with this tax ID already exists');
      }
    }

    try {
      const updated = await this.crmRepository.updateClient(id, dto);

      // Log audit
      this.logger.log(`Client ${client.clientNumber} updated by user ${userId}`);

      // Invalidate cache
      await this.invalidateClientCache(id, orgId);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update client ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update client');
    }
  }

  /**
   * Soft delete client
   */
  async remove(id: string, orgId: string, userId: string) {
    const client = await this.findOne(id, orgId, false);

    try {
      const deleted = await this.crmRepository.softDeleteClient(id);

      // Log audit
      this.logger.log(`Client ${client.clientNumber} deleted by user ${userId}`);

      // Invalidate cache
      await this.invalidateClientCache(id, orgId);

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete client ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete client');
    }
  }

  /**
   * Bulk update clients
   */
  async bulkUpdate(orgId: string, dto: BulkUpdateDto, userId: string) {
    const { clientIds, updates } = dto;

    try {
      // Verify all clients belong to the org
      const clients = await this.crmRepository.findClientsByIds(clientIds);
      const invalidClients = clients.filter(c => c.orgId !== orgId);

      if (invalidClients.length > 0) {
        throw new BadRequestException('Some clients do not belong to this organization');
      }

      // Perform bulk update
      const result = await this.crmRepository.bulkUpdateClients(clientIds, updates);

      // Log audit
      this.logger.log(`Bulk update of ${clientIds.length} clients by user ${userId}`);

      // Invalidate cache for all affected clients
      await Promise.all([
        ...clientIds.map(id => this.cacheService.del(`${this.CACHE_PREFIX}${id}`)),
        this.invalidateOrgCache(orgId),
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Failed to bulk update clients: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to bulk update clients');
    }
  }

  /**
   * Bulk delete clients
   */
  async bulkDelete(orgId: string, clientIds: string[], userId: string) {
    try {
      // Verify all clients belong to the org
      const clients = await this.crmRepository.findClientsByIds(clientIds);
      const invalidClients = clients.filter(c => c.orgId !== orgId);

      if (invalidClients.length > 0) {
        throw new BadRequestException('Some clients do not belong to this organization');
      }

      // Perform bulk soft delete
      const result = await this.crmRepository.bulkSoftDeleteClients(clientIds);

      // Log audit
      this.logger.log(`Bulk delete of ${clientIds.length} clients by user ${userId}`);

      // Invalidate cache
      await Promise.all([
        ...clientIds.map(id => this.cacheService.del(`${this.CACHE_PREFIX}${id}`)),
        this.invalidateOrgCache(orgId),
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Failed to bulk delete clients: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to bulk delete clients');
    }
  }

  /**
   * Get client contacts
   */
  async getContacts(clientId: string, orgId: string) {
    const client = await this.findOne(clientId, orgId, false);
    return this.crmRepository.findContactsByClient(clientId);
  }

  /**
   * Add contact to client
   */
  async addContact(clientId: string, orgId: string, dto: CreateContactDto, userId: string) {
    const client = await this.findOne(clientId, orgId, false);

    try {
      const contact = await this.crmRepository.createContact({
        client: { connect: { id: clientId } },
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        position: dto.position,
        jobTitle: dto.jobTitle,
        department: dto.department,
        isPrimary: dto.isPrimary || false,
        isBilling: dto.isBilling || false,
        notes: dto.notes,
      });

      // If this is set as primary, unset others
      if (dto.isPrimary) {
        await this.crmRepository.unsetOtherPrimaryContacts(clientId, contact.id);
      }

      // Log audit
      this.logger.log(`Contact added to client ${client.clientNumber} by user ${userId}`);

      // Invalidate cache
      await this.invalidateClientCache(clientId, orgId);

      return contact;
    } catch (error) {
      this.logger.error(`Failed to add contact to client ${clientId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to add contact');
    }
  }

  /**
   * Get client addresses
   */
  async getAddresses(clientId: string, orgId: string) {
    const client = await this.findOne(clientId, orgId, false);
    return this.crmRepository.findAddressesByClient(clientId);
  }

  /**
   * Add address to client
   */
  async addAddress(clientId: string, orgId: string, dto: CreateAddressDto, userId: string) {
    const client = await this.findOne(clientId, orgId, false);

    try {
      const address = await this.crmRepository.createAddress({
        client: { connect: { id: clientId } },
        type: dto.type,
        street: dto.street,
        street2: dto.street2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        isPrimary: dto.isPrimary || false,
      });

      // If this is set as primary, unset others
      if (dto.isPrimary) {
        await this.crmRepository.unsetOtherPrimaryAddresses(clientId, address.id);
      }

      // Log audit
      this.logger.log(`Address added to client ${client.clientNumber} by user ${userId}`);

      // Invalidate cache
      await this.invalidateClientCache(clientId, orgId);

      return address;
    } catch (error) {
      this.logger.error(`Failed to add address to client ${clientId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to add address');
    }
  }

  /**
   * Get recent client activity (communications and notes)
   */
  async getActivity(clientId: string, orgId: string, limit = 20) {
    const client = await this.findOne(clientId, orgId, false);
    return this.crmRepository.findRecentActivity(clientId, limit);
  }

  /**
   * Add note to client
   */
  async addNote(clientId: string, orgId: string, dto: CreateNoteDto, userId: string) {
    const client = await this.findOne(clientId, orgId, false);

    try {
      const note = await this.crmRepository.createCommunication({
        client: { connect: { id: clientId } },
        user: { connect: { id: userId } },
        type: 'NOTE',
        direction: 'INTERNAL',
        subject: dto.subject,
        content: dto.content,
        summary: dto.summary,
        metadata: dto.metadata || {},
        occurredAt: new Date(),
      });

      // Log audit
      this.logger.log(`Note added to client ${client.clientNumber} by user ${userId}`);

      // Invalidate cache
      await this.invalidateClientCache(clientId, orgId);

      return note;
    } catch (error) {
      this.logger.error(`Failed to add note to client ${clientId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to add note');
    }
  }

  /**
   * Update client metrics (revenue, invoices, payments, etc.)
   */
  async updateMetrics(clientId: string, orgId: string) {
    const client = await this.findOne(clientId, orgId, false);

    try {
      const updated = await this.crmRepository.updateClientMetrics(clientId);

      // Invalidate cache
      await this.invalidateClientCache(clientId, orgId);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update client metrics ${clientId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update client metrics');
    }
  }

  /**
   * Assess client risk level
   */
  async assessRisk(clientId: string, orgId: string): Promise<{ riskLevel: RiskLevel; riskScore: number }> {
    const client = await this.findOne(clientId, orgId, false);

    // Calculate risk score based on various factors
    let riskScore = 0;

    // Payment history factors
    if (client.averagePaymentDays) {
      const avgDays = Number(client.averagePaymentDays);
      if (avgDays > 60) riskScore += 30;
      else if (avgDays > 30) riskScore += 15;
      else if (avgDays < 0) riskScore -= 10; // Early payment bonus
    }

    // Invoice payment ratio
    if (client.totalInvoices > 0) {
      const paymentRatio = client.totalPaidInvoices / client.totalInvoices;
      if (paymentRatio < 0.5) riskScore += 40;
      else if (paymentRatio < 0.8) riskScore += 20;
      else if (paymentRatio > 0.95) riskScore -= 5; // Good payment history
    }

    // Outstanding balance
    if (client.outstandingBalance && Number(client.outstandingBalance) > 0) {
      const balance = Number(client.outstandingBalance);
      const creditLimit = client.creditLimit ? Number(client.creditLimit) : 0;

      if (creditLimit > 0) {
        const utilizationRatio = balance / creditLimit;
        if (utilizationRatio > 0.9) riskScore += 25;
        else if (utilizationRatio > 0.7) riskScore += 15;
      } else if (balance > 10000) {
        riskScore += 20; // High balance without credit limit
      }
    }

    // Recent activity
    const daysSinceLastPayment = client.lastPaymentDate
      ? Math.floor((Date.now() - new Date(client.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceLastPayment) {
      if (daysSinceLastPayment > 90) riskScore += 25;
      else if (daysSinceLastPayment > 60) riskScore += 15;
    } else if (client.totalInvoices > 3) {
      riskScore += 20; // Has invoices but never paid
    }

    // Communication frequency (less communication = higher risk for active clients)
    const communications = await this.crmRepository.countRecentCommunications(clientId, 30);
    if (client.status === ClientStatus.ACTIVE && communications === 0) {
      riskScore += 10;
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 70) riskLevel = 'CRITICAL' as RiskLevel;
    else if (riskScore >= 50) riskLevel = 'HIGH' as RiskLevel;
    else if (riskScore >= 30) riskLevel = 'MEDIUM' as RiskLevel;
    else riskLevel = 'LOW' as RiskLevel;

    // Update client
    await this.crmRepository.updateClient(clientId, {
      riskLevel,
      riskScore,
      lastRiskAssessment: new Date(),
    });

    // Invalidate cache
    await this.invalidateClientCache(clientId, orgId);

    return { riskLevel, riskScore };
  }

  /**
   * Get client statistics for organization
   */
  async getStats(orgId: string) {
    const cacheKey = `${this.CACHE_PREFIX}${orgId}:stats`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.crmRepository.getClientStats(orgId);

    await this.cacheService.set(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  /**
   * Get top clients by revenue
   */
  async getTopByRevenue(orgId: string, limit = 10) {
    return this.crmRepository.getTopClientsByRevenue(orgId, limit);
  }

  /**
   * Get clients requiring attention
   */
  async getRequiringAttention(orgId: string) {
    return this.crmRepository.getClientsRequiringAttention(orgId);
  }

  /**
   * Search clients across multiple fields
   */
  async search(orgId: string, query: string, limit = 20) {
    return this.crmRepository.searchClients(orgId, query, limit);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async invalidateClientCache(clientId: string, orgId: string) {
    await Promise.all([
      this.cacheService.del(`${this.CACHE_PREFIX}${clientId}`),
      this.invalidateOrgCache(orgId),
    ]);
  }

  private async invalidateOrgCache(orgId: string) {
    // Delete all list caches for this org (pattern-based deletion)
    const pattern = `${this.CACHE_PREFIX}${orgId}:*`;
    await this.cacheService.delPattern(pattern);
  }
}
