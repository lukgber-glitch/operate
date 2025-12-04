import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { CrmRepository } from './crm.repository';

/**
 * CRM Module
 *
 * Manages customer relationship management including:
 * - Client management (CRUD, search, filters, bulk operations)
 * - Contact management
 * - Address management
 * - Communication tracking
 * - Risk assessment
 * - Analytics and reporting
 */
@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [
    ClientController,
    ContactsController,
    CommunicationsController,
  ],
  providers: [
    ClientService,
    ContactsService,
    CommunicationsService,
    CrmRepository,
  ],
  exports: [
    ClientService,
    ContactsService,
    CommunicationsService,
    CrmRepository,
  ],
})
export class ClientModule {}
