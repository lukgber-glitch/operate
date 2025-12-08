import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { createWriteStream, createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import * as archiver from 'archiver';
import * as crypto from 'crypto';
import {
  ExportPdfDto,
  ExportExcelDto,
  PdfTemplate,
  ExcelTemplate,
  ExportOptionsDto,
  DownloadResponseDto,
  PdfWatermarkDto,
  PdfDigitalSignatureDto,
  ExcelChartConfigDto,
  ExcelConditionalFormattingDto,
  ExcelDataValidationDto,
  ExcelFormulaDto,
  PdfStyleOptionsDto,
  ExcelStyleOptionsDto,
} from './dto';

interface ReportData {
  organizationInfo?: {
    name: string;
    address?: string;
    taxId?: string;
    logo?: string;
  };
  reportTitle?: string;
  dateRange?: {
    from: Date | string;
    to: Date | string;
  };
  summary?: {
    totalRevenue?: number;
    totalExpenses?: number;
    netProfit?: number;
    profitMargin?: number;
    [key: string]: any;
  };
  sections?: Array<{
    title: string;
    description?: string;
    data: any[];
    charts?: any[];
  }>;
  data?: any;
  columns?: Array<{ key: string; header: string; width?: number }>;
  rows?: any[];
  totals?: Record<string, any>;
  charts?: any[];
  metadata?: Record<string, any>;
}

interface PdfPosition {
  x: number;
  y: number;
}

interface ExcelSheet {
  name: string;
  data: any[];
  columns?: Array<{ header: string; key: string; width?: number }>;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly uploadsDir: string;
  private readonly maxFileSizeMb = 100;

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = this.configService.get<string>('UPLOADS_DIR') || join(process.cwd(), 'uploads', 'exports');
    this.ensureUploadsDirExists();
  }

  private async ensureUploadsDirExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create uploads directory: ${error.message}`);
    }
  }

  /**
   * Main PDF Generation
   */
  async generatePdf(
    reportData: ReportData,
    template: PdfTemplate,
    options: Partial<ExportPdfDto> = {},
  ): Promise<Buffer> {
    this.logger.log(`Generating PDF with template: ${template}`);

    try {
      const doc = this.createPdfDocument(options);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // Add watermark if specified
      if (options.watermark) {
        this.addWatermarkToPdf(doc, options.watermark);
      }

      // Render content based on template
      await this.renderPdfTemplate(doc, template, reportData, options);

      doc.end();

      const buffer = await pdfPromise;

      // Add digital signature if specified
      if (options.digitalSignature) {
        return await this.addDigitalSignature(buffer, options.digitalSignature);
      }

      return buffer;
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate PDF');
    }
  }

  /**
   * Create PDF Document
   */
  private createPdfDocument(options: Partial<ExportPdfDto>): PDFKit.PDFDocument {
    const pageSize = options.pageSize || 'A4';
    const orientation = options.orientation || 'portrait';
    const margins = { top: 50, bottom: 50, left: 50, right: 50 };

    return new PDFDocument({
      size: pageSize,
      layout: orientation,
      margins,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: options.title || 'Report',
        Author: 'Operate/CoachOS',
        Subject: 'Financial Report',
        Keywords: 'report, finance, tax',
        CreationDate: new Date(),
      },
    });
  }

  /**
   * Render PDF Template
   */
  private async renderPdfTemplate(
    doc: PDFKit.PDFDocument,
    template: PdfTemplate,
    reportData: ReportData,
    options: Partial<ExportPdfDto>,
  ): Promise<void> {
    const language = options.language || 'de';
    const styleOptions = options.styleOptions || {};

    // Render header
    this.renderPdfHeader(doc, reportData.organizationInfo, reportData.reportTitle || 'Report', reportData.dateRange, styleOptions);

    // Add spacing
    doc.moveDown(2);

    // Table of contents if requested
    if (options.includeToc && reportData.sections && reportData.sections.length > 1) {
      this.addTableOfContents(doc, reportData.sections.map(s => s.title));
      doc.addPage();
    }

    // Executive summary if requested
    if (options.includeExecutiveSummary !== false && reportData.summary) {
      this.renderExecutiveSummary(doc, reportData.summary, language);
      doc.addPage();
    }

    // Render template-specific content
    switch (template) {
      case PdfTemplate.PL_STATEMENT:
        await this.renderPlStatement(doc, reportData, language);
        break;
      case PdfTemplate.CASH_FLOW:
        await this.renderCashFlowStatement(doc, reportData, language);
        break;
      case PdfTemplate.TAX_SUMMARY:
        await this.renderTaxSummary(doc, reportData, language);
        break;
      case PdfTemplate.BALANCE_SHEET:
        await this.renderBalanceSheet(doc, reportData, language);
        break;
      case PdfTemplate.INVOICE_REPORT:
        await this.renderInvoiceReport(doc, reportData, language);
        break;
      case PdfTemplate.EXPENSE_REPORT:
        await this.renderExpenseReport(doc, reportData, language);
        break;
      case PdfTemplate.EXECUTIVE_DASHBOARD:
        await this.renderExecutiveDashboard(doc, reportData, language, options);
        break;
      case PdfTemplate.PAYROLL_SUMMARY:
        await this.renderPayrollSummary(doc, reportData, language);
        break;
      default:
        await this.renderGenericReport(doc, reportData, language);
    }

    // Add page numbers
    if (styleOptions.showPageNumbers !== false) {
      this.addPageNumbers(doc);
    }
  }

  /**
   * Render PDF Header
   */
  private renderPdfHeader(
    doc: PDFKit.PDFDocument,
    orgInfo: any = {},
    reportTitle: string,
    dateRange?: { from: Date | string; to: Date | string },
    styleOptions: PdfStyleOptionsDto = {},
  ): void {
    const startY = doc.y;
    const primaryColor = styleOptions.primaryColor || '#2563eb';

    // Organization name and logo
    doc.fontSize(20).fillColor(primaryColor).text(orgInfo.name || 'Organization', { align: 'left' });

    if (orgInfo.address) {
      doc.fontSize(10).fillColor('#666').text(orgInfo.address, { align: 'left' });
    }

    if (orgInfo.taxId) {
      doc.text(`Tax ID: ${orgInfo.taxId}`, { align: 'left' });
    }

    // Report title
    doc.moveDown();
    doc.fontSize(16).fillColor('#000').text(reportTitle, { align: 'center' });

    // Date range
    if (dateRange) {
      const fromDate = this.formatDate(dateRange.from, 'de', 'Europe/Berlin');
      const toDate = this.formatDate(dateRange.to, 'de', 'Europe/Berlin');
      doc.fontSize(10)
        .fillColor('#666')
        .text(`${fromDate} - ${toDate}`, { align: 'center' });
    }

    // Generated date
    doc.fontSize(8)
      .fillColor('#999')
      .text(`Generated: ${this.formatDate(new Date(), 'de', 'Europe/Berlin')}`, { align: 'right' });

    // Divider line
    doc.moveDown();
    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

    doc.moveDown();
  }

  /**
   * Render Executive Summary
   */
  private renderExecutiveSummary(doc: PDFKit.PDFDocument, summary: any, language: string): void {
    doc.fontSize(14).fillColor('#000').text(language === 'de' ? 'Zusammenfassung' : 'Executive Summary');
    doc.moveDown();

    const summaryData = [
      { label: language === 'de' ? 'Gesamtumsatz' : 'Total Revenue', value: summary.totalRevenue, format: 'currency' },
      { label: language === 'de' ? 'Gesamtausgaben' : 'Total Expenses', value: summary.totalExpenses, format: 'currency' },
      { label: language === 'de' ? 'Nettogewinn' : 'Net Profit', value: summary.netProfit, format: 'currency' },
      { label: language === 'de' ? 'Gewinnmarge' : 'Profit Margin', value: summary.profitMargin, format: 'percentage' },
    ];

    summaryData.forEach(item => {
      if (item.value !== undefined) {
        doc.fontSize(11).fillColor('#333').text(item.label, { continued: true });

        let formattedValue = '';
        if (item.format === 'currency') {
          formattedValue = this.formatCurrency(item.value, 'EUR', 'de');
        } else if (item.format === 'percentage') {
          formattedValue = this.formatPercentage(item.value, 2);
        } else {
          formattedValue = String(item.value);
        }

        doc.text(`: ${formattedValue}`, { align: 'right' });
      }
    });
  }

  /**
   * Render Data Table in PDF
   */
  private renderDataTable(
    doc: PDFKit.PDFDocument,
    columns: Array<{ key: string; header: string; width?: number }>,
    rows: any[],
    totals?: Record<string, any>,
  ): void {
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100;

    // Calculate column widths
    const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const remainingWidth = tableWidth - totalDefinedWidth;
    const undefinedColumns = columns.filter(col => !col.width).length;
    const defaultWidth = undefinedColumns > 0 ? remainingWidth / undefinedColumns : 0;

    let currentX = tableLeft;

    // Header row
    doc.fontSize(10).fillColor('#fff');
    columns.forEach(col => {
      const colWidth = col.width || defaultWidth;
      doc.rect(currentX, tableTop, colWidth, 25).fill('#2563eb');
      doc.fillColor('#fff').text(col.header, currentX + 5, tableTop + 7, {
        width: colWidth - 10,
        align: 'left',
      });
      currentX += colWidth;
    });

    // Data rows
    let currentY = tableTop + 25;
    doc.fillColor('#000');

    rows.forEach((row, rowIndex) => {
      currentX = tableLeft;
      const rowColor = rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff';

      columns.forEach(col => {
        const colWidth = col.width || defaultWidth;
        doc.rect(currentX, currentY, colWidth, 20).fill(rowColor);

        let cellValue = row[col.key];
        if (typeof cellValue === 'number') {
          cellValue = this.formatCurrency(cellValue, 'EUR', 'de');
        }

        doc.fillColor('#000').fontSize(9).text(String(cellValue || ''), currentX + 5, currentY + 5, {
          width: colWidth - 10,
          align: 'left',
        });

        currentX += colWidth;
      });

      currentY += 20;
    });

    // Totals row
    if (totals) {
      currentX = tableLeft;
      doc.fontSize(10).fillColor('#fff');

      columns.forEach(col => {
        const colWidth = col.width || defaultWidth;
        doc.rect(currentX, currentY, colWidth, 25).fill('#1e40af');

        if (totals[col.key] !== undefined) {
          let totalValue = totals[col.key];
          if (typeof totalValue === 'number') {
            totalValue = this.formatCurrency(totalValue, 'EUR', 'de');
          }
          doc.fillColor('#fff').text(String(totalValue), currentX + 5, currentY + 7, {
            width: colWidth - 10,
            align: 'left',
          });
        }

        currentX += colWidth;
      });
    }

    doc.y = currentY + 30;
  }

  /**
   * Add Watermark to PDF
   */
  private addWatermarkToPdf(doc: PDFKit.PDFDocument, watermark: PdfWatermarkDto): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      const centerX = doc.page.width / 2;
      const centerY = doc.page.height / 2;

      doc.save();
      doc.translate(centerX, centerY);
      doc.rotate(watermark.angle || 45);

      doc.fontSize(watermark.fontSize || 60)
        .fillColor('#000000', watermark.opacity || 0.1)
        .text(watermark.text, -200, -30, {
          align: 'center',
          width: 400,
        });

      doc.restore();
    }
  }

  /**
   * Add Digital Signature (Placeholder - requires external library)
   */
  private async addDigitalSignature(
    pdfBuffer: Buffer,
    signature: PdfDigitalSignatureDto,
  ): Promise<Buffer> {
    this.logger.warn('Digital signature not implemented - returning unsigned PDF');
    // TODO: Implement using pdf-lib or node-signpdf
    return pdfBuffer;
  }

  /**
   * Add Table of Contents
   */
  private addTableOfContents(doc: PDFKit.PDFDocument, sections: string[]): void {
    doc.fontSize(16).fillColor('#000').text('Table of Contents', { align: 'center' });
    doc.moveDown(2);

    sections.forEach((section, index) => {
      doc.fontSize(11)
        .fillColor('#2563eb')
        .text(`${index + 1}. ${section}`, { continued: true })
        .fillColor('#666')
        .text(`....... ${index + 2}`, { align: 'right' });
      doc.moveDown(0.5);
    });
  }

  /**
   * Add Page Numbers
   */
  private addPageNumbers(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc.fontSize(8)
        .fillColor('#999')
        .text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 30,
          { align: 'center' },
        );
    }
  }

  /**
   * Template Renderers
   */
  private async renderPlStatement(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Gewinn- und Verlustrechnung' : 'Profit & Loss Statement');
    doc.moveDown();

    if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  private async renderCashFlowStatement(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Kapitalflussrechnung' : 'Cash Flow Statement');
    doc.moveDown();

    if (data.sections) {
      data.sections.forEach(section => {
        doc.fontSize(11).fillColor('#2563eb').text(section.title);
        doc.moveDown(0.5);

        if (section.data && section.data.length > 0) {
          section.data.forEach(item => {
            doc.fontSize(10).fillColor('#000').text(`${item.label}: ${this.formatCurrency(item.value, 'EUR', 'de')}`);
          });
        }

        doc.moveDown();
      });
    }
  }

  private async renderTaxSummary(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Steuerzusammenfassung' : 'Tax Summary');
    doc.moveDown();

    if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  private async renderBalanceSheet(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Bilanz' : 'Balance Sheet');
    doc.moveDown();

    if (data.sections) {
      data.sections.forEach(section => {
        doc.fontSize(11).fillColor('#2563eb').text(section.title);
        doc.moveDown(0.5);

        if (section.data) {
          this.renderDataTable(doc, section.data.columns || [], section.data.rows || [], section.data.totals);
        }

        doc.moveDown();
      });
    }
  }

  private async renderInvoiceReport(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Rechnungsbericht' : 'Invoice Report');
    doc.moveDown();

    if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  private async renderExpenseReport(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Ausgabenbericht' : 'Expense Report');
    doc.moveDown();

    if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  private async renderExecutiveDashboard(
    doc: PDFKit.PDFDocument,
    data: ReportData,
    language: string,
    options: Partial<ExportPdfDto>,
  ): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Executive Dashboard' : 'Executive Dashboard');
    doc.moveDown();

    if (data.sections) {
      data.sections.forEach(section => {
        doc.fontSize(11).fillColor('#2563eb').text(section.title);
        doc.moveDown(0.5);

        if (section.description) {
          doc.fontSize(9).fillColor('#666').text(section.description);
          doc.moveDown(0.5);
        }

        if (section.data) {
          section.data.forEach(item => {
            doc.fontSize(10).fillColor('#000').text(`${item.label}: ${item.value}`);
          });
        }

        doc.moveDown();
      });
    }
  }

  private async renderPayrollSummary(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    doc.fontSize(12).text(language === 'de' ? 'Lohnabrechnungsübersicht' : 'Payroll Summary');
    doc.moveDown();

    if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  private async renderGenericReport(doc: PDFKit.PDFDocument, data: ReportData, language: string): Promise<void> {
    if (data.sections) {
      data.sections.forEach(section => {
        doc.fontSize(12).fillColor('#2563eb').text(section.title);
        doc.moveDown();

        if (section.data && section.data.length > 0) {
          section.data.forEach(item => {
            doc.fontSize(10).fillColor('#000').text(JSON.stringify(item, null, 2));
          });
        }

        doc.moveDown();
      });
    } else if (data.columns && data.rows) {
      this.renderDataTable(doc, data.columns, data.rows, data.totals);
    }
  }

  /**
   * Excel Generation
   */
  async generateExcel(
    reportData: ReportData,
    template: ExcelTemplate,
    options: Partial<ExportExcelDto> = {},
  ): Promise<Buffer> {
    this.logger.log(`Generating Excel with template: ${template}`);

    try {
      const workbook = this.createWorkbook(options.workbookName || 'Report');

      // Add summary sheet
      if (options.includeSummarySheet !== false && reportData.summary) {
        await this.addSummarySheet(workbook, reportData.summary, options);
      }

      // Render template-specific content
      switch (template) {
        case ExcelTemplate.FINANCIAL_STATEMENT:
          await this.renderFinancialStatementExcel(workbook, reportData, options);
          break;
        case ExcelTemplate.MULTI_SHEET_WORKBOOK:
          await this.renderMultiSheetWorkbook(workbook, reportData, options);
          break;
        case ExcelTemplate.TAX_REPORT:
          await this.renderTaxReportExcel(workbook, reportData, options);
          break;
        case ExcelTemplate.PAYROLL_REPORT:
          await this.renderPayrollReportExcel(workbook, reportData, options);
          break;
        case ExcelTemplate.INVOICE_REGISTER:
          await this.renderInvoiceRegisterExcel(workbook, reportData, options);
          break;
        case ExcelTemplate.EXPENSE_TRACKER:
          await this.renderExpenseTrackerExcel(workbook, reportData, options);
          break;
        case ExcelTemplate.CASH_FLOW:
          await this.renderCashFlowExcel(workbook, reportData, options);
          break;
        default:
          await this.renderGenericExcel(workbook, reportData, options);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer as Buffer;
    } catch (error) {
      this.logger.error(`Excel generation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate Excel');
    }
  }

  /**
   * Create Workbook
   */
  private createWorkbook(name: string): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Operate/CoachOS';
    workbook.lastModifiedBy = 'Operate/CoachOS';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    return workbook;
  }

  /**
   * Add Summary Sheet
   */
  private async addSummarySheet(
    workbook: ExcelJS.Workbook,
    summary: any,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Summary', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    const styleOptions = options.styleOptions || {};

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Executive Summary';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563eb' },
    };
    titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

    // Headers
    sheet.getRow(2).values = ['Metric', 'Value'];
    this.applyHeaderStyle(sheet.getRow(2), styleOptions);

    // Data rows
    let rowIndex = 3;
    const summaryItems = [
      { metric: 'Total Revenue', value: summary.totalRevenue, format: 'currency' },
      { metric: 'Total Expenses', value: summary.totalExpenses, format: 'currency' },
      { metric: 'Net Profit', value: summary.netProfit, format: 'currency' },
      { metric: 'Profit Margin', value: summary.profitMargin, format: 'percentage' },
    ];

    summaryItems.forEach(item => {
      if (item.value !== undefined) {
        const row = sheet.getRow(rowIndex);
        row.getCell(1).value = item.metric;
        row.getCell(2).value = item.value;

        if (item.format === 'currency') {
          row.getCell(2).numFmt = '€#,##0.00';
        } else if (item.format === 'percentage') {
          row.getCell(2).numFmt = '0.00%';
        }

        rowIndex++;
      }
    });

    // Auto-fit columns
    sheet.columns = [
      { width: 30 },
      { width: 20 },
    ];
  }

  /**
   * Add Data Sheet
   */
  private addDataSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    columns: Array<{ key: string; header: string; width?: number }>,
    rows: any[],
    options: Partial<ExportExcelDto> = {},
  ): ExcelJS.Worksheet {
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    const styleOptions = options.styleOptions || {};

    // Set columns
    sheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Apply header styles
    this.applyHeaderStyle(sheet.getRow(1), styleOptions);

    // Add rows
    rows.forEach(row => {
      sheet.addRow(row);
    });

    // Apply formatting
    this.applyExcelFormatting(sheet, styleOptions);

    // Add formulas if enabled
    if (options.enableFormulas && options.formulas) {
      this.addExcelFormulas(sheet, options.formulas);
    }

    // Add conditional formatting
    if (options.conditionalFormatting) {
      this.addConditionalFormatting(sheet, options.conditionalFormatting);
    }

    // Add data validation
    if (options.dataValidation) {
      this.addDataValidation(sheet, options.dataValidation);
    }

    // Protect sheet if password provided
    if (options.sheetPassword) {
      this.protectSheet(sheet, options.sheetPassword);
    }

    return sheet;
  }

  /**
   * Apply Header Style
   */
  private applyHeaderStyle(row: ExcelJS.Row, styleOptions: ExcelStyleOptionsDto): void {
    const headerBgColor = styleOptions.headerBackgroundColor || 'FF2563eb';
    const headerFontColor = styleOptions.headerFontColor || 'FFFFFFFF';

    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerBgColor.replace('#', 'FF') },
      };
      cell.font = {
        bold: true,
        color: { argb: headerFontColor.replace('#', '') },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    row.height = 25;
  }

  /**
   * Apply Excel Formatting
   */
  private applyExcelFormatting(worksheet: ExcelJS.Worksheet, styleOptions: ExcelStyleOptionsDto): void {
    const alternatingRows = styleOptions.alternatingRows !== false;
    const showGridlines = styleOptions.showGridlines !== false;
    const enableFilters = styleOptions.enableFilters !== false;

    // Alternating row colors
    if (alternatingRows) {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            if (!cell.fill || (cell.fill as Prisma.InputJsonValue).type !== 'pattern') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF9FAFB' },
              };
            }
          });
        }
      });
    }

    // Auto-filter
    if (enableFilters && worksheet.rowCount > 1) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columnCount },
      };
    }

    // Gridlines
    worksheet.views = worksheet.views || [];
    if (worksheet.views[0]) {
      worksheet.views[0].showGridLines = showGridlines;
    }

    // Freeze header
    if (styleOptions.freezeHeader !== false) {
      worksheet.views[0] = worksheet.views[0] || {};
      worksheet.views[0].state = 'frozen';
      worksheet.views[0].ySplit = 1;
    }
  }

  /**
   * Add Excel Formulas
   */
  private addExcelFormulas(worksheet: ExcelJS.Worksheet, formulas: ExcelFormulaDto[]): void {
    formulas.forEach(formula => {
      const cell = worksheet.getCell(formula.cell);
      cell.value = { formula: formula.formula };
    });
  }

  /**
   * Add Conditional Formatting
   */
  private addConditionalFormatting(
    worksheet: ExcelJS.Worksheet,
    rules: ExcelConditionalFormattingDto[],
  ): void {
    rules.forEach(rule => {
      const columnIndex = this.getColumnIndex(worksheet, rule.column);
      if (columnIndex === -1) return;

      const range = `${this.getColumnLetter(columnIndex)}2:${this.getColumnLetter(columnIndex)}${worksheet.rowCount}`;

      if (rule.ruleType === 'dataBar') {
        worksheet.addConditionalFormatting({
          ref: range,
          rules: [{
            type: 'dataBar',
            ...rule.config,
          }],
        });
      } else if (rule.ruleType === 'colorScale') {
        worksheet.addConditionalFormatting({
          ref: range,
          rules: [{
            type: 'colorScale',
            cfvo: [
              { type: 'min' },
              { type: 'max' },
            ],
            color: [
              { argb: 'FFF8696B' },
              { argb: 'FF63BE7B' },
            ],
            ...rule.config,
          }],
        });
      }
    });
  }

  /**
   * Add Data Validation
   */
  private addDataValidation(worksheet: ExcelJS.Worksheet, validations: ExcelDataValidationDto[]): void {
    validations.forEach(validation => {
      const columnIndex = this.getColumnIndex(worksheet, validation.column);
      if (columnIndex === -1) return;

      const range = `${this.getColumnLetter(columnIndex)}2:${this.getColumnLetter(columnIndex)}${worksheet.rowCount}`;

      worksheet.dataValidations.add(range, {
        type: validation.type as Prisma.InputJsonValue,
        formulae: validation.values ? [validation.values] : undefined,
        showErrorMessage: !!validation.errorMessage,
        errorTitle: 'Invalid Value',
        error: validation.errorMessage,
      });
    });
  }

  /**
   * Protect Sheet
   */
  private protectSheet(worksheet: ExcelJS.Worksheet, password: string): void {
    worksheet.protect(password, {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertRows: false,
      insertColumns: false,
      deleteRows: false,
      deleteColumns: false,
      sort: true,
      autoFilter: true,
    });
  }

  /**
   * Excel Template Renderers
   */
  private async renderFinancialStatementExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Financial Statement', data.columns, data.rows, options);
    }
  }

  private async renderMultiSheetWorkbook(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.sections) {
      data.sections.forEach(section => {
        if (section.data && section.data.length > 0) {
          const columns = Object.keys(section.data[0]).map(key => ({
            key,
            header: key.charAt(0).toUpperCase() + key.slice(1),
          }));
          this.addDataSheet(workbook, section.title, columns, section.data, options);
        }
      });
    }
  }

  private async renderTaxReportExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Tax Report', data.columns, data.rows, options);
    }
  }

  private async renderPayrollReportExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Payroll', data.columns, data.rows, options);
    }
  }

  private async renderInvoiceRegisterExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Invoice Register', data.columns, data.rows, options);
    }
  }

  private async renderExpenseTrackerExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Expenses', data.columns, data.rows, options);
    }
  }

  private async renderCashFlowExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.sections) {
      data.sections.forEach(section => {
        if (section.data && section.data.length > 0) {
          const columns = Object.keys(section.data[0]).map(key => ({
            key,
            header: key.charAt(0).toUpperCase() + key.slice(1),
          }));
          this.addDataSheet(workbook, section.title, columns, section.data, options);
        }
      });
    }
  }

  private async renderGenericExcel(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    options: Partial<ExportExcelDto>,
  ): Promise<void> {
    if (data.columns && data.rows) {
      this.addDataSheet(workbook, 'Data', data.columns, data.rows, options);
    }
  }

  /**
   * Utility Methods
   */
  private formatCurrency(value: number, currency: string, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  private formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  private formatDate(date: Date | string, format: string, timezone: string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(format === 'de' ? 'de-DE' : 'en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  }

  private getColumnIndex(worksheet: ExcelJS.Worksheet, columnKey: string): number {
    return worksheet.columns.findIndex(col => col.key === columnKey);
  }

  private getColumnLetter(index: number): string {
    let letter = '';
    let num = index + 1;

    while (num > 0) {
      const remainder = (num - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      num = Math.floor((num - 1) / 26);
    }

    return letter;
  }

  /**
   * File Management
   */
  async generateFilename(reportType: string, dateRange: any, format: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dateStr = dateRange
      ? `${this.formatDate(dateRange.from, 'en', 'UTC')}_${this.formatDate(dateRange.to, 'en', 'UTC')}`
      : timestamp;

    return `${reportType}_${dateStr}.${format}`;
  }

  async uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
    const filePath = join(this.uploadsDir, filename);

    try {
      await fs.writeFile(filePath, buffer);
      this.logger.log(`File saved: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to save file: ${error.message}`);
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  async getDownloadUrl(fileId: string): Promise<DownloadResponseDto> {
    const filePath = join(this.uploadsDir, fileId);

    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        id: fileId,
        fileName: fileId,
        format: filePath.split('.').pop() || 'unknown',
        fileSizeBytes: stats.size,
        downloadUrl: `/api/reports/export/download/${fileId}`,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        createdAt: stats.birthtime,
        deleteAt: new Date(Date.now() + 86400000), // 24 hours
        mimeType: this.getMimeType(filePath),
        checksum,
      };
    } catch (error) {
      this.logger.error(`Failed to get download URL: ${error.message}`);
      throw new BadRequestException('File not found');
    }
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      zip: 'application/zip',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async scheduleExportCleanup(fileId: string, ttl: number): Promise<void> {
    setTimeout(async () => {
      try {
        const filePath = join(this.uploadsDir, fileId);
        await fs.unlink(filePath);
        this.logger.log(`Cleaned up file: ${fileId}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup file ${fileId}: ${error.message}`);
      }
    }, ttl * 1000);
  }

  async mergePdfs(pdfs: Buffer[]): Promise<Buffer> {
    // TODO: Implement PDF merging using pdf-lib
    this.logger.warn('PDF merging not implemented - returning first PDF');
    return pdfs[0] || Buffer.from('');
  }
}
