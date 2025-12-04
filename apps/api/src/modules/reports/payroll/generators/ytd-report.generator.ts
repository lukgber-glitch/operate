import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { YTDReport } from '../types/payroll-report.types';

/**
 * Year-to-Date Report Generator
 */
@Injectable()
export class YTDReportGenerator {
  private readonly logger = new Logger(YTDReportGenerator.name);

  generatePDF(report: YTDReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape' });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(18).font('Helvetica-Bold')
          .text(report.metadata.companyName, { align: 'center' });
        doc.fontSize(14).text('Year-to-Date Payroll Report', { align: 'center' });
        doc.fontSize(10).font('Helvetica')
          .text(`As of: ${report.metadata.dateRange.end}`, { align: 'center' });
        doc.moveDown(2);

        // Table
        let y = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        const headers = ['Employee', 'Dept', 'Gross Pay', 'Taxes', 'Deductions', 'Net Pay', 'Payrolls'];
        const positions = [30, 150, 220, 300, 380, 460, 550];
        headers.forEach((header, i) => {
          doc.text(header, positions[i], y, { width: 70, align: i > 1 ? 'right' : 'left' });
        });

        y += 20;
        doc.moveTo(30, y).lineTo(650, y).stroke();
        y += 10;

        doc.fontSize(7).font('Helvetica');
        for (const emp of report.employees) {
          if (y > 500) {
            doc.addPage();
            y = 50;
          }
          doc.text(emp.employeeName, 30, y, { width: 110 });
          doc.text(emp.department || 'N/A', 150, y, { width: 60 });
          doc.text(this.fmt(emp.ytdEarnings.grossPay), 220, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.ytdTaxes.totalTaxes), 300, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.ytdDeductions.totalDeductions), 380, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.ytdNetPay), 460, y, { width: 70, align: 'right' });
          doc.text(emp.payrollsProcessed.toString(), 550, y, { width: 50, align: 'right' });
          y += 18;
        }

        // Summary
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('YTD SUMMARY');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Employees: ${report.totals.totalEmployees}`);
        doc.text(`Total Gross Pay: ${this.fmt(report.totals.totalGrossPay)}`);
        doc.text(`Total Taxes: ${this.fmt(report.totals.totalTaxes)}`);
        doc.text(`Total Deductions: ${this.fmt(report.totals.totalDeductions)}`);
        doc.text(`Total Net Pay: ${this.fmt(report.totals.totalNetPay)}`);
        doc.text(`Total Payrolls: ${report.totals.totalPayrollsProcessed}`);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateExcelData(report: YTDReport): any {
    return {
      sheetName: 'YTD Report',
      columns: [
        { header: 'Employee', key: 'name', width: 25 },
        { header: 'Department', key: 'dept', width: 20 },
        { header: 'YTD Gross', key: 'gross', width: 15 },
        { header: 'YTD Taxes', key: 'taxes', width: 15 },
        { header: 'YTD Deductions', key: 'deductions', width: 15 },
        { header: 'YTD Net', key: 'net', width: 15 },
        { header: 'Payrolls', key: 'count', width: 12 },
      ],
      rows: report.employees.map(emp => ({
        name: emp.employeeName,
        dept: emp.department || 'N/A',
        gross: this.fmt(emp.ytdEarnings.grossPay),
        taxes: this.fmt(emp.ytdTaxes.totalTaxes),
        deductions: this.fmt(emp.ytdDeductions.totalDeductions),
        net: this.fmt(emp.ytdNetPay),
        count: emp.payrollsProcessed,
      })),
    };
  }

  private fmt(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}
