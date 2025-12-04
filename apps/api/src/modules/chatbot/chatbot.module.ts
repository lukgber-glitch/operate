/**
 * Chatbot Module
 * AI Assistant chatbot for Operate/CoachOS platform
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ClaudeService } from './claude.service';
import { MemoryModule } from './memory/memory.module';
import { ContextAnalyzerService } from './context-analyzer.service';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';

// Context awareness services
import { ContextService } from './context/context.service';
import { InvoiceContextProvider } from './context/providers/invoice-context.provider';
import { ExpenseContextProvider } from './context/providers/expense-context.provider';
import { TaxContextProvider } from './context/providers/tax-context.provider';
import { OrganizationContextProvider } from './context/providers/organization-context.provider';

// Action executor services
import { ActionExecutorService } from './actions/action-executor.service';
import { ActionParserService } from './actions/action-parser.service';
import { ConfirmationService } from './actions/confirmation.service';

// Action handlers
import { CreateInvoiceHandler } from './actions/handlers/create-invoice.handler';
import { CreateExpenseHandler } from './actions/handlers/create-expense.handler';
import { GenerateReportHandler } from './actions/handlers/generate-report.handler';
import { SendReminderHandler } from './actions/handlers/send-reminder.handler';
import { UpdateStatusHandler } from './actions/handlers/update-status.handler';

// Import dependent modules for action handlers
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../finance/expenses/expenses.module';
import { ReportsModule } from '../reports/reports.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Proactive suggestions
import { ProactiveSuggestionsService } from './suggestions/proactive-suggestions.service';
import { InvoiceSuggestionsGenerator } from './suggestions/generators/invoice-suggestions.generator';
import { ExpenseSuggestionsGenerator } from './suggestions/generators/expense-suggestions.generator';
import { TaxSuggestionsGenerator } from './suggestions/generators/tax-suggestions.generator';
import { HRSuggestionsGenerator } from './suggestions/generators/hr-suggestions.generator';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    MemoryModule,
    // Dependent modules for action execution
    InvoicesModule,
    ExpensesModule,
    ReportsModule,
    NotificationsModule,
    // Rate limiting: 50 messages per hour per user
    ThrottlerModule.forRoot([
      {
        name: 'chatbot',
        ttl: 3600000, // 1 hour in milliseconds
        limit: 50,
      },
    ]),
  ],
  controllers: [ChatController, SuggestionsController],
  providers: [
    // Core chat services
    ChatService,
    ClaudeService,
    ContextAnalyzerService,
    SuggestionsService,

    // Context awareness
    ContextService,
    InvoiceContextProvider,
    ExpenseContextProvider,
    TaxContextProvider,
    OrganizationContextProvider,

    // Action executor services
    ActionExecutorService,
    ActionParserService,
    ConfirmationService,

    // Action handlers
    CreateInvoiceHandler,
    CreateExpenseHandler,
    GenerateReportHandler,
    SendReminderHandler,
    UpdateStatusHandler,

    // Proactive suggestions
    ProactiveSuggestionsService,
    InvoiceSuggestionsGenerator,
    ExpenseSuggestionsGenerator,
    TaxSuggestionsGenerator,
    HRSuggestionsGenerator,
  ],
  exports: [
    ChatService,
    ClaudeService,
    SuggestionsService,
    ActionExecutorService,
    ContextService,
    ProactiveSuggestionsService,
  ],
})
export class ChatbotModule {}
