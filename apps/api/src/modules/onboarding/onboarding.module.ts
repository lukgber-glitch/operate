import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { FirstAnalysisService } from './first-analysis.service';

// Import required modules for first analysis
import { ClassificationModule } from '../ai/classification/classification.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { BankSyncModule } from '../finance/bank-sync/bank-sync.module';
import { TinkModule } from '../integrations/tink/tink.module';
import { EventsModule } from '../../websocket/events.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EmailIntelligenceModule } from '../ai/email-intelligence/email-intelligence.module';

/**
 * Onboarding Module
 * Handles user and organization onboarding flow including first AI analysis
 */
@Module({
  imports: [
    DatabaseModule,
    ClassificationModule,
    ChatbotModule,
    BankSyncModule,
    TinkModule,
    EventsModule,
    ConfigModule,
    EmailIntelligenceModule,
    forwardRef(() => AuthModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    OnboardingRepository,
    FirstAnalysisService,
  ],
  exports: [OnboardingService, OnboardingRepository, FirstAnalysisService],
})
export class OnboardingModule {}
