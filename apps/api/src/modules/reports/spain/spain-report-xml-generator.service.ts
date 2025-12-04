/**
 * Spain Report XML Generator Service
 * Generates AEAT-compatible XML files for Spanish tax reports
 * Task: W25-T4
 */

import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import {
  Modelo303Report,
  SpainReportBase,
  SpainReportType,
} from './interfaces/spain-report.interface';
import {
  MODELO_303_BOXES,
  MODELO_303_XML_SCHEMA,
  MODELO_303_DEFAULTS,
} from './constants/modelo-303.constants';

@Injectable()
export class SpainReportXmlGeneratorService {
  private readonly logger = new Logger(SpainReportXmlGeneratorService.name);

  /**
   * Generate XML for any Spain report
   */
  async generateXml(report: SpainReportBase): Promise<string> {
    switch (report.type) {
      case SpainReportType.MODELO_303:
        return this.generateModelo303Xml(report as Modelo303Report);
      case SpainReportType.MODELO_390:
      case SpainReportType.MODELO_111:
      case SpainReportType.MODELO_347:
        throw new Error(`XML generation for ${report.type} not yet implemented`);
      default:
        throw new Error(`Unknown report type: ${report.type}`);
    }
  }

  /**
   * Generate Modelo 303 XML for AEAT submission
   */
  private generateModelo303Xml(report: Modelo303Report): string {
    this.logger.log(`Generating Modelo 303 XML for report ${report.id}`);

    const quarterCode = this.getQuarterCode(report.period.quarter!);

    // Build XML document
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('soapenv:Envelope', {
        'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        'xmlns:mod': MODELO_303_XML_SCHEMA.NAMESPACE,
      })
      .ele('soapenv:Header')
      .up()
      .ele('soapenv:Body')
      .ele('mod:Modelo303')
      // Taxpayer identification
      .ele('mod:Cabecera')
      .ele('mod:NIF')
      .txt(report.taxpayer.nif)
      .up()
      .ele('mod:Ejercicio')
      .txt(report.period.year.toString())
      .up()
      .ele('mod:Periodo')
      .txt(quarterCode)
      .up()
      .up();

    // Add IVA Devengado (Collected VAT)
    const devengado = doc.ele('mod:IVADevengado');

    if (report.ivaCollected.base21 > 0) {
      devengado
        .ele('mod:Casilla01')
        .txt(this.formatAmount(report.ivaCollected.base21))
        .up()
        .ele('mod:Casilla02')
        .txt(this.formatAmount(report.ivaCollected.quota21))
        .up();
    }

    if (report.ivaCollected.base10 > 0) {
      devengado
        .ele('mod:Casilla03')
        .txt(this.formatAmount(report.ivaCollected.base10))
        .up()
        .ele('mod:Casilla04')
        .txt(this.formatAmount(report.ivaCollected.quota10))
        .up();
    }

    if (report.ivaCollected.base4 > 0) {
      devengado
        .ele('mod:Casilla05')
        .txt(this.formatAmount(report.ivaCollected.base4))
        .up()
        .ele('mod:Casilla06')
        .txt(this.formatAmount(report.ivaCollected.quota4))
        .up();
    }

    if (report.ivaCollected.intraEUAcquisitionsBase) {
      devengado
        .ele('mod:Casilla10')
        .txt(this.formatAmount(report.ivaCollected.intraEUAcquisitionsBase))
        .up()
        .ele('mod:Casilla11')
        .txt(this.formatAmount(report.ivaCollected.intraEUAcquisitionsQuota!))
        .up();
    }

    devengado
      .ele('mod:Casilla27')
      .txt(this.formatAmount(report.ivaCollected.totalQuota))
      .up();

    devengado.up(); // Close IVADevengado

    // Add IVA Deducible (Deductible VAT)
    const deducible = doc.ele('mod:IVADeducible');

    if (report.ivaDeductible.currentOperationsBase > 0) {
      deducible
        .ele('mod:Casilla12')
        .txt(this.formatAmount(report.ivaDeductible.currentOperationsBase))
        .up()
        .ele('mod:Casilla13')
        .txt(this.formatAmount(report.ivaDeductible.currentOperationsQuota))
        .up();
    }

    if (report.ivaDeductible.investmentGoodsBase) {
      deducible
        .ele('mod:Casilla14')
        .txt(this.formatAmount(report.ivaDeductible.investmentGoodsBase))
        .up()
        .ele('mod:Casilla15')
        .txt(this.formatAmount(report.ivaDeductible.investmentGoodsQuota!))
        .up();
    }

    if (report.ivaDeductible.importsQuota) {
      deducible
        .ele('mod:Casilla16')
        .txt(this.formatAmount(report.ivaDeductible.importsQuota))
        .up();
    }

    if (report.ivaDeductible.intraEUQuota) {
      deducible
        .ele('mod:Casilla17')
        .txt(this.formatAmount(report.ivaDeductible.intraEUQuota))
        .up();
    }

    if (report.ivaDeductible.compensationRE) {
      deducible
        .ele('mod:Casilla18')
        .txt(this.formatAmount(report.ivaDeductible.compensationRE))
        .up();
    }

    deducible
      .ele('mod:Casilla28')
      .txt(this.formatAmount(report.ivaDeductible.totalQuota))
      .up();

    deducible.up(); // Close IVADeducible

    // Add Result
    const resultado = doc.ele('mod:Resultado');

    resultado
      .ele('mod:Casilla29')
      .txt(this.formatAmount(report.result.grossResult))
      .up();

    if (report.result.previousQuarterProportion) {
      resultado
        .ele('mod:Casilla30')
        .txt(this.formatAmount(report.result.previousQuarterProportion))
        .up();
    }

    if (report.result.proportionRegularization) {
      resultado
        .ele('mod:Casilla31')
        .txt(this.formatAmount(report.result.proportionRegularization))
        .up();
    }

    if (report.result.previousReturnsToDeduct) {
      resultado
        .ele('mod:Casilla32')
        .txt(this.formatAmount(report.result.previousReturnsToDeduct))
        .up();
    }

    resultado
      .ele('mod:Casilla46')
      .txt(this.formatAmount(report.result.netResult))
      .up();

    if (report.result.toPay) {
      resultado
        .ele('mod:Casilla47')
        .txt(this.formatAmount(report.result.toPay))
        .up();
    }

    if (report.result.toReturn) {
      resultado
        .ele('mod:Casilla48')
        .txt(this.formatAmount(report.result.toReturn))
        .up();
    }

    resultado.up(); // Close Resultado

    // Add special information if exists
    if (report.specialInfo) {
      const info = doc.ele('mod:InformacionAdicional');

      if (report.specialInfo.isMonthlyFiler) {
        info.ele('mod:Casilla49').txt('X').up();
      }

      if (report.specialInfo.isInsolvent) {
        info.ele('mod:Casilla50').txt('X').up();
      }

      if (report.specialInfo.hasReverseChargeOperations) {
        info.ele('mod:Casilla51').txt('X').up();
      }

      if (report.specialInfo.hasCashAccountingRegime) {
        info.ele('mod:Casilla52').txt('X').up();
      }

      if (report.specialInfo.simplifiedRegimeActivities) {
        info
          .ele('mod:Casilla53')
          .txt(report.specialInfo.simplifiedRegimeActivities)
          .up();
      }

      info.up(); // Close InformacionAdicional
    }

    // Close all remaining elements
    doc.up().up().up();

    // Generate XML string
    const xml = doc.end({ prettyPrint: true });

    this.logger.log(`Modelo 303 XML generated successfully`);

    return xml;
  }

  /**
   * Get quarter code for AEAT
   */
  private getQuarterCode(quarter: number): string {
    return `${quarter}T`;
  }

  /**
   * Format amount for XML (2 decimal places)
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Generate simplified XML for manual upload
   * This is a simpler format that can be manually uploaded to AEAT website
   */
  async generateSimplifiedXml(report: Modelo303Report): Promise<string> {
    this.logger.log(
      `Generating simplified Modelo 303 XML for report ${report.id}`,
    );

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('Modelo303')
      .ele('Identificacion')
      .ele('NIF')
      .txt(report.taxpayer.nif)
      .up()
      .ele('NombreRazon')
      .txt(report.taxpayer.name)
      .up()
      .ele('Ejercicio')
      .txt(report.period.year.toString())
      .up()
      .ele('Periodo')
      .txt(this.getQuarterCode(report.period.quarter!))
      .up()
      .up();

    // Add boxes with values
    const boxes = doc.ele('Boxes');

    this.addBox(boxes, '01', report.ivaCollected.base21);
    this.addBox(boxes, '02', report.ivaCollected.quota21);
    this.addBox(boxes, '03', report.ivaCollected.base10);
    this.addBox(boxes, '04', report.ivaCollected.quota10);
    this.addBox(boxes, '05', report.ivaCollected.base4);
    this.addBox(boxes, '06', report.ivaCollected.quota4);

    if (report.ivaCollected.intraEUAcquisitionsBase) {
      this.addBox(boxes, '10', report.ivaCollected.intraEUAcquisitionsBase);
      this.addBox(boxes, '11', report.ivaCollected.intraEUAcquisitionsQuota!);
    }

    this.addBox(boxes, '27', report.ivaCollected.totalQuota);

    this.addBox(boxes, '12', report.ivaDeductible.currentOperationsBase);
    this.addBox(boxes, '13', report.ivaDeductible.currentOperationsQuota);

    if (report.ivaDeductible.investmentGoodsBase) {
      this.addBox(boxes, '14', report.ivaDeductible.investmentGoodsBase);
      this.addBox(boxes, '15', report.ivaDeductible.investmentGoodsQuota!);
    }

    if (report.ivaDeductible.importsQuota) {
      this.addBox(boxes, '16', report.ivaDeductible.importsQuota);
    }

    if (report.ivaDeductible.intraEUQuota) {
      this.addBox(boxes, '17', report.ivaDeductible.intraEUQuota);
    }

    this.addBox(boxes, '28', report.ivaDeductible.totalQuota);
    this.addBox(boxes, '29', report.result.grossResult);
    this.addBox(boxes, '46', report.result.netResult);

    if (report.result.toPay) {
      this.addBox(boxes, '47', report.result.toPay);
    }

    if (report.result.toReturn) {
      this.addBox(boxes, '48', report.result.toReturn);
    }

    boxes.up();

    // Metadata
    doc
      .ele('Metadata')
      .ele('GeneratedAt')
      .txt(new Date().toISOString())
      .up()
      .ele('ReportId')
      .txt(report.id)
      .up()
      .ele('InvoiceCount')
      .txt(report.calculatedFrom?.invoiceCount.toString() || '0')
      .up()
      .ele('ExpenseCount')
      .txt(report.calculatedFrom?.expenseCount.toString() || '0')
      .up()
      .up();

    doc.up();

    return doc.end({ prettyPrint: true });
  }

  /**
   * Add box to XML
   */
  private addBox(
    parent: any,
    boxNumber: string,
    value: number | undefined,
  ): void {
    if (value !== undefined && value !== 0) {
      parent
        .ele('Box')
        .att('number', boxNumber)
        .txt(this.formatAmount(value))
        .up();
    }
  }

  /**
   * Validate XML against AEAT schema (simplified check)
   */
  validateXml(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!xml.includes('Modelo303')) {
      errors.push('Missing Modelo303 root element');
    }

    if (!xml.includes('NIF')) {
      errors.push('Missing NIF element');
    }

    if (!xml.includes('Ejercicio')) {
      errors.push('Missing Ejercicio (year) element');
    }

    if (!xml.includes('Periodo')) {
      errors.push('Missing Periodo (quarter) element');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
