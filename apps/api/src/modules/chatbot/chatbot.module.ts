/**
 * Chatbot Module
 * AI Assistant chatbot for Operate/CoachOS platform
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { ChatController } from './chat.controller';
import { ChatbotController } from './chatbot.controller';
import { ChatService } from './chat.service';
import { ChatbotService } from './chatbot.service';
import { ChatbotRepository } from './chatbot.repository';
import { ClaudeService } from './claude.service';
import { MemoryModule } from './memory/memory.module';
import { ContextAnalyzerService } from './context-analyzer.service';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';

// Common services
import { PiiMaskingService } from '../../common/services/pii-masking.service';

// Context awareness services
import { ContextService } from './context/context.service';
import { InvoiceContextProvider } from './context/providers/invoice-context.provider';
import { ExpenseContextProvider } from './context/providers/expense-context.provider';
import { TaxContextProvider } from './context/providers/tax-context.provider';
import { OrganizationContextProvider } from './context/providers/organization-context.provider';
import { BankContextProvider } from './context/providers/bank-context.provider';
import { BankingContextProvider } from './context/providers/banking-context.provider';

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
import { CreateBillHandler } from './actions/handlers/create-bill.handler';
import { PayBillHandler } from './actions/handlers/pay-bill.handler';
import { ListBillsHandler } from './actions/handlers/list-bills.handler';
import { BillStatusHandler } from './actions/handlers/bill-status.handler';
import { GetCashFlowHandler } from './actions/handlers/get-cash-flow.handler';
import { GetRunwayHandler } from './actions/handlers/get-runway.handler';
import { GetBurnRateHandler } from './actions/handlers/get-burn-rate.handler';
import { GetCashForecastHandler } from './actions/handlers/get-cash-forecast.handler';
import { HireEmployeeHandler } from './actions/handlers/hire-employee.handler';
import { TerminateEmployeeHandler } from './actions/handlers/terminate-employee.handler';
import { RequestLeaveHandler } from './actions/handlers/request-leave.handler';
import { ApproveLeaveHandler } from './actions/handlers/approve-leave.handler';
import { SearchDocumentsHandler } from './actions/handlers/search-documents.handler';
import { ReduceExpensesHandler } from './actions/handlers/reduce-expenses.handler';
import { TaxConsultationHandler } from './actions/handlers/tax-consultation.handler';
import { CreateCustomerHandler } from './actions/handlers/create-customer.handler';
import { GetBankBalanceHandler } from './actions/handlers/get-bank-balance.handler';
import { GetBankTransactionsHandler } from './actions/handlers/get-bank-transactions.handler';
// Quotes handlers
import { CreateQuoteHandler } from './actions/handlers/create-quote.handler';
import { SendQuoteHandler } from './actions/handlers/send-quote.handler';
import { GetQuoteStatusHandler } from './actions/handlers/get-quote-status.handler';
import { ConvertQuoteToInvoiceHandler } from './actions/handlers/convert-quote-to-invoice.handler';
// Time tracking handlers
import { StartTimerHandler } from './actions/handlers/start-timer.handler';
import { StopTimerHandler } from './actions/handlers/stop-timer.handler';
import { GetTimeSummaryHandler } from './actions/handlers/get-time-summary.handler';
import { LogTimeHandler } from './actions/handlers/log-time.handler';
// Mileage handlers
import { LogMileageHandler } from './actions/handlers/log-mileage.handler';
import { GetMileageSummaryHandler } from './actions/handlers/get-mileage-summary.handler';
// Contract handlers
import { CreateContractHandler } from './actions/handlers/create-contract.handler';
import { SendContractHandler } from './actions/handlers/send-contract.handler';
import { GetContractStatusHandler } from './actions/handlers/get-contract-status.handler';
// Health score handlers
import { GetBusinessHealthHandler } from './actions/handlers/get-business-health.handler';
import { GetHealthRecommendationsHandler } from './actions/handlers/get-health-recommendations.handler';
// Project handlers
import { CreateProjectHandler } from './actions/handlers/create-project.handler';
import { GetProjectStatusHandler } from './actions/handlers/get-project-status.handler';
// Payment initiation handlers
import { InitiatePaymentHandler } from './actions/handlers/initiate-payment.handler';

// Import dependent modules for action handlers
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../finance/expenses/expenses.module';
import { BillsModule } from '../finance/bills/bills.module';
import { ReportsModule } from '../reports/reports.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TaxCalendarModule } from '../tax/calendar/tax-calendar.module';
import { VatModule } from '../tax/vat/vat.module';
import { BankIntelligenceModule } from '../ai/bank-intelligence/bank-intelligence.module';
import { EmailIntelligenceModule } from '../ai/email-intelligence/email-intelligence.module';
import { UsageModule } from '../subscription/usage/usage.module';
import { HrModule } from '../hr/hr.module';
import { TinkModule } from '../integrations/tink/tink.module';
import { TrueLayerModule } from '../integrations/truelayer/truelayer.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { CrmModule } from '../crm/crm.module';
// New feature modules
import { QuotesModule } from '../quotes/quotes.module';
import { TimeTrackingModule } from '../time-tracking/time-tracking.module';
import { MileageModule } from '../mileage/mileage.module';
import { ContractsModule } from '../contracts/contracts.module';
import { HealthScoreModule } from '../health-score/health-score.module';

// Proactive suggestions
import { ProactiveSuggestionsService } from './suggestions/proactive-suggestions.service';
import { ProactiveScheduler } from './suggestions/proactive.scheduler';
import { InvoiceSuggestionsGenerator } from './suggestions/generators/invoice-suggestions.generator';
import { ExpenseSuggestionsGenerator } from './suggestions/generators/expense-suggestions.generator';
import { TaxSuggestionsGenerator } from './suggestions/generators/tax-suggestions.generator';
import { HRSuggestionsGenerator } from './suggestions/generators/hr-suggestions.generator';
import { BillsSuggestionsGenerator } from './suggestions/generators/bills-suggestions.generator';
import { BankReconciliationSuggestionsGenerator } from './suggestions/generators/bank-reconciliation-suggestions.generator';

// Scenario planning
import { ChatScenarioExtension } from './chat-scenario.extension';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    MemoryModule,
    // Scheduler for proactive suggestions
    ScheduleModule.forRoot(),
    // Dependent modules for action execution
    InvoicesModule,
    ExpensesModule,
    BillsModule,
    ReportsModule,
    NotificationsModule,
    TaxCalendarModule,
    VatModule,
    BankIntelligenceModule,
    EmailIntelligenceModule,
    UsageModule,
    HrModule,
    // Banking integrations for chatbot access to bank data
    TinkModule,
    // Payment integrations for chatbot payment and PIS functionality
    TrueLayerModule,
    StripeModule,
    // CRM for customer management in chatbot
    CrmModule,
    // New feature modules
    QuotesModule,
    TimeTrackingModule,
    MileageModule,
    ContractsModule,
    HealthScoreModule,
    // Rate limiting: 50 messages per hour per user
    ThrottlerModule.forRoot([
      {
        name: 'chatbot',
        ttl: 3600000, // 1 hour in milliseconds
        limit: 50,
      },
    ]),
  ],
  controllers: [ChatController, ChatbotController, SuggestionsController],
  providers: [
    // Common services
    PiiMaskingService,

    // Core chat services
    ChatService,
    ChatbotService,
    ChatbotRepository,
    ClaudeService,
    ContextAnalyzerService,
    SuggestionsService,

    // Context awareness
    ContextService,
    InvoiceContextProvider,
    ExpenseContextProvider,
    TaxContextProvider,
    OrganizationContextProvider,
    BankContextProvider,
    BankingContextProvider,

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
    CreateBillHandler,
    PayBillHandler,
    ListBillsHandler,
    BillStatusHandler,
    GetCashFlowHandler,
    GetRunwayHandler,
    GetBurnRateHandler,
    GetCashForecastHandler,
    HireEmployeeHandler,
    TerminateEmployeeHandler,
    RequestLeaveHandler,
    ApproveLeaveHandler,
    SearchDocumentsHandler,
    ReduceExpensesHandler,
    TaxConsultationHandler,
    CreateCustomerHandler,
    GetBankBalanceHandler,
    GetBankTransactionsHandler,
    // Quotes handlers
    CreateQuoteHandler,
    SendQuoteHandler,
    GetQuoteStatusHandler,
    ConvertQuoteToInvoiceHandler,
    // Time tracking handlers
    StartTimerHandler,
    StopTimerHandler,
    GetTimeSummaryHandler,
    LogTimeHandler,
    // Mileage handlers
    LogMileageHandler,
    GetMileageSummaryHandler,
    // Contract handlers
    CreateContractHandler,
    SendContractHandler,
    GetContractStatusHandler,
    // Health score handlers
    GetBusinessHealthHandler,
    GetHealthRecommendationsHandler,
    // Project handlers
    CreateProjectHandler,
    GetProjectStatusHandler,
    // Payment initiation handlers
    InitiatePaymentHandler,

    // Proactive suggestions
    ProactiveSuggestionsService,
    ProactiveScheduler,
    InvoiceSuggestionsGenerator,
    ExpenseSuggestionsGenerator,
    TaxSuggestionsGenerator,
    HRSuggestionsGenerator,
    BillsSuggestionsGenerator,
    BankReconciliationSuggestionsGenerator,

    // Scenario planning
    ChatScenarioExtension,
  ],
  exports: [
    ChatService,
    ClaudeService,
    SuggestionsService,
    ActionExecutorService,
    ContextService,
    ProactiveSuggestionsService,
    ChatScenarioExtension,
  ],
})
export class ChatbotModule {}
