/**
 * Search Index Hooks
 * Automatic indexing hooks for entity lifecycle events
 */

import { Injectable, Logger } from '@nestjs/common';
import { SearchIndexerService } from '../search-indexer.service';
import { SearchableEntityType } from '../interfaces/search-result.interface';

@Injectable()
export class SearchIndexHooks {
  private readonly logger = new Logger(SearchIndexHooks.name);

  constructor(private readonly searchIndexer: SearchIndexerService) {}

  /**
   * Hook: Invoice created or updated
   */
  async onInvoiceChange(invoice: any): Promise<void> {
    try {
      const searchableText = [
        invoice.number,
        invoice.customerName,
        invoice.totalAmount?.toString() || '',
        invoice.status,
      ]
        .filter(Boolean)
        .join(' ');

      await this.searchIndexer.indexEntity(
        SearchableEntityType.INVOICE,
        invoice.id,
        searchableText,
        {
          number: invoice.number,
          customerName: invoice.customerName,
          amount: invoice.totalAmount,
          status: invoice.status,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        },
      );

      this.logger.debug(`Auto-indexed invoice ${invoice.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-index invoice ${invoice.id}: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Invoice deleted
   */
  async onInvoiceDelete(invoiceId: string): Promise<void> {
    try {
      await this.searchIndexer.removeEntity(
        SearchableEntityType.INVOICE,
        invoiceId,
      );

      this.logger.debug(`Removed invoice ${invoiceId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove invoice ${invoiceId} from index: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Expense created or updated
   */
  async onExpenseChange(expense: any): Promise<void> {
    try {
      const searchableText = [
        expense.vendor || '',
        expense.description || '',
        expense.category || '',
        expense.amount?.toString() || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.searchIndexer.indexEntity(
        SearchableEntityType.EXPENSE,
        expense.id,
        searchableText,
        {
          vendor: expense.vendor,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
        },
      );

      this.logger.debug(`Auto-indexed expense ${expense.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-index expense ${expense.id}: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Expense deleted
   */
  async onExpenseDelete(expenseId: string): Promise<void> {
    try {
      await this.searchIndexer.removeEntity(
        SearchableEntityType.EXPENSE,
        expenseId,
      );

      this.logger.debug(`Removed expense ${expenseId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove expense ${expenseId} from index: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Client created or updated
   */
  async onClientChange(client: any): Promise<void> {
    try {
      const searchableText = [
        client.name,
        client.email || '',
        client.company || '',
        client.taxId || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.searchIndexer.indexEntity(
        SearchableEntityType.CLIENT,
        client.id,
        searchableText,
        {
          name: client.name,
          email: client.email,
          company: client.company,
          taxId: client.taxId,
        },
      );

      this.logger.debug(`Auto-indexed client ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-index client ${client.id}: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Client deleted
   */
  async onClientDelete(clientId: string): Promise<void> {
    try {
      await this.searchIndexer.removeEntity(
        SearchableEntityType.CLIENT,
        clientId,
      );

      this.logger.debug(`Removed client ${clientId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove client ${clientId} from index: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Employee created or updated
   */
  async onEmployeeChange(employee: any): Promise<void> {
    try {
      const searchableText = [
        employee.firstName,
        employee.lastName,
        employee.email || '',
        employee.department || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.searchIndexer.indexEntity(
        SearchableEntityType.EMPLOYEE,
        employee.id,
        searchableText,
        {
          firstName: employee.firstName,
          lastName: employee.lastName,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department,
        },
      );

      this.logger.debug(`Auto-indexed employee ${employee.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-index employee ${employee.id}: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Employee deleted
   */
  async onEmployeeDelete(employeeId: string): Promise<void> {
    try {
      await this.searchIndexer.removeEntity(
        SearchableEntityType.EMPLOYEE,
        employeeId,
      );

      this.logger.debug(`Removed employee ${employeeId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove employee ${employeeId} from index: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Report created or updated
   */
  async onReportChange(report: any): Promise<void> {
    try {
      const searchableText = [
        report.type || '',
        report.name || '',
        report.description || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.searchIndexer.indexEntity(
        SearchableEntityType.REPORT,
        report.id,
        searchableText,
        {
          type: report.type,
          name: report.name,
          description: report.description,
          date: report.date,
        },
      );

      this.logger.debug(`Auto-indexed report ${report.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-index report ${report.id}: ${error.message}`,
      );
    }
  }

  /**
   * Hook: Report deleted
   */
  async onReportDelete(reportId: string): Promise<void> {
    try {
      await this.searchIndexer.removeEntity(
        SearchableEntityType.REPORT,
        reportId,
      );

      this.logger.debug(`Removed report ${reportId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove report ${reportId} from index: ${error.message}`,
      );
    }
  }
}
