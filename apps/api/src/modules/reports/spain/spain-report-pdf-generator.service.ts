/**
 * Spain Report PDF Generator Service
 * Generates PDF previews for Spanish tax reports
 * Task: W25-T4
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Modelo303Report,
  SpainReportBase,
  SpainReportType,
} from './interfaces/spain-report.interface';
import { FILING_DEADLINES } from './constants/modelo-303.constants';

@Injectable()
export class SpainReportPdfGeneratorService {
  private readonly logger = new Logger(SpainReportPdfGeneratorService.name);

  /**
   * Generate PDF for any Spain report
   */
  async generatePdf(report: SpainReportBase): Promise<Buffer> {
    switch (report.type) {
      case SpainReportType.MODELO_303:
        return this.generateModelo303Pdf(report as Modelo303Report);
      case SpainReportType.MODELO_390:
      case SpainReportType.MODELO_111:
      case SpainReportType.MODELO_347:
        throw new Error(`PDF generation for ${report.type} not yet implemented`);
      default:
        throw new Error(`Unknown report type: ${report.type}`);
    }
  }

  /**
   * Generate Modelo 303 PDF preview
   * Note: In production, this would use a proper PDF library like PDFKit or Puppeteer
   * For now, we'll generate HTML that can be converted to PDF
   */
  private async generateModelo303Pdf(
    report: Modelo303Report,
  ): Promise<Buffer> {
    this.logger.log(`Generating Modelo 303 PDF for report ${report.id}`);

    const html = this.generateModelo303Html(report);

    // In production, convert HTML to PDF using puppeteer or similar
    // For now, return HTML as buffer
    return Buffer.from(html, 'utf-8');
  }

  /**
   * Generate HTML for Modelo 303
   */
  private generateModelo303Html(report: Modelo303Report): string {
    const deadline = FILING_DEADLINES[report.period.quarter!];
    const deadlineDate = report.period.quarter === 4
      ? `${deadline.day} de ${this.getMonthName(deadline.month)} de ${report.period.year + 1}`
      : `${deadline.day} de ${this.getMonthName(deadline.month)} de ${report.period.year}`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modelo 303 - ${report.period.year} Q${report.period.quarter}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #003366;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 18pt;
            color: #003366;
            margin-bottom: 5px;
        }

        .header .subtitle {
            font-size: 12pt;
            color: #666;
        }

        .taxpayer-info {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }

        .taxpayer-info .row {
            margin-bottom: 8px;
        }

        .taxpayer-info .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            background: #003366;
            color: white;
            padding: 8px 12px;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .boxes {
            border: 1px solid #ccc;
            border-radius: 5px;
            overflow: hidden;
        }

        .box-row {
            display: flex;
            border-bottom: 1px solid #ccc;
        }

        .box-row:last-child {
            border-bottom: none;
        }

        .box-row.total {
            background: #e6f2ff;
            font-weight: bold;
        }

        .box-row.result {
            background: #fff3cd;
            font-weight: bold;
        }

        .box-number {
            width: 80px;
            padding: 8px;
            background: #f5f5f5;
            border-right: 1px solid #ccc;
            text-align: center;
            font-weight: bold;
        }

        .box-description {
            flex: 1;
            padding: 8px 12px;
            border-right: 1px solid #ccc;
        }

        .box-value {
            width: 120px;
            padding: 8px 12px;
            text-align: right;
            font-family: 'Courier New', monospace;
        }

        .summary {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border: 2px solid #003366;
            border-radius: 5px;
        }

        .summary .result-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13pt;
        }

        .summary .final-result {
            font-size: 16pt;
            font-weight: bold;
            color: #003366;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #003366;
        }

        .summary .to-pay {
            color: #d9534f;
        }

        .summary .to-return {
            color: #5cb85c;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
        }

        .metadata {
            margin-top: 30px;
            padding: 15px;
            background: #f0f0f0;
            font-size: 9pt;
            color: #666;
        }

        .deadline-warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 5px;
        }

        .deadline-warning strong {
            color: #856404;
        }

        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MODELO 303</h1>
        <div class="subtitle">Impuesto sobre el Valor Añadido - Autoliquidación</div>
        <div class="subtitle">Periodo: ${report.period.quarter}º Trimestre ${report.period.year}</div>
    </div>

    ${this.generateDeadlineWarning(deadlineDate)}

    <div class="taxpayer-info">
        <div class="row">
            <span class="label">NIF:</span>
            <span>${report.taxpayer.nif}</span>
        </div>
        <div class="row">
            <span class="label">Razón Social:</span>
            <span>${report.taxpayer.name}</span>
        </div>
        <div class="row">
            <span class="label">Ejercicio:</span>
            <span>${report.taxpayer.fiscalYear}</span>
        </div>
        <div class="row">
            <span class="label">Periodo:</span>
            <span>${report.period.quarter}T (${this.getQuarterDescription(report.period.quarter!)})</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">I. IVA DEVENGADO (IVA Repercutido)</div>
        <div class="boxes">
            ${this.generateBoxRow('01', 'Base imponible general 21%', report.ivaCollected.base21)}
            ${this.generateBoxRow('02', 'Cuota IVA 21%', report.ivaCollected.quota21)}
            ${this.generateBoxRow('03', 'Base imponible reducida 10%', report.ivaCollected.base10)}
            ${this.generateBoxRow('04', 'Cuota IVA 10%', report.ivaCollected.quota10)}
            ${this.generateBoxRow('05', 'Base imponible superreducida 4%', report.ivaCollected.base4)}
            ${this.generateBoxRow('06', 'Cuota IVA 4%', report.ivaCollected.quota4)}
            ${report.ivaCollected.intraEUAcquisitionsBase ? this.generateBoxRow('10', 'Base adquisiciones intracomunitarias', report.ivaCollected.intraEUAcquisitionsBase) : ''}
            ${report.ivaCollected.intraEUAcquisitionsQuota ? this.generateBoxRow('11', 'Cuota adquisiciones intracomunitarias', report.ivaCollected.intraEUAcquisitionsQuota) : ''}
            ${this.generateBoxRow('27', 'TOTAL CUOTA DEVENGADA', report.ivaCollected.totalQuota, true)}
        </div>
    </div>

    <div class="section">
        <div class="section-title">II. IVA DEDUCIBLE (IVA Soportado)</div>
        <div class="boxes">
            ${this.generateBoxRow('12', 'Base deducible operaciones corrientes', report.ivaDeductible.currentOperationsBase)}
            ${this.generateBoxRow('13', 'Cuota deducible operaciones corrientes', report.ivaDeductible.currentOperationsQuota)}
            ${report.ivaDeductible.investmentGoodsBase ? this.generateBoxRow('14', 'Base deducible bienes de inversión', report.ivaDeductible.investmentGoodsBase) : ''}
            ${report.ivaDeductible.investmentGoodsQuota ? this.generateBoxRow('15', 'Cuota deducible bienes de inversión', report.ivaDeductible.investmentGoodsQuota) : ''}
            ${report.ivaDeductible.importsQuota ? this.generateBoxRow('16', 'Cuota deducible importaciones', report.ivaDeductible.importsQuota) : ''}
            ${report.ivaDeductible.intraEUQuota ? this.generateBoxRow('17', 'Cuota deducible adquisiciones intracomunitarias', report.ivaDeductible.intraEUQuota) : ''}
            ${report.ivaDeductible.compensationRE ? this.generateBoxRow('18', 'Compensaciones régimen especial', report.ivaDeductible.compensationRE) : ''}
            ${this.generateBoxRow('28', 'TOTAL CUOTA DEDUCIBLE', report.ivaDeductible.totalQuota, true)}
        </div>
    </div>

    <div class="section">
        <div class="section-title">III. RESULTADO</div>
        <div class="boxes">
            ${this.generateBoxRow('29', 'Resultado (27 - 28)', report.result.grossResult, false, true)}
            ${report.result.previousQuarterProportion ? this.generateBoxRow('30', 'A deducir por prorrata', report.result.previousQuarterProportion) : ''}
            ${report.result.proportionRegularization ? this.generateBoxRow('31', 'Regularización prorrata', report.result.proportionRegularization) : ''}
            ${report.result.previousReturnsToDeduct ? this.generateBoxRow('32', 'A deducir devoluciones anteriores', report.result.previousReturnsToDeduct) : ''}
            ${this.generateBoxRow('46', 'RESULTADO DE LA LIQUIDACIÓN', report.result.netResult, false, true)}
            ${report.result.toPay ? this.generateBoxRow('47', 'A INGRESAR', report.result.toPay, false, true) : ''}
            ${report.result.toReturn ? this.generateBoxRow('48', 'A DEVOLVER', report.result.toReturn, false, true) : ''}
        </div>
    </div>

    <div class="summary">
        <div class="result-line">
            <span>Total IVA Devengado (Repercutido):</span>
            <span>${this.formatCurrency(report.ivaCollected.totalQuota)}</span>
        </div>
        <div class="result-line">
            <span>Total IVA Deducible (Soportado):</span>
            <span>${this.formatCurrency(report.ivaDeductible.totalQuota)}</span>
        </div>
        <div class="final-result">
            <div class="result-line">
                <span>RESULTADO FINAL:</span>
                <span class="${report.result.toPay ? 'to-pay' : report.result.toReturn ? 'to-return' : ''}">
                    ${this.formatCurrency(report.result.netResult)}
                </span>
            </div>
            ${report.result.toPay ? `
            <div class="result-line to-pay" style="margin-top: 10px;">
                <span>A INGRESAR:</span>
                <span>${this.formatCurrency(report.result.toPay)}</span>
            </div>
            ` : ''}
            ${report.result.toReturn ? `
            <div class="result-line to-return" style="margin-top: 10px;">
                <span>A DEVOLVER:</span>
                <span>${this.formatCurrency(report.result.toReturn)}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="metadata">
        <strong>Información del Cálculo:</strong><br>
        ID Reporte: ${report.id}<br>
        Facturas emitidas: ${report.calculatedFrom?.invoiceCount || 0}<br>
        Facturas recibidas: ${report.calculatedFrom?.expenseCount || 0}<br>
        Fecha de cálculo: ${report.createdAt.toLocaleDateString('es-ES')}<br>
        Estado: ${this.getStatusLabel(report.status)}
    </div>

    <div class="footer">
        <p><strong>IMPORTANTE:</strong> Este documento es un resumen preliminar generado automáticamente.
        Debe ser revisado antes de su presentación ante la Agencia Tributaria.</p>
        <p>Plazo de presentación: ${deadlineDate}</p>
        <p>Generado por Operate/CoachOS - Sistema de Gestión Empresarial</p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate box row HTML
   */
  private generateBoxRow(
    number: string,
    description: string,
    value: number | undefined,
    isTotal: boolean = false,
    isResult: boolean = false,
  ): string {
    if (value === undefined || value === 0) {
      return '';
    }

    const rowClass = isTotal ? 'total' : isResult ? 'result' : '';

    return `
        <div class="box-row ${rowClass}">
            <div class="box-number">[${number}]</div>
            <div class="box-description">${description}</div>
            <div class="box-value">${this.formatCurrency(value)}</div>
        </div>
    `;
  }

  /**
   * Generate deadline warning
   */
  private generateDeadlineWarning(deadline: string): string {
    return `
        <div class="deadline-warning">
            <strong>⚠ Plazo de presentación:</strong> ${deadline}
        </div>
    `;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get quarter description
   */
  private getQuarterDescription(quarter: number): string {
    const descriptions = {
      1: 'Enero - Marzo',
      2: 'Abril - Junio',
      3: 'Julio - Septiembre',
      4: 'Octubre - Diciembre',
    };
    return descriptions[quarter] || '';
  }

  /**
   * Get month name in Spanish
   */
  private getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return months[month - 1] || '';
  }

  /**
   * Get status label
   */
  private getStatusLabel(status: string): string {
    const labels = {
      DRAFT: 'Borrador',
      CALCULATED: 'Calculado',
      VALIDATED: 'Validado',
      SUBMITTED: 'Presentado',
      ACCEPTED: 'Aceptado',
      REJECTED: 'Rechazado',
      ERROR: 'Error',
    };
    return labels[status] || status;
  }

  /**
   * Generate PDF from HTML using Puppeteer (production implementation)
   * Uncomment and use this in production
   */
  /*
  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    await browser.close();

    return pdf;
  }
  */
}
