import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import {
  EmployeeEarningsReport,
  EmployeeEarningsDetail,
} from '../types/payroll-report.types';

/**
 * Employee Earnings Report Generator
 * Generates detailed earnings breakdown for each employee
 */
@Injectable()
export class EmployeeEarningsGenerator {
  private readonly logger = new Logger(EmployeeEarningsGenerator.name);

  /**
   * Generate PDF report
   */
  generatePDF(report: EmployeeEarningsReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 30, right: 30 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, report.metadata);
        doc.moveDown(2);

        // Employee earnings table
        this.addEmployeeEarningsTable(doc, report.employees);
        doc.moveDown(2);

        // Totals
        this.addTotalsSection(doc, report.totals);

        // Footer
        this.addFooter(doc, report.metadata);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel data
   */
  generateExcelData(report: EmployeeEarningsReport): any {
    return {
      sheetName: 'Employee Earnings',
      columns: [
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Regular Pay', key: 'regularPay', width: 15 },
        { header: 'Overtime Pay', key: 'overtimePay', width: 15 },
        { header: 'Bonus', key: 'bonus', width: 15 },
        { header: 'Commission', key: 'commission', width: 15 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
        { header: 'Total Deductions', key: 'totalDeductions', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
        { header: 'YTD Gross', key: 'ytdGrossPay', width: 15 },
      ],
      rows: report.employees.map((emp) => ({
        employeeName: emp.employeeName,
        employeeId: emp.employeeId,
        department: emp.department || 'N/A',
        regularPay: this.formatCurrency(emp.earnings.regularPay),
        overtimePay: this.formatCurrency(emp.earnings.overtimePay),
        bonus: this.formatCurrency(emp.earnings.bonus),
        commission: this.formatCurrency(emp.earnings.commission),
        grossPay: this.formatCurrency(emp.earnings.grossPay),
        totalDeductions: this.formatCurrency(emp.deductions.totalDeductions),
        netPay: this.formatCurrency(emp.netPay),
        ytdGrossPay: this.formatCurrency(emp.ytdGrossPay),
      })),
      totals: {
        label: 'TOTALS',
        totalEmployees: report.totals.totalEmployees,
        totalRegularPay: this.formatCurrency(report.totals.totalRegularPay),
        totalOvertimePay: this.formatCurrency(report.totals.totalOvertimePay),
        totalBonuses: this.formatCurrency(report.totals.totalBonuses),
        totalCommissions: this.formatCurrency(report.totals.totalCommissions),
        totalGrossPay: this.formatCurrency(report.totals.totalGrossPay),
        totalDeductions: this.formatCurrency(report.totals.totalDeductions),
        totalNetPay: this.formatCurrency(report.totals.totalNetPay),
      },
    };
  }

  // ==================== PDF Helper Methods ====================

  private addHeader(doc: PDFKit.PDFDocument, metadata: any): void {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(metadata.companyName, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Employee Earnings Report', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Period: ${metadata.dateRange.start} to ${metadata.dateRange.end}`,
        { align: 'center' }
      );
    doc
      .moveTo(30, doc.y + 10)
      .lineTo(doc.page.width - 30, doc.y + 10)
      .stroke();
  }

  private addEmployeeEarningsTable(
    doc: PDFKit.PDFDocument,
    employees: EmployeeEarningsDetail[]
  ): void {
    let currentY = doc.y + 10;
    const itemHeight = 18;

    // Headers
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Employee', 30, currentY, { width: 100 });
    doc.text('Regular', 140, currentY, { width: 50, align: 'right' });
    doc.text('Overtime', 200, currentY, { width: 50, align: 'right' });
    doc.text('Bonus', 260, currentY, { width: 50, align: 'right' });
    doc.text('Gross', 320, currentY, { width: 60, align: 'right' });
    doc.text('Fed Tax', 390, currentY, { width: 50, align: 'right' });
    doc.text('State Tax', 450, currentY, { width: 50, align: 'right' });
    doc.text('Deductions', 510, currentY, { width: 60, align: 'right' });
    doc.text('Net Pay', 580, currentY, { width: 60, align: 'right' });
    doc.text('YTD Gross', 650, currentY, { width: 70, align: 'right' });

    currentY += itemHeight;
    doc
      .moveTo(30, currentY)
      .lineTo(doc.page.width - 30, currentY)
      .stroke();
    currentY += 5;

    // Data rows
    doc.fontSize(7).font('Helvetica');
    for (const emp of employees) {
      if (currentY > doc.page.height - 80) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(emp.employeeName, 30, currentY, { width: 100 });
      doc.text(this.formatCurrency(emp.earnings.regularPay), 140, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(emp.earnings.overtimePay), 200, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(emp.earnings.bonus), 260, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(emp.earnings.grossPay), 320, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(
        this.formatCurrency(emp.deductions.federalIncomeTax),
        390,
        currentY,
        { width: 50, align: 'right' }
      );
      doc.text(this.formatCurrency(emp.deductions.stateTax), 450, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(
        this.formatCurrency(emp.deductions.totalDeductions),
        510,
        currentY,
        { width: 60, align: 'right' }
      );
      doc.text(this.formatCurrency(emp.netPay), 580, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(emp.ytdGrossPay), 650, currentY, {
        width: 70,
        align: 'right',
      });

      currentY += itemHeight;
    }

    doc.y = currentY;
  }

  private addTotalsSection(doc: PDFKit.PDFDocument, totals: any): void {
    const startY = doc.y + 10;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('SUMMARY TOTALS', 30, startY);

    doc.fontSize(9).font('Helvetica');
    let y = startY + 20;

    doc.text('Total Employees:', 30, y);
    doc.text(totals.totalEmployees.toString(), 200, y);
    y += 15;

    doc.text('Total Regular Pay:', 30, y);
    doc.text(this.formatCurrency(totals.totalRegularPay), 200, y);
    y += 15;

    doc.text('Total Overtime Pay:', 30, y);
    doc.text(this.formatCurrency(totals.totalOvertimePay), 200, y);
    y += 15;

    doc.text('Total Bonuses:', 30, y);
    doc.text(this.formatCurrency(totals.totalBonuses), 200, y);
    y += 15;

    doc.text('Total Gross Pay:', 30, y);
    doc.text(this.formatCurrency(totals.totalGrossPay), 200, y);
    y += 15;

    doc.text('Total Deductions:', 30, y);
    doc.text(this.formatCurrency(totals.totalDeductions), 200, y);
    y += 15;

    doc.text('Total Net Pay:', 30, y);
    doc.text(this.formatCurrency(totals.totalNetPay), 200, y);
  }

  private addFooter(doc: PDFKit.PDFDocument, metadata: any): void {
    const bottomY = doc.page.height - 30;
    doc
      .fontSize(7)
      .font('Helvetica')
      .text(`Report ID: ${metadata.reportId}`, 30, bottomY, {
        align: 'center',
      });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
