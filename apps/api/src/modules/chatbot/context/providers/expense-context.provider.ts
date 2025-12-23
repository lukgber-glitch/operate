/**
 * Expense Context Provider
 * Provides context about expenses
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { BaseContextProvider } from './base-context.provider';

@Injectable()
export class ExpenseContextProvider extends BaseContextProvider {
  entityType = 'expense';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected async fetchEntity(entityId: string, orgId: string): Promise<any> {
    return this.prisma.expense.findFirst({
      where: { id: entityId, orgId },
    });
  }

  getSummary(expense: any): string {
    const amount = this.formatCurrency(expense.amount, expense.currency);
    const category = this.formatCategory(expense.category);
    const date = this.formatDate(expense.date);
    const status = expense.status.toLowerCase();
    const vendor = expense.vendorName || 'Unknown vendor';

    let statusDescription = '';
    switch (expense.status) {
      case 'APPROVED':
        statusDescription = expense.approvedAt
          ? `approved on ${this.formatDate(expense.approvedAt)}`
          : 'approved';
        break;
      case 'REJECTED':
        statusDescription = 'rejected';
        if (expense.rejectionReason) {
          statusDescription += ` - ${expense.rejectionReason}`;
        }
        break;
      case 'REIMBURSED':
        statusDescription = expense.reimbursedAt
          ? `reimbursed on ${this.formatDate(expense.reimbursedAt)}`
          : 'reimbursed';
        break;
      default:
        statusDescription = status;
    }

    return `Expense of ${amount} from ${vendor} for ${category} on ${date} (${statusDescription})`;
  }

  getRelevantFields(expense: any): Record<string, any> {
    const fields: Record<string, any> = {
      description: expense.description,
      amount: parseFloat(expense.amount),
      currency: expense.currency,
      date: this.formatDate(expense.date),
      category: this.formatCategory(expense.category),
      status: expense.status,
    };

    // Vendor info
    if (expense.vendorName) {
      fields.vendorName = expense.vendorName;
    }

    if (expense.vendorVatId) {
      fields.vendorVatId = expense.vendorVatId;
    }

    // Receipt info
    if (expense.receiptUrl) {
      fields.hasReceipt = true;
      fields.receiptUrl = expense.receiptUrl;
    }

    if (expense.receiptNumber) {
      fields.receiptNumber = expense.receiptNumber;
    }

    // Tax info
    if (expense.vatAmount) {
      fields.vatAmount = parseFloat(expense.vatAmount);
      fields.vatRate = parseFloat(expense.vatRate);
      fields.netAmount = parseFloat(expense.amount) - parseFloat(expense.vatAmount);
    }

    fields.isDeductible = expense.isDeductible;

    // Payment info
    if (expense.paymentMethod) {
      fields.paymentMethod = expense.paymentMethod;
    }

    // Approval info
    if (expense.submittedBy) {
      fields.submittedBy = expense.submittedBy;
    }

    if (expense.approvedBy) {
      fields.approvedBy = expense.approvedBy;
      fields.approvedAt = this.formatDate(expense.approvedAt);
    }

    if (expense.reimbursedAt) {
      fields.reimbursedAt = this.formatDate(expense.reimbursedAt);
    }

    // Notes
    if (expense.notes) {
      fields.notes = expense.notes;
    }

    return fields;
  }

  getSuggestedActions(expense: any): string[] {
    const suggestions: string[] = [];

    switch (expense.status) {
      case 'PENDING':
        suggestions.push('Approve this expense');
        suggestions.push('Reject this expense');
        suggestions.push('Request more information');
        if (!expense.receiptUrl) {
          suggestions.push('Request receipt upload');
        }
        break;

      case 'APPROVED':
        if (!expense.reimbursedAt) {
          suggestions.push('Mark as reimbursed');
          suggestions.push('Create reimbursement payment');
        }
        suggestions.push('View approval details');
        break;

      case 'REJECTED':
        suggestions.push('View rejection reason');
        suggestions.push('Resubmit expense with corrections');
        break;

      case 'REIMBURSED':
        suggestions.push('View reimbursement details');
        suggestions.push('Download reimbursement receipt');
        break;
    }

    // Common suggestions
    if (expense.receiptUrl) {
      suggestions.push('View receipt');
    } else {
      suggestions.push('Upload receipt');
    }

    suggestions.push('Edit expense details');
    suggestions.push('Categorize expense');
    suggestions.push('Add to expense report');

    return suggestions.slice(0, 5);
  }

  protected getMetadata(expense: any): Record<string, any> {
    return {
      hasReceipt: !!expense.receiptUrl,
      isDeductible: expense.isDeductible,
      needsApproval: expense.status === 'PENDING',
      needsReimbursement: expense.status === 'APPROVED' && !expense.reimbursedAt,
      hasVAT: !!expense.vatAmount,
    };
  }

  private formatCategory(category: string): string {
    // Convert SCREAMING_SNAKE_CASE to Title Case
    return category
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
