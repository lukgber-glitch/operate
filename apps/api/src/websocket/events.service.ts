import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import {
  WebSocketEvent,
  WebSocketPayload,
  InvoiceEvent,
  InvoiceEventPayload,
  ExpenseEvent,
  ExpenseEventPayload,
  BankEvent,
  BankEventPayload,
  NotificationEvent,
  NotificationEventPayload,
  DocumentEvent,
  DocumentEventPayload,
  HrEvent,
  HrEventPayload,
  TaxEvent,
  TaxEventPayload,
  IntegrationEvent,
  IntegrationEventPayload,
} from '@operate/shared';

/**
 * Events Service
 * Provides convenient methods for emitting WebSocket events throughout the application
 *
 * Usage in other modules:
 *
 * @example
 * constructor(private eventsService: EventsService) {}
 *
 * async createInvoice(data: CreateInvoiceDto) {
 *   const invoice = await this.invoiceRepo.create(data);
 *
 *   // Emit real-time event
 *   this.eventsService.emitInvoiceCreated({
 *     organizationId: invoice.organizationId,
 *     invoiceId: invoice.id,
 *     invoiceNumber: invoice.number,
 *     amount: invoice.total,
 *     currency: invoice.currency,
 *   });
 *
 *   return invoice;
 * }
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private eventsGateway: EventsGateway) {}

  /**
   * Generic method to emit any event
   */
  emit(
    event: WebSocketEvent,
    payload: WebSocketPayload,
    target?: { organizationId?: string; userId?: string },
  ) {
    try {
      if (target?.userId) {
        this.eventsGateway.emitToUser(target.userId, event, payload);
      } else if (target?.organizationId) {
        this.eventsGateway.emitToOrganization(
          target.organizationId,
          event,
          payload,
        );
      } else if (payload.organizationId) {
        this.eventsGateway.emitToOrganization(
          payload.organizationId,
          event,
          payload,
        );
      } else {
        this.logger.warn(`Event ${event} emitted without target or organizationId`);
      }
    } catch (error) {
      this.logger.error(`Error emitting event ${event}:`, error);
    }
  }

  // ==================== Invoice Events ====================

  emitInvoiceCreated(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.CREATED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitInvoiceUpdated(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.UPDATED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitInvoicePaid(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.PAID, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitInvoiceCancelled(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.CANCELLED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitInvoiceSent(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.SENT, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitInvoiceOverdue(payload: Omit<InvoiceEventPayload, 'timestamp'>) {
    this.emit(InvoiceEvent.OVERDUE, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Expense Events ====================

  emitExpenseCreated(payload: Omit<ExpenseEventPayload, 'timestamp'>) {
    this.emit(ExpenseEvent.CREATED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitExpenseUpdated(payload: Omit<ExpenseEventPayload, 'timestamp'>) {
    this.emit(ExpenseEvent.UPDATED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitExpenseApproved(payload: Omit<ExpenseEventPayload, 'timestamp'>) {
    this.emit(ExpenseEvent.APPROVED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitExpenseRejected(payload: Omit<ExpenseEventPayload, 'timestamp'>) {
    this.emit(ExpenseEvent.REJECTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Bank Events ====================

  emitBankTransactionImported(payload: Omit<BankEventPayload, 'timestamp'>) {
    this.emit(BankEvent.TRANSACTION_IMPORTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitBankTransactionsSynced(payload: Omit<BankEventPayload, 'timestamp'>) {
    this.emit(BankEvent.TRANSACTIONS_SYNCED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitBankAccountConnected(payload: Omit<BankEventPayload, 'timestamp'>) {
    this.emit(BankEvent.ACCOUNT_CONNECTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitBankSyncError(payload: Omit<BankEventPayload, 'timestamp'>) {
    this.emit(BankEvent.SYNC_ERROR, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Notification Events ====================

  emitNotification(
    payload: Omit<NotificationEventPayload, 'timestamp'>,
    userId?: string,
  ) {
    this.emit(
      NotificationEvent.NEW,
      {
        ...payload,
        timestamp: new Date(),
      },
      userId ? { userId } : undefined,
    );
  }

  emitNotificationRead(payload: Omit<NotificationEventPayload, 'timestamp'>) {
    this.emit(NotificationEvent.READ, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Document Events ====================

  emitDocumentUploaded(payload: Omit<DocumentEventPayload, 'timestamp'>) {
    this.emit(DocumentEvent.UPLOADED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitDocumentProcessed(payload: Omit<DocumentEventPayload, 'timestamp'>) {
    this.emit(DocumentEvent.PROCESSED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitDocumentClassified(payload: Omit<DocumentEventPayload, 'timestamp'>) {
    this.emit(DocumentEvent.CLASSIFICATION_COMPLETE, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitDocumentOcrComplete(payload: Omit<DocumentEventPayload, 'timestamp'>) {
    this.emit(DocumentEvent.OCR_COMPLETE, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitDocumentError(payload: Omit<DocumentEventPayload, 'timestamp'>) {
    this.emit(DocumentEvent.ERROR, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== HR Events ====================

  emitEmployeeAdded(payload: Omit<HrEventPayload, 'timestamp'>) {
    this.emit(HrEvent.EMPLOYEE_ADDED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitLeaveRequested(payload: Omit<HrEventPayload, 'timestamp'>) {
    this.emit(HrEvent.LEAVE_REQUESTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitLeaveApproved(payload: Omit<HrEventPayload, 'timestamp'>) {
    this.emit(HrEvent.LEAVE_APPROVED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitLeaveRejected(payload: Omit<HrEventPayload, 'timestamp'>) {
    this.emit(HrEvent.LEAVE_REJECTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Tax Events ====================

  emitTaxReturnSubmitted(payload: Omit<TaxEventPayload, 'timestamp'>) {
    this.emit(TaxEvent.RETURN_SUBMITTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitTaxReturnAccepted(payload: Omit<TaxEventPayload, 'timestamp'>) {
    this.emit(TaxEvent.RETURN_ACCEPTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitTaxReturnRejected(payload: Omit<TaxEventPayload, 'timestamp'>) {
    this.emit(TaxEvent.RETURN_REJECTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  // ==================== Integration Events ====================

  emitIntegrationSyncStarted(
    payload: Omit<IntegrationEventPayload, 'timestamp'>,
  ) {
    this.emit(IntegrationEvent.SYNC_STARTED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitIntegrationSyncCompleted(
    payload: Omit<IntegrationEventPayload, 'timestamp'>,
  ) {
    this.emit(IntegrationEvent.SYNC_COMPLETED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitIntegrationSyncFailed(
    payload: Omit<IntegrationEventPayload, 'timestamp'>,
  ) {
    this.emit(IntegrationEvent.SYNC_FAILED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitIntegrationConnected(
    payload: Omit<IntegrationEventPayload, 'timestamp'>,
  ) {
    this.emit(IntegrationEvent.CONNECTION_ESTABLISHED, {
      ...payload,
      timestamp: new Date(),
    });
  }

  emitIntegrationDisconnected(
    payload: Omit<IntegrationEventPayload, 'timestamp'>,
  ) {
    this.emit(IntegrationEvent.CONNECTION_LOST, {
      ...payload,
      timestamp: new Date(),
    });
  }
}
