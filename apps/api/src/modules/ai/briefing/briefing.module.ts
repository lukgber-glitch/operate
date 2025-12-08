import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/modules/database/database.module';
import { BriefingController } from './briefing.controller';
import { BriefingService } from './briefing.service';
import { ClaudeService } from '@/modules/chatbot/claude.service';
import { PiiMaskingService } from '@/common/services/pii-masking.service';

/**
 * Briefing Module
 * Provides AI-powered daily and weekly financial briefings
 *
 * This module is critical for the "fully automatic" vision:
 * - Proactive daily financial summaries
 * - AI-generated insights and alerts
 * - Actionable suggestions without user asking
 *
 * Features:
 * - Daily briefing with greeting, summary, alerts, suggestions
 * - Weekly briefing with week-over-week analysis
 * - Claude AI integration for natural language insights
 * - Real-time financial data aggregation
 * - Priority-based alert system
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BriefingController],
  providers: [BriefingService, ClaudeService, PiiMaskingService],
  exports: [BriefingService],
})
export class BriefingModule {}
