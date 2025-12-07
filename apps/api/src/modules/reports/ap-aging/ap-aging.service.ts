/**
 * AP Aging Service
 * Generates Accounts Payable aging reports with standard aging buckets
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { differenceInDays } from 'date-fns';
import {
  AgingBucket,
  BillAgingItem,
  ApAgingSummary,
  VendorAgingBreakdown,
  AgingReportFilters,
} from '../aging/types/aging-report.types';

export interface ApAgingReport {
  organizationId: string;
  generatedAt: Date;
  asOfDate: Date;
  currency: string;

  summary: ApAgingSummary;
  buckets: AgingBucket[];
  byVendor: VendorAgingBreakdown[];
}

@Injectable()
export class ApAgingService {
  private readonly logger = new Logger(ApAgingService.name);

  private readonly AGING_BUCKETS = [
    { label: 'Current', minDays: -Infinity, maxDays: 0 },
    { label: '1-30 Days', minDays: 1, maxDays: 30 },
    { label: '31-60 Days', minDays: 31, maxDays: 60 },
    { label: '61-90 Days', minDays: 61, maxDays: 90 },
    { label: '90+ Days', minDays: 91, maxDays: null },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Generate AP Aging Report
   */
  async generateReport(
    organizationId: string,
    filters?: AgingReportFilters,
  ): Promise<ApAgingReport> {
    this.logger.log(`Generating AP Aging Report for org ${organizationId}`);

    const asOfDate = filters?.asOfDate || new Date();
    const currency = filters?.currency || 'EUR';

    // Build query filters
    const whereClause: any = {
      organisationId: organizationId,
      status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] },
    };

    if (filters?.vendorId) {
      whereClause.vendorId = filters.vendorId;
    }

    // Get all unpaid/partially paid bills
    const bills = await this.prisma.bill.findMany({
      where: whereClause,
      include: {
        vendor: true,
      },
    });

    this.logger.debug(`Found ${bills.length} bills to process`);

    // Initialize buckets
    const buckets: AgingBucket[] = this.AGING_BUCKETS.map(bucket => ({
      ...bucket,
      invoices: [] as BillAgingItem[],
      total: 0,
      count: 0,
    }));

    const vendorTotals = new Map<string, VendorAgingBreakdown>();

    // Process each bill
    for (const bill of bills) {
      const daysOverdue = differenceInDays(asOfDate, bill.dueDate);

      // Calculate amount due (total - paid)
      const totalAmount = bill.totalAmount?.toNumber() || 0;
      const paidAmount = bill.paidAmount?.toNumber() || 0;
      const amountDue = totalAmount - paidAmount;

      // Skip if below minimum amount filter
      if (filters?.minAmount && amountDue < filters.minAmount) {
        continue;
      }

      const item: BillAgingItem = {
        id: bill.id,
        billNumber: bill.billNumber || bill.reference || 'N/A',
        vendorId: bill.vendorId || 'unknown',
        vendorName: bill.vendorName || 'Unknown Vendor',
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        amount: totalAmount,
        amountDue,
        daysOverdue: Math.max(0, daysOverdue),
        status: bill.status,
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

      // Aggregate by vendor
      const vendorId = bill.vendorId || 'unknown';
      if (!vendorTotals.has(vendorId)) {
        vendorTotals.set(vendorId, {
          vendorId,
          vendorName: bill.vendorName || 'Unknown Vendor',
          total: 0,
          current: 0,
          overdue30: 0,
          overdue60: 0,
          overdue90: 0,
          overdue90Plus: 0,
        });
      }

      const vendor = vendorTotals.get(vendorId)!;
      vendor.total += amountDue;

      if (daysOverdue <= 0) vendor.current += amountDue;
      else if (daysOverdue <= 30) vendor.overdue30 += amountDue;
      else if (daysOverdue <= 60) vendor.overdue60 += amountDue;
      else if (daysOverdue <= 90) vendor.overdue90 += amountDue;
      else vendor.overdue90Plus += amountDue;
    }

    // Calculate summary
    const totalPayables = buckets.reduce((sum, b) => sum + b.total, 0);
    const totalOverdue = buckets
      .filter(b => b.minDays > 0)
      .reduce((sum, b) => sum + b.total, 0);

    const summary: ApAgingSummary = {
      totalPayables,
      totalOverdue,
      overduePercentage: totalPayables > 0 ? (totalOverdue / totalPayables) * 100 : 0,
      vendorCount: vendorTotals.size,
      billCount: bills.length,
    };

    this.logger.log(`AP Aging Report generated: ${totalPayables} total payables, ${totalOverdue} overdue`);

    return {
      organizationId,
      generatedAt: new Date(),
      asOfDate,
      currency,
      summary,
      buckets,
      byVendor: Array.from(vendorTotals.values())
        .sort((a, b) => b.total - a.total),
    };
  }

  /**
   * Export AP Aging Report to CSV
   */
  async exportToCsv(
    organizationId: string,
    filters?: AgingReportFilters,
  ): Promise<string> {
    const report = await this.generateReport(organizationId, filters);

    let csv = 'Vendor,Bill Number,Issue Date,Due Date,Amount,Amount Due,Days Overdue,Bucket,Status\n';

    for (const bucket of report.buckets) {
      for (const bill of bucket.invoices as BillAgingItem[]) {
        csv += `"${bill.vendorName}","${bill.billNumber}","${bill.issueDate.toISOString().split('T')[0]}","${bill.dueDate.toISOString().split('T')[0]}",${bill.amount},${bill.amountDue},${bill.daysOverdue},"${bucket.label}","${bill.status}"\n`;
      }
    }

    return csv;
  }

  /**
   * Export AP Aging Report to PDF
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
    doc.fontSize(20).text('Accounts Payable Aging Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`${org?.name || 'Organization'}`, { align: 'center' });
    doc.fontSize(10).text(`As of: ${report.asOfDate.toISOString().split('T')[0]}`, { align: 'center' });
    doc.text(`Generated: ${report.generatedAt.toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Total Payables: ${report.currency} ${report.summary.totalPayables.toFixed(2)}`);
    doc.text(`Total Overdue: ${report.currency} ${report.summary.totalOverdue.toFixed(2)}`);
    doc.text(`Overdue Percentage: ${report.summary.overduePercentage.toFixed(2)}%`);
    doc.text(`Number of Vendors: ${report.summary.vendorCount}`);
    doc.text(`Number of Bills: ${report.summary.billCount}`);
    doc.moveDown(2);

    // Aging Buckets
    doc.fontSize(14).text('Aging Buckets', { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    for (const bucket of report.buckets) {
      doc.text(`${bucket.label}: ${report.currency} ${bucket.total.toFixed(2)} (${bucket.count} bills)`);
    }
    doc.moveDown(2);

    // By Vendor Breakdown
    doc.fontSize(14).text('By Vendor', { underline: true });
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

    doc.text('Vendor', col1, tableTop);
    doc.text('Total', col2, tableTop);
    doc.text('Current', col3, tableTop);
    doc.text('1-30', col4, tableTop);
    doc.text('31-60', col5, tableTop);
    doc.text('61-90', col6, tableTop);
    doc.text('90+', col6 + 60, tableTop);

    doc.moveDown();
    let y = doc.y;

    for (const vendor of report.byVendor.slice(0, 20)) { // Limit to first 20
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(vendor.vendorName.substring(0, 25), col1, y);
      doc.text(vendor.total.toFixed(2), col2, y);
      doc.text(vendor.current.toFixed(2), col3, y);
      doc.text(vendor.overdue30.toFixed(2), col4, y);
      doc.text(vendor.overdue60.toFixed(2), col5, y);
      doc.text(vendor.overdue90.toFixed(2), col6, y);
      doc.text(vendor.overdue90Plus.toFixed(2), col6 + 60, y);

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
