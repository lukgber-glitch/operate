import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CrmRepository } from './crm.repository';
import { CreateContactDto, UpdateContactDto } from './dto';

@Injectable()
export class ContactsService {
  constructor(private readonly crmRepository: CrmRepository) {}

  async create(clientId: string, orgId: string, dto: CreateContactDto) {
    // Verify client exists and belongs to org
    const client = await this.crmRepository.findClientById(clientId);
    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    try {
      // If this is marked as primary, ensure no other contacts are primary
      if (dto.isPrimary) {
        const existingContacts = await this.crmRepository.findContactsByClient(clientId);
        if (existingContacts.some(c => c.isPrimary)) {
          // Unset all primary contacts first
          await this.crmRepository.setPrimaryContact(clientId, ''); // Will unset all
        }
      }

      const contact = await this.crmRepository.createContact({
        client: { connect: { id: clientId } },
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        jobTitle: dto.jobTitle,
        department: dto.department,
        isPrimary: dto.isPrimary || false,
        isBilling: dto.isBilling || false,
        isActive: true,
        notes: dto.notes,
      });

      return contact;
    } catch (error) {
      throw new BadRequestException('Failed to create contact');
    }
  }

  async findAllByClient(clientId: string, orgId: string) {
    // Verify client exists and belongs to org
    const client = await this.crmRepository.findClientById(clientId);
    if (!client || client.orgId !== orgId) {
      throw new NotFoundException('Client not found');
    }

    return this.crmRepository.findContactsByClient(clientId);
  }

  async findOne(id: string, orgId: string) {
    const contact = await this.crmRepository.findContactById(id);

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Verify client belongs to org
    if (contact.client.orgId !== orgId) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, orgId: string, dto: UpdateContactDto) {
    const contact = await this.findOne(id, orgId);

    try {
      // If setting this contact as primary, unset others
      if (dto.isPrimary && !contact.isPrimary) {
        await this.crmRepository.setPrimaryContact(contact.clientId, id);
      }

      return await this.crmRepository.updateContact(id, dto);
    } catch (error) {
      throw new BadRequestException('Failed to update contact');
    }
  }

  async remove(id: string, orgId: string) {
    const contact = await this.findOne(id, orgId);

    // Don't allow removing the primary contact if there are other contacts
    if (contact.isPrimary) {
      const allContacts = await this.crmRepository.findContactsByClient(contact.clientId);
      if (allContacts.length > 1) {
        throw new BadRequestException(
          'Cannot remove primary contact. Set another contact as primary first.'
        );
      }
    }

    try {
      return await this.crmRepository.deleteContact(id);
    } catch (error) {
      throw new BadRequestException('Failed to remove contact');
    }
  }

  async setPrimary(id: string, orgId: string) {
    const contact = await this.findOne(id, orgId);

    if (contact.isPrimary) {
      return contact; // Already primary
    }

    try {
      return await this.crmRepository.setPrimaryContact(contact.clientId, id);
    } catch (error) {
      throw new BadRequestException('Failed to set primary contact');
    }
  }
}
