/**
 * AR Aging Service
 * Generates Accounts Receivable aging reports with standard aging buckets
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { differenceInDays } from 'date-fns';
import {
  AgingBucket,
  InvoiceAgingItem,
  ArAgingSummary,
  CustomerAgingBreakdown,
  AgingReportFilters,
} from '../aging/types/aging-report.types';

export interface ArAgingReport {
  organizationId: string;
  generatedAt: Date;
  asOfDate: Date;
  currency: string;

  summary: ArAgingSummary;
  buckets: AgingBucket[];
  byCustomer: CustomerAgingBreakdown[];
}

@Injectable()
export class ArAgingService {
  private readonly logger = new Logger(ArAgingService.name);

  private readonly AGING_BUCKETS = [
    { label: 'Current', minDays: -Infinity, maxDays: 0 },
    { label: '1-30 Days', minDays: 1, maxDays: 30 },
    { label: '31-60 Days', minDays: 31, maxDays: 60 },
    { label: '61-90 Days', minDays: 61, maxDays: 90 },
    { label: '90+ Days', minDays: 91, maxDays: null },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Generate AR Aging Report
   */
  async generateReport(
    organizationId: string,
    filters?: AgingReportFilters,
  ): Promise<ArAgingReport> {
    this.logger.log(`Generating AR Aging Report for org ${organizationId}`);

    const asOfDate = filters?.asOfDate || new Date();
    const currency = filters?.currency || 'EUR';

    // Build query filters
    const whereClause: any = {
      orgId: organizationId,
      status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
    };

    if (filters?.customerId) {
      whereClause.customerId = filters.customerId;
    }

    // Get all unpaid/partially paid invoices
    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
    });

    this.logger.debug(`Found ${invoices.length} invoices to process`);

    // Initialize buckets
    const buckets: AgingBucket[] = this.AGING_BUCKETS.map(bucket => ({
      ...bucket,
      invoices: [] as InvoiceAgingItem[],
      total: 0,
      count: 0,
    }));

    const customerTotals = new Map<string, CustomerAgingBreakdown>();

    // Process each invoice
    for (const invoice of invoices) {
      const daysOverdue = differenceInDays(asOfDate, invoice.dueDate);

      // Calculate amount due (total - paid)
      const totalAmount = invoice.totalAmount?.toNumber() || 0;
      const paidAmount = (invoice as any).paidAmount?.toNumber() || 0;
      const amountDue = totalAmount - paidAmount;

      // Skip if below minimum amount filter
      if (filters?.minAmount && amountDue < filters.minAmount) {
        continue;
      }

      const item: InvoiceAgingItem = {
        id: invoice.id,
        invoiceNumber: invoice.number,
        customerId: invoice.customerId || 'unknown',
        customerName: invoice.customerName || 'Unknown Customer',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: totalAmount,
        amountDue,
        daysOverdue: Math.max(0, daysOverdue),
        status: invoice.status,
      };

      // Find appropriate bucket
      for (const bucket of buckets) {
        if (
          daysOverdue >= bucket.minDays &&
          (bucket.maxDays === null || daysOverdue <= bucket.maxDays)
        ) {
          bucket.invoices.push(item);
          bucket.total += amountDue;
          bucket.count++;
          break;
        }
      }

      // Aggregate by customer
      const customerId = invoice.customerId || 'unknown';
      if (!customerTotals.has(customerId)) {
        customerTotals.set(customerId, {
          customerId,
          customerName: invoice.customerName || 'Unknown Customer',
          total: 0,
          current: 0,
          overdue30: 0,
          overdue60: 0,
          overdue90: 0,
          overdue90Plus: 0,
        });
      }

      const customer = customerTotals.get(customerId)!;
      customer.total += amountDue;

      if (daysOverdue <= 0) customer.current += amountDue;
      else if (daysOverdue <= 30) customer.overdue30 += amountDue;
      else if (daysOverdue <= 60) customer.overdue60 += amountDue;
      else if (daysOverdue <= 90) customer.overdue90 += amountDue;
      else customer.overdue90Plus += amountDue;
    }

    // Calculate summary
    const totalReceivables = buckets.reduce((sum, b) => sum + b.total, 0);
    const totalOverdue = buckets
      .filter(b => b.minDays > 0)
      .reduce((sum, b) => sum + b.total, 0);

    const summary: ArAgingSummary = {
      totalReceivables,
      totalOverdue,
      overduePercentage: totalReceivables > 0 ? (totalOverdue / totalReceivables) * 100 : 0,
      customerCount: customerTotals.size,
      invoiceCount: invoices.length,
    };

    this.logger.log(`AR Aging Report generated: ${totalReceivables} total receivables, ${totalOverdue} overdue`);

    return {
      organizationId,
      generatedAt: new Date(),
      asOfDate,
      currency,
      summary,
      buckets,
      byCustomer: Array.from(customerTotals.values())
        .sort((a, b) => b.total - a.total),
    };
  }

  /**
   * Export AR Aging Report to CSV
   */
  async exportToCsv(
    organizationId: string,
    filters?: AgingReportFilters,
  ): Promise<string> {
    const report = await this.generateReport(organizationId, filters);

    let csv = 'Customer,Invoice Number,Issue Date,Due Date,Amount,Amount Due,Days Overdue,Bucket,Status\n';

    for (const bucket of report.buckets) {
      for (const inv of bucket.invoices as InvoiceAgingItem[]) {
        csv += `"${inv.customerName}","${inv.invoiceNumber}","${inv.issueDate.toISOString().split('T')[0]}","${inv.dueDate.toISOString().split('T')[0]}",${inv.amount},${inv.amountDue},${inv.daysOverdue},"${bucket.label}","${inv.status}"\n`;
      }
    }

    return csv;
  }

  /**
   * Export AR Aging Report to PDF
   */
  async exportToPdf(
    organizationId: string,
    filters?: AgingReportFilters,
  ): Promise<Buffer> {
    const report = await this.generateReport(organizationId, filters);

    // Get organization details
    const org = await this.prisma.organisation.findUnique({
      where: { id: organizationId },
    });

    // Use PDFKit to generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Accounts Receivable Aging Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`${org?.name || 'Organization'}`, { align: 'center' });
    doc.fontSize(10).text(`As of: ${report.asOfDate.toISOString().split('T')[0]}`, { align: 'center' });
    doc.text(`Generated: ${report.generatedAt.toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Total Receivables: ${report.currency} ${report.summary.totalReceivables.toFixed(2)}`);
    doc.text(`Total Overdue: ${report.currency} ${report.summary.totalOverdue.toFixed(2)}`);
    doc.text(`Overdue Percentage: ${report.summary.overduePercentage.toFixed(2)}%`);
    doc.text(`Number of Customers: ${report.summary.customerCount}`);
    doc.text(`Number of Invoices: ${report.summary.invoiceCount}`);
    doc.moveDown(2);

    // Aging Buckets
    doc.fontSize(14).text('Aging Buckets', { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    for (const bucket of report.buckets) {
      doc.text(`${bucket.label}: ${report.currency} ${bucket.total.toFixed(2)} (${bucket.count} invoices)`);
    }
    doc.moveDown(2);

    // By Customer Breakdown
    doc.fontSize(14).text('By Customer', { underline: true });
    doc.moveDown();
    doc.fontSize(9);

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 280;
    const col4 = 340;
    const col5 = 400;
    const col6 = 460;

    doc.text('Customer', col1, tableTop);
    doc.text('Total', col2, tableTop);
    doc.text('Current', col3, tableTop);
    doc.text('1-30', col4, tableTop);
    doc.text('31-60', col5, tableTop);
    doc.text('61-90', col6, tableTop);
    doc.text('90+', col6 + 60, tableTop);

    doc.moveDown();
    let y = doc.y;

    for (const customer of report.byCustomer.slice(0, 20)) { // Limit to first 20
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(customer.customerName.substring(0, 25), col1, y);
      doc.text(customer.total.toFixed(2), col2, y);
      doc.text(customer.current.toFixed(2), col3, y);
      doc.text(customer.overdue30.toFixed(2), col4, y);
      doc.text(customer.overdue60.toFixed(2), col5, y);
      doc.text(customer.overdue90.toFixed(2), col6, y);
      doc.text(customer.overdue90Plus.toFixed(2), col6 + 60, y);

      y += 15;
      doc.y = y;
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}
