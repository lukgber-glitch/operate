import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import {
  PayrollSummaryReport,
  PayrollPeriodSummary,
  PayrollTotals,
  ReportMetadata,
  PayrollReportType,
  ReportFormat,
} from '../types/payroll-report.types';

/**
 * Payroll Summary Report Generator
 * Generates summary reports showing totals for each pay period
 */
@Injectable()
export class PayrollSummaryGenerator {
  private readonly logger = new Logger(PayrollSummaryGenerator.name);

  /**
   * Generate PDF report
   */
  generatePDF(report: PayrollSummaryReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, report.metadata);
        doc.moveDown(2);

        // Summary Table
        this.addSummaryTable(doc, report.summary);
        doc.moveDown(2);

        // Totals
        this.addTotalsSection(doc, report.totals);
        doc.moveDown(2);

        // Footer
        this.addFooter(doc, report.metadata);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report data
   */
  generateExcelData(report: PayrollSummaryReport): any {
    const data = {
      sheetName: 'Payroll Summary',
      columns: [
        { header: 'Pay Period Start', key: 'payPeriodStart', width: 15 },
        { header: 'Pay Period End', key: 'payPeriodEnd', width: 15 },
        { header: 'Check Date', key: 'checkDate', width: 15 },
        { header: 'Employees', key: 'employeeCount', width: 12 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
        { header: 'Employee Taxes', key: 'employeeTaxes', width: 15 },
        { header: 'Employer Taxes', key: 'employerTaxes', width: 15 },
        { header: 'Deductions', key: 'employeeDeductions', width: 15 },
        { header: 'Contributions', key: 'employerContributions', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      rows: report.summary.map((period) => ({
        payPeriodStart: period.payPeriodStart,
        payPeriodEnd: period.payPeriodEnd,
        checkDate: period.checkDate,
        employeeCount: period.employeeCount,
        grossPay: this.formatCurrency(period.grossPay),
        netPay: this.formatCurrency(period.netPay),
        employeeTaxes: this.formatCurrency(period.employeeTaxes),
        employerTaxes: this.formatCurrency(period.employerTaxes),
        employeeDeductions: this.formatCurrency(period.employeeDeductions),
        employerContributions: this.formatCurrency(period.employerContributions),
        status: period.status,
      })),
      totals: {
        label: 'TOTALS',
        totalGrossPay: this.formatCurrency(report.totals.totalGrossPay),
        totalNetPay: this.formatCurrency(report.totals.totalNetPay),
        totalEmployeeTaxes: this.formatCurrency(report.totals.totalEmployeeTaxes),
        totalEmployerTaxes: this.formatCurrency(report.totals.totalEmployerTaxes),
        totalEmployeeDeductions: this.formatCurrency(report.totals.totalEmployeeDeductions),
        totalEmployerContributions: this.formatCurrency(report.totals.totalEmployerContributions),
      },
    };

    return data;
  }

  // ==================== PDF Helper Methods ====================

  private addHeader(doc: PDFKit.PDFDocument, metadata: ReportMetadata): void {
    // Company name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(metadata.companyName, { align: 'center' });

    doc.moveDown(0.5);

    // Report title
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Payroll Summary Report', { align: 'center' });

    doc.moveDown(0.5);

    // Date range
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        `Period: ${metadata.dateRange.start} to ${metadata.dateRange.end}`,
        { align: 'center' }
      );

    // Report metadata
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Generated: ${metadata.generatedAt.toLocaleDateString()} ${metadata.generatedAt.toLocaleTimeString()}`,
        { align: 'center' }
      );

    // Draw line
    doc
      .moveTo(50, doc.y + 10)
      .lineTo(doc.page.width - 50, doc.y + 10)
      .stroke();
  }

  private addSummaryTable(
    doc: PDFKit.PDFDocument,
    summary: PayrollPeriodSummary[]
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Pay Period Summaries');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemHeight = 20;
    let currentY = tableTop;

    // Table headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Period', 50, currentY, { width: 70 });
    doc.text('Check Date', 130, currentY, { width: 70 });
    doc.text('Employees', 210, currentY, { width: 50, align: 'right' });
    doc.text('Gross Pay', 270, currentY, { width: 70, align: 'right' });
    doc.text('Net Pay', 350, currentY, { width: 70, align: 'right' });
    doc.text('Taxes', 430, currentY, { width: 60, align: 'right' });
    doc.text('Status', 500, currentY, { width: 60 });

    currentY += itemHeight;

    // Draw header line
    doc
      .moveTo(50, currentY)
      .lineTo(doc.page.width - 50, currentY)
      .stroke();

    currentY += 5;

    // Table rows
    doc.fontSize(8).font('Helvetica');
    for (const period of summary) {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      const periodText = `${period.payPeriodStart.substring(5)} - ${period.payPeriodEnd.substring(5)}`;
      doc.text(periodText, 50, currentY, { width: 70 });
      doc.text(period.checkDate, 130, currentY, { width: 70 });
      doc.text(period.employeeCount.toString(), 210, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(period.grossPay), 270, currentY, {
        width: 70,
        align: 'right',
      });
      doc.text(this.formatCurrency(period.netPay), 350, currentY, {
        width: 70,
        align: 'right',
      });
      const totalTaxes = period.employeeTaxes + period.employerTaxes;
      doc.text(this.formatCurrency(totalTaxes), 430, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(period.status, 500, currentY, { width: 60 });

      currentY += itemHeight;
    }

    doc.y = currentY;
  }

  private addTotalsSection(
    doc: PDFKit.PDFDocument,
    totals: PayrollTotals
  ): void {
    const startY = doc.y;

    // Draw box around totals
    doc.rect(350, startY, 200, 140).stroke();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTALS', 360, startY + 10);

    doc.fontSize(10).font('Helvetica');
    let y = startY + 30;

    doc.text('Total Payrolls:', 360, y);
    doc.text(totals.totalPayrollCount.toString(), 480, y, { align: 'right' });
    y += 15;

    doc.text('Total Gross Pay:', 360, y);
    doc.text(this.formatCurrency(totals.totalGrossPay), 480, y, {
      align: 'right',
    });
    y += 15;

    doc.text('Total Net Pay:', 360, y);
    doc.text(this.formatCurrency(totals.totalNetPay), 480, y, {
      align: 'right',
    });
    y += 15;

    doc.text('Total Taxes:', 360, y);
    const totalTaxes = totals.totalEmployeeTaxes + totals.totalEmployerTaxes;
    doc.text(this.formatCurrency(totalTaxes), 480, y, { align: 'right' });
    y += 15;

    doc.text('Total Deductions:', 360, y);
    doc.text(this.formatCurrency(totals.totalEmployeeDeductions), 480, y, {
      align: 'right',
    });
    y += 15;

    doc.text('Employer Contributions:', 360, y);
    doc.text(this.formatCurrency(totals.totalEmployerContributions), 480, y, {
      align: 'right',
    });

    doc.y = startY + 150;
  }

  private addFooter(doc: PDFKit.PDFDocument, metadata: ReportMetadata): void {
    const bottomY = doc.page.height - 50;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Report ID: ${metadata.reportId} | Generated: ${metadata.generatedAt.toISOString()}`,
        50,
        bottomY,
        { align: 'center' }
      );
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
