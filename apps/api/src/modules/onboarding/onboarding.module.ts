import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { FirstAnalysisService } from './first-analysis.service';

// Import required modules for first analysis
import { ClassificationModule } from '../ai/classification/classification.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { BankSyncService } from '../finance/bank-sync/bank-sync.service';
import { TinkService } from '../integrations/tink/tink.service';
import { WebSocketModule } from '../../websocket/events.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Onboarding Module
 * Handles user and organization onboarding flow including first AI analysis
 */
@Module({
  imports: [
    DatabaseModule,
    ClassificationModule,
    ChatbotModule,
    WebSocketModule,
    ConfigModule,
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    OnboardingRepository,
    FirstAnalysisService,
    BankSyncService,
    TinkService,
  ],
  exports: [OnboardingService, OnboardingRepository, FirstAnalysisService],
})
export class OnboardingModule {}
