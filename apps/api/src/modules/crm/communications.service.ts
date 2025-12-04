import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CrmRepository } from './crm.repository';
import { LogCommunicationDto, UpdateCommunicationDto, CommunicationFiltersDto } from './dto';

@Injectable()
export class CommunicationsService {
  constructor(private readonly crmRepository: CrmRepository) {}

  async create(
    clientId: string,
    orgId: string,
    userId: string,
    dto: LogCommunicationDto
  ) {
    // Verify client exists and belongs to org
    const client = await this.crmRepository.findClientById(clientId);
    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    try {
      const communication = await this.crmRepository.createCommunication({
        client: { connect: { id: clientId } },
        userId,
        type: dto.type,
        direction: dto.direction,
        subject: dto.subject,
        content: dto.content,
        summary: dto.summary,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        emailMessageId: dto.emailMessageId,
        emailThreadId: dto.emailThreadId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        metadata: dto.metadata,
      });

      return communication;
    } catch (error) {
      throw new BadRequestException('Failed to log communication');
    }
  }

  async findAllByClient(
    clientId: string,
    orgId: string,
    filters: CommunicationFiltersDto
  ) {
    // Verify client exists and belongs to org
    const client = await this.crmRepository.findClientById(clientId);
    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    const { page = 1, pageSize = 50 } = filters;
    const skip = (page - 1) * pageSize;

    return this.crmRepository.findCommunicationsByClient({
      clientId,
      skip,
      take: pageSize,
    });
  }

  async findOne(id: string, orgId: string) {
    const communication = await this.crmRepository.findCommunicationById(id);

    if (!communication) {
      throw new NotFoundException('Communication not found');
    }

    // Verify client belongs to org
    if (communication.client.orgId !== orgId) {
      throw new NotFoundException('Communication not found');
    }

    return communication;
  }

  async update(id: string, orgId: string, dto: UpdateCommunicationDto) {
    await this.findOne(id, orgId);

    try {
      const updateData: any = {
        ...dto,
      };

      if (dto.occurredAt) {
        updateData.occurredAt = new Date(dto.occurredAt);
      }

      return await this.crmRepository.updateCommunication(id, updateData);
    } catch (error) {
      throw new BadRequestException('Failed to update communication');
    }
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);

    try {
      return await this.crmRepository.deleteCommunication(id);
    } catch (error) {
      throw new BadRequestException('Failed to delete communication');
    }
  }

  async getRecentActivity(clientId: string, orgId: string, days = 30) {
    // Verify client exists and belongs to org
    const client = await this.crmRepository.findClientById(clientId);
    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.crmRepository.findCommunicationsByClient({
      clientId,
      take: 100,
    });

    // Filter by date (could be optimized with Prisma query)
    const recentComms = result.communications.filter(
      comm => new Date(comm.occurredAt) >= since
    );

    return {
      communications: recentComms,
      total: recentComms.length,
      days,
    };
  }
}
