import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { BenefitsDeductionReport } from '../types/payroll-report.types';

/**
 * Benefits Deduction Report Generator
 */
@Injectable()
export class BenefitsDeductionGenerator {
  private readonly logger = new Logger(BenefitsDeductionGenerator.name);

  generatePDF(report: BenefitsDeductionReport): Promise<Buffer> {
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
        doc.fontSize(14).text('Benefits & Deductions Report', { align: 'center' });
        doc.fontSize(10).font('Helvetica')
          .text(`Period: ${report.metadata.dateRange.start} to ${report.metadata.dateRange.end}`,
            { align: 'center' });
        doc.moveDown(2);

        // Table
        let y = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        const headers = ['Employee', 'Health', 'Retirement', 'FSA', 'Other', 'Total', 'YTD'];
        const positions = [30, 150, 250, 330, 410, 490, 580];
        headers.forEach((header, i) => {
          doc.text(header, positions[i], y, { width: 70, align: i > 0 ? 'right' : 'left' });
        });

        y += 20;
        doc.moveTo(30, y).lineTo(700, y).stroke();
        y += 10;

        doc.fontSize(7).font('Helvetica');
        for (const emp of report.deductions) {
          doc.text(emp.employeeName, 30, y, { width: 110 });
          doc.text(this.fmt(emp.healthInsurance.total), 150, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.retirement.total), 250, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.flexibleSpendingAccounts.total), 330, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.other.total), 410, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.totalDeductions), 490, y, { width: 70, align: 'right' });
          doc.text(this.fmt(emp.ytdDeductions), 580, y, { width: 70, align: 'right' });
          y += 18;
        }

        // Summary
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica-Bold').text('SUMMARY');
        doc.fontSize(9).font('Helvetica');
        doc.text(`Total Employees: ${report.summary.totalEmployees}`);
        doc.text(`Total Health Insurance: ${this.fmt(report.summary.totalHealthInsurance)}`);
        doc.text(`Total Retirement: ${this.fmt(report.summary.totalRetirement)}`);
        doc.text(`Total FSA: ${this.fmt(report.summary.totalFSA)}`);
        doc.text(`Grand Total: ${this.fmt(report.summary.grandTotalDeductions)}`);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateExcelData(report: BenefitsDeductionReport): any {
    return {
      sheetName: 'Benefits Deductions',
      columns: [
        { header: 'Employee', key: 'name', width: 25 },
        { header: 'Health Insurance', key: 'health', width: 18 },
        { header: 'Retirement', key: 'retirement', width: 15 },
        { header: 'FSA', key: 'fsa', width: 15 },
        { header: 'Other', key: 'other', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'YTD', key: 'ytd', width: 15 },
      ],
      rows: report.deductions.map(emp => ({
        name: emp.employeeName,
        health: this.fmt(emp.healthInsurance.total),
        retirement: this.fmt(emp.retirement.total),
        fsa: this.fmt(emp.flexibleSpendingAccounts.total),
        other: this.fmt(emp.other.total),
        total: this.fmt(emp.totalDeductions),
        ytd: this.fmt(emp.ytdDeductions),
      })),
    };
  }

  private fmt(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}
