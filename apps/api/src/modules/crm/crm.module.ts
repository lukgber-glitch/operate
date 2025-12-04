import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ClientsController } from './clients.controller';
import { ContactsController } from './contacts.controller';
import { CommunicationsController } from './communications.controller';
import { ClientInsightsController } from './client-insights.controller';
import { ClientsService } from './clients.service';
import { ContactsService } from './contacts.service';
import { CommunicationsService } from './communications.service';
import { ClientInsightsService } from './client-insights.service';
import { CrmRepository } from './crm.repository';
// Optional: Uncomment when BullMQ is configured
// import { BullModule } from '@nestjs/bullmq';
// import { ClientInsightsProcessor, ClientInsightsQueueService } from './client-insights.processor';

@Module({
  imports: [
    DatabaseModule,
    // Optional: Uncomment to enable background job processing
    // BullModule.registerQueue({
    //   name: 'client-insights',
    // }),
  ],
  controllers: [
    ClientsController,
    ContactsController,
    CommunicationsController,
    ClientInsightsController,
  ],
  providers: [
    ClientsService,
    ContactsService,
    CommunicationsService,
    ClientInsightsService,
    CrmRepository,
    // Optional: Uncomment when BullMQ is configured
    // ClientInsightsProcessor,
    // ClientInsightsQueueService,
  ],
  exports: [
    ClientsService,
    ContactsService,
    CommunicationsService,
    ClientInsightsService,
    // Optional: Uncomment when BullMQ is configured
    // ClientInsightsQueueService,
  ],
})
export class CrmModule {}
