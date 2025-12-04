import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import {
  TaxLiabilityReport,
  TaxLiabilityDetail,
  TaxLiabilitySummary,
} from '../types/payroll-report.types';

/**
 * Tax Liability Report Generator
 * Generates tax liability reports for federal, state, and local taxes
 */
@Injectable()
export class TaxLiabilityGenerator {
  private readonly logger = new Logger(TaxLiabilityGenerator.name);

  generatePDF(report: TaxLiabilityReport): Promise<Buffer> {
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

        this.addHeader(doc, report.metadata);
        doc.moveDown(2);
        this.addTaxLiabilityTable(doc, report.taxLiabilities);
        doc.moveDown(2);
        this.addSummarySection(doc, report.summary);
        this.addFooter(doc, report.metadata);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateExcelData(report: TaxLiabilityReport): any {
    return {
      sheetName: 'Tax Liability',
      columns: [
        { header: 'Period Start', key: 'payPeriodStart', width: 15 },
        { header: 'Period End', key: 'payPeriodEnd', width: 15 },
        { header: 'Check Date', key: 'checkDate', width: 15 },
        { header: 'Federal Income Tax', key: 'federalIncomeTax', width: 18 },
        { header: 'Social Security', key: 'socialSecurity', width: 18 },
        { header: 'Medicare', key: 'medicare', width: 15 },
        { header: 'FUTA', key: 'futa', width: 15 },
        { header: 'State Income Tax', key: 'stateIncomeTax', width: 18 },
        { header: 'SUTA', key: 'suta', width: 15 },
        { header: 'Total Liability', key: 'totalLiability', width: 18 },
      ],
      rows: report.taxLiabilities.map((tax) => ({
        payPeriodStart: tax.payPeriodStart,
        payPeriodEnd: tax.payPeriodEnd,
        checkDate: tax.checkDate,
        federalIncomeTax: this.formatCurrency(tax.federal.incomeTax),
        socialSecurity: this.formatCurrency(
          tax.federal.socialSecurityEmployee + tax.federal.socialSecurityEmployer
        ),
        medicare: this.formatCurrency(
          tax.federal.medicareEmployee + tax.federal.medicareEmployer
        ),
        futa: this.formatCurrency(tax.federal.futa),
        stateIncomeTax: this.formatCurrency(tax.state.incomeTax),
        suta: this.formatCurrency(tax.state.unemploymentTax),
        totalLiability: this.formatCurrency(tax.totalTaxLiability),
      })),
      summary: {
        label: 'TOTAL TAX LIABILITY',
        totalFederalIncomeTax: this.formatCurrency(report.summary.totalFederalIncomeTax),
        totalSocialSecurity: this.formatCurrency(report.summary.totalSocialSecurity),
        totalMedicare: this.formatCurrency(report.summary.totalMedicare),
        totalFUTA: this.formatCurrency(report.summary.totalFUTA),
        totalStateIncomeTax: this.formatCurrency(report.summary.totalStateIncomeTax),
        totalSUTA: this.formatCurrency(report.summary.totalSUTA),
        grandTotal: this.formatCurrency(report.summary.grandTotalTaxLiability),
      },
    };
  }

  private addHeader(doc: PDFKit.PDFDocument, metadata: any): void {
    doc.fontSize(18).font('Helvetica-Bold').text(metadata.companyName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('Tax Liability Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(
      `Period: ${metadata.dateRange.start} to ${metadata.dateRange.end}`,
      { align: 'center' }
    );
    doc.moveTo(30, doc.y + 10).lineTo(doc.page.width - 30, doc.y + 10).stroke();
  }

  private addTaxLiabilityTable(
    doc: PDFKit.PDFDocument,
    liabilities: TaxLiabilityDetail[]
  ): void {
    let currentY = doc.y + 10;
    const itemHeight = 18;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Period', 30, currentY, { width: 80 });
    doc.text('Fed Income', 120, currentY, { width: 60, align: 'right' });
    doc.text('SS Tax', 190, currentY, { width: 60, align: 'right' });
    doc.text('Medicare', 260, currentY, { width: 60, align: 'right' });
    doc.text('FUTA', 330, currentY, { width: 50, align: 'right' });
    doc.text('State Income', 390, currentY, { width: 60, align: 'right' });
    doc.text('SUTA', 460, currentY, { width: 50, align: 'right' });
    doc.text('Local', 520, currentY, { width: 50, align: 'right' });
    doc.text('Total', 580, currentY, { width: 70, align: 'right' });

    currentY += itemHeight;
    doc.moveTo(30, currentY).lineTo(doc.page.width - 30, currentY).stroke();
    currentY += 5;

    doc.fontSize(7).font('Helvetica');
    for (const tax of liabilities) {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      const periodText = `${tax.payPeriodStart.substring(5)} - ${tax.payPeriodEnd.substring(5)}`;
      doc.text(periodText, 30, currentY, { width: 80 });
      doc.text(this.formatCurrency(tax.federal.incomeTax), 120, currentY, {
        width: 60,
        align: 'right',
      });
      const totalSS =
        tax.federal.socialSecurityEmployee + tax.federal.socialSecurityEmployer;
      doc.text(this.formatCurrency(totalSS), 190, currentY, {
        width: 60,
        align: 'right',
      });
      const totalMedicare = tax.federal.medicareEmployee + tax.federal.medicareEmployer;
      doc.text(this.formatCurrency(totalMedicare), 260, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(tax.federal.futa), 330, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(tax.state.incomeTax), 390, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(tax.state.unemploymentTax), 460, currentY, {
        width: 50,
        align: 'right',
      });
      const localTax = tax.local?.totalLocal || 0;
      doc.text(this.formatCurrency(localTax), 520, currentY, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(tax.totalTaxLiability), 580, currentY, {
        width: 70,
        align: 'right',
      });

      currentY += itemHeight;
    }

    doc.y = currentY;
  }

  private addSummarySection(
    doc: PDFKit.PDFDocument,
    summary: TaxLiabilitySummary
  ): void {
    const startY = doc.y + 10;
    doc.rect(30, startY, 400, 150).stroke();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TAX LIABILITY SUMMARY', 40, startY + 10);

    doc.fontSize(9).font('Helvetica');
    let y = startY + 30;

    const items = [
      ['Federal Income Tax:', summary.totalFederalIncomeTax],
      ['Social Security (Total):', summary.totalSocialSecurity],
      ['Medicare (Total):', summary.totalMedicare],
      ['FUTA:', summary.totalFUTA],
      ['State Income Tax:', summary.totalStateIncomeTax],
      ['SUTA:', summary.totalSUTA],
      ['Local Tax:', summary.totalLocalTax],
    ];

    for (const [label, amount] of items) {
      doc.text(label, 40, y);
      doc.text(this.formatCurrency(amount), 350, y, { align: 'right' });
      y += 15;
    }

    y += 5;
    doc.moveTo(40, y).lineTo(410, y).stroke();
    y += 10;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('GRAND TOTAL:', 40, y);
    doc.text(this.formatCurrency(summary.grandTotalTaxLiability), 350, y, {
      align: 'right',
    });
  }

  private addFooter(doc: PDFKit.PDFDocument, metadata: any): void {
    const bottomY = doc.page.height - 30;
    doc.fontSize(7).font('Helvetica').text(`Report ID: ${metadata.reportId}`, 30, bottomY, {
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
