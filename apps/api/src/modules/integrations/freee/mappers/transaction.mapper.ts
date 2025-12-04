import { Injectable, Logger } from '@nestjs/common';
import { FreeeDeal, FreeDealDetail, FreeeWalletTxn } from '../freee.types';

/**
 * freee Transaction Mapper
 * Maps between Operate transactions and freee deals/wallet transactions
 */
@Injectable()
export class FreeeTransactionMapper {
  private readonly logger = new Logger(FreeeTransactionMapper.name);

  /**
   * Map freee deal to Operate transaction
   */
  mapDealToOperateTransaction(deal: FreeeDeal): any {
    try {
      return {
        externalId: `freee_deal_${deal.id}`,
        externalSystem: 'freee',
        type: deal.type === 'income' ? 'income' : 'expense',
        date: new Date(deal.issue_date),
        dueDate: deal.due_date ? new Date(deal.due_date) : null,
        amount: deal.amount,
        dueAmount: deal.due_amount,
        status: deal.status === 'settled' ? 'settled' : 'pending',

        // Partner/Contact
        partnerId: deal.partner_id,
        partnerCode: deal.partner_code,

        // Reference
        referenceNumber: deal.ref_number,

        // Details/Line items
        lineItems: deal.details.map((detail) => this.mapDealDetail(detail)),

        // Payments
        payments: deal.payments.map((payment) => ({
          id: payment.id,
          date: new Date(payment.date),
          amount: payment.amount,
          fromWalletableId: payment.from_walletable_id,
          fromWalletableType: payment.from_walletable_type,
          toWalletableId: payment.to_walletable_id,
          toWalletableType: payment.to_walletable_type,
        })),

        // Metadata
        metadata: {
          freeeCompanyId: deal.company_id,
          receipts: deal.receipts,
          renews: deal.renews,
        },

        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to map freee deal ${deal.id}`, error);
      throw error;
    }
  }

  /**
   * Map freee deal detail to Operate transaction line item
   */
  private mapDealDetail(detail: FreeDealDetail): any {
    return {
      id: detail.id,
      accountItemId: detail.account_item_id,
      accountItemName: detail.account_item_name,
      amount: detail.amount,
      taxAmount: detail.vat,
      taxCode: detail.tax_code,
      description: detail.description,

      // Item reference
      itemId: detail.item_id,
      itemName: detail.item_name,

      // Section (department)
      sectionId: detail.section_id,
      sectionName: detail.section_name,

      // Tags
      tags: detail.tag_ids.map((id, index) => ({
        id,
        name: detail.tag_names[index],
      })),

      // Segment tags
      segment1: detail.segment_1_tag_id ? {
        id: detail.segment_1_tag_id,
        name: detail.segment_1_tag_name,
      } : null,
      segment2: detail.segment_2_tag_id ? {
        id: detail.segment_2_tag_id,
        name: detail.segment_2_tag_name,
      } : null,
      segment3: detail.segment_3_tag_id ? {
        id: detail.segment_3_tag_id,
        name: detail.segment_3_tag_name,
      } : null,
    };
  }

  /**
   * Map Operate transaction to freee deal
   */
  mapToFreeeDeal(
    transaction: any,
    freeeCompanyId: number,
    partnerId: number,
  ): Partial<FreeeDeal> {
    try {
      const deal: any = {
        company_id: freeeCompanyId,
        partner_id: partnerId,
        type: transaction.type === 'income' ? 'income' : 'expense',
        issue_date: this.formatDate(transaction.date),
        due_date: transaction.dueDate ? this.formatDate(transaction.dueDate) : undefined,
        ref_number: transaction.referenceNumber,

        // Map line items to details
        details: transaction.lineItems?.map((item: any) => ({
          account_item_id: item.accountItemId,
          tax_code: item.taxCode,
          item_id: item.itemId,
          section_id: item.sectionId,
          tag_ids: item.tags?.map((t: any) => t.id) || [],
          segment_1_tag_id: item.segment1?.id,
          segment_2_tag_id: item.segment2?.id,
          segment_3_tag_id: item.segment3?.id,
          amount: item.amount,
          vat: item.taxAmount,
          description: item.description,
        })),
      };

      return deal;
    } catch (error) {
      this.logger.error(`Failed to map Operate transaction ${transaction.id}`, error);
      throw error;
    }
  }

  /**
   * Map freee wallet transaction to Operate bank transaction
   */
  mapWalletTxnToOperateBankTransaction(walletTxn: FreeeWalletTxn): any {
    try {
      return {
        externalId: `freee_wallet_${walletTxn.id}`,
        externalSystem: 'freee',
        date: new Date(walletTxn.date),
        amount: walletTxn.amount,
        balance: walletTxn.balance,
        type: walletTxn.entry_side === 'income' ? 'credit' : 'debit',
        description: walletTxn.description,

        // Wallet/Account reference
        walletableId: walletTxn.walletable_id,
        walletableType: walletTxn.walletable_type,

        // Status
        status: this.mapWalletTxnStatus(walletTxn.status),

        // Linked deal
        dealId: walletTxn.deal_id,

        // Metadata
        metadata: {
          freeeCompanyId: walletTxn.company_id,
          dueAmount: walletTxn.due_amount,
        },

        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to map freee wallet txn ${walletTxn.id}`, error);
      throw error;
    }
  }

  /**
   * Map wallet transaction status
   */
  private mapWalletTxnStatus(status: string): string {
    const statusMap: Record<string, string> = {
      not_registered: 'pending',
      registered: 'completed',
      ignored: 'ignored',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Map array of freee deals to Operate transactions
   */
  mapDealsToOperateTransactions(deals: FreeeDeal[]): any[] {
    return deals.map((deal) => this.mapDealToOperateTransaction(deal));
  }

  /**
   * Map array of freee wallet transactions to Operate bank transactions
   */
  mapWalletTxnsToOperateBankTransactions(walletTxns: FreeeWalletTxn[]): any[] {
    return walletTxns.map((txn) => this.mapWalletTxnToOperateBankTransaction(txn));
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * Calculate transaction totals from line items
   */
  calculateTransactionTotals(lineItems: any[]): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Group wallet transactions by account
   */
  groupByAccount(walletTxns: FreeeWalletTxn[]): Map<number, FreeeWalletTxn[]> {
    const grouped = new Map<number, FreeeWalletTxn[]>();

    for (const txn of walletTxns) {
      const existing = grouped.get(txn.walletable_id) || [];
      existing.push(txn);
      grouped.set(txn.walletable_id, existing);
    }

    return grouped;
  }

  /**
   * Calculate running balance for wallet transactions
   */
  calculateRunningBalance(walletTxns: FreeeWalletTxn[]): FreeeWalletTxn[] {
    // Sort by date
    const sorted = [...walletTxns].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    return sorted.map((txn) => {
      if (txn.entry_side === 'income') {
        runningBalance += txn.amount;
      } else {
        runningBalance -= txn.amount;
      }

      return {
        ...txn,
        balance: runningBalance,
      };
    });
  }
}
