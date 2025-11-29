import { Builder } from 'xml2js';
import { Logger } from '@nestjs/common';
import {
  VATReturnSubmission,
  IncomeTaxSubmission,
  EmployeeTaxSubmission,
  ElsterSubmissionType,
} from '../interfaces/elster-submission.interface';
import { ElsterTransmissionMeta } from '../interfaces/elster-config.interface';

/**
 * ELSTER XML Builder Utility
 * Generates ELSTER-compliant XML documents for tax submissions
 */
export class ElsterXmlBuilderUtil {
  private static readonly logger = new Logger(ElsterXmlBuilderUtil.name);
  private static readonly XML_VERSION = '1.0';
  private static readonly XML_ENCODING = 'ISO-8859-1';
  private static readonly ELSTER_VERSION = '11';

  /**
   * Build VAT return XML (Umsatzsteuervoranmeldung)
   */
  static buildVATReturnXml(
    submission: VATReturnSubmission,
    meta: ElsterTransmissionMeta,
  ): string {
    try {
      const xmlData = {
        Elster: {
          $: {
            xmlns: 'http://www.elster.de/elsterxml/schema/v11',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          },
          TransferHeader: this.buildTransferHeader(meta),
          DatenTeil: {
            Nutzdatenblock: {
              NutzdatenHeader: this.buildNutzdatenHeader(
                'UStVA',
                submission,
              ),
              Nutzdaten: {
                UStVA: this.buildUStVAData(submission),
              },
            },
          },
        },
      };

      return this.buildXmlString(xmlData);
    } catch (error) {
      this.logger.error('Failed to build VAT return XML', error);
      throw new Error(`XML generation failed: ${error.message}`);
    }
  }

  /**
   * Build income tax return XML (Einkommensteuererklärung)
   */
  static buildIncomeTaxReturnXml(
    submission: IncomeTaxSubmission,
    meta: ElsterTransmissionMeta,
  ): string {
    try {
      const xmlData = {
        Elster: {
          $: {
            xmlns: 'http://www.elster.de/elsterxml/schema/v11',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          },
          TransferHeader: this.buildTransferHeader(meta),
          DatenTeil: {
            Nutzdatenblock: {
              NutzdatenHeader: this.buildNutzdatenHeader('ESt', submission),
              Nutzdaten: {
                ESt: this.buildEStData(submission),
              },
            },
          },
        },
      };

      return this.buildXmlString(xmlData);
    } catch (error) {
      this.logger.error('Failed to build income tax return XML', error);
      throw new Error(`XML generation failed: ${error.message}`);
    }
  }

  /**
   * Build employee tax XML (Lohnsteueranmeldung)
   */
  static buildEmployeeTaxXml(
    submission: EmployeeTaxSubmission,
    meta: ElsterTransmissionMeta,
  ): string {
    try {
      const xmlData = {
        Elster: {
          $: {
            xmlns: 'http://www.elster.de/elsterxml/schema/v11',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          },
          TransferHeader: this.buildTransferHeader(meta),
          DatenTeil: {
            Nutzdatenblock: {
              NutzdatenHeader: this.buildNutzdatenHeader(
                'Lohn',
                submission,
              ),
              Nutzdaten: {
                Lohn: this.buildLohnData(submission),
              },
            },
          },
        },
      };

      return this.buildXmlString(xmlData);
    } catch (error) {
      this.logger.error('Failed to build employee tax XML', error);
      throw new Error(`XML generation failed: ${error.message}`);
    }
  }

  /**
   * Build transfer header (TransferHeader)
   */
  private static buildTransferHeader(meta: ElsterTransmissionMeta) {
    return {
      $: { version: this.ELSTER_VERSION },
      Verfahren: meta.dataType,
      DatenArt: meta.dataType,
      Vorgang: 'send-Auth',
      TransferTicket: meta.transmissionId,
      Testmerker: meta.testSubmission ? '700000004' : '000000000',
      SigUser: {}, // Will be filled with certificate data
      DatenLieferant: meta.dataType,
      Datei: {
        Verschluesselung: meta.encrypted ? 'PKCS#7v1.5' : 'unverschluesselt',
        Kompression: meta.compressed ? 'GZIP' : 'unkomprimiert',
        DatenGroesse: '0', // Will be calculated
        TransportSchluessel: '', // Will be generated if encrypted
      },
      RC: {
        Rueckgabe: {},
        Stack: {},
      },
      VersionClient: '1.0',
    };
  }

  /**
   * Build Nutzdatenheader
   */
  private static buildNutzdatenHeader(
    dataType: string,
    submission: any,
  ) {
    return {
      $: { version: this.ELSTER_VERSION },
      NutzdatenTicket: submission.id || this.generateTicket(),
      Empfaenger: {
        $: { id: 'F' },
      },
      Hersteller: {
        ProduktName: 'Operate/CoachOS',
        ProduktVersion: '1.0',
      },
      DatenLieferant: submission.taxId,
      Zusatz: {
        Info: dataType,
        ElsterInfo: {},
      },
    };
  }

  /**
   * Build UStVA data section (VAT return)
   */
  private static buildUStVAData(submission: VATReturnSubmission) {
    const period = this.parseTaxPeriod(submission.taxPeriod);

    return {
      $: { version: this.ELSTER_VERSION },
      Jahr: submission.taxYear,
      Zeitraum: period.zeitraum,
      Steuernummer: submission.taxId,
      Kz09: submission.taxYear, // Tax year
      Kz10: period.period, // Period number

      // Taxable sales at 19%
      Kz81: this.formatCurrency(submission.taxableSales19),
      // Kz81_Umsatz: this.formatCurrency(submission.vat19),

      // Taxable sales at 7%
      Kz86: this.formatCurrency(submission.taxableSales7),
      // Kz86_Umsatz: this.formatCurrency(submission.vat7),

      // Intra-community acquisitions
      ...(submission.intraCommunityAcquisitions && {
        Kz91: this.formatCurrency(submission.intraCommunityAcquisitions),
        // Kz91_Umsatz: this.formatCurrency(submission.vatIntraCommunity),
      }),

      // Tax-free intra-community deliveries
      ...(submission.otherTaxableSales && {
        Kz41: this.formatCurrency(submission.otherTaxableSales),
      }),

      // Input tax deduction
      Kz66: this.formatCurrency(submission.inputTaxDeduction),

      // Total VAT
      Kz83: this.formatCurrency(submission.totalVat),

      // Special circumstances
      ...(submission.specialCircumstances && {
        Bemerkung: submission.specialCircumstances,
      }),
    };
  }

  /**
   * Build ESt data section (Income tax)
   */
  private static buildEStData(submission: IncomeTaxSubmission) {
    return {
      $: { version: this.ELSTER_VERSION },
      Jahr: submission.taxYear,
      Steuernummer: submission.taxId,

      // Taxpayer personal data
      Vorname: submission.taxpayer.firstName,
      Nachname: submission.taxpayer.lastName,
      Geburtsdatum: this.formatDate(submission.taxpayer.dateOfBirth),
      IdNr: submission.taxpayer.taxId,

      // Address
      Strasse: submission.taxpayer.address.street,
      Hausnummer: submission.taxpayer.address.houseNumber,
      PLZ: submission.taxpayer.address.postalCode,
      Ort: submission.taxpayer.address.city,

      // Spouse data (if joint filing)
      ...(submission.spouse && {
        VornameEhegatte: submission.spouse.firstName,
        NachnameEhegatte: submission.spouse.lastName,
        GeburtsdatumEhegatte: this.formatDate(submission.spouse.dateOfBirth),
        IdNrEhegatte: submission.spouse.taxId,
      }),

      // Income sections
      EinkuenfteNichtselbstaendigeArbeit: this.formatCurrency(
        submission.employmentIncome,
      ),

      ...(submission.selfEmploymentIncome && {
        EinkuenfteSelbstaendigeArbeit: this.formatCurrency(
          submission.selfEmploymentIncome,
        ),
      }),

      ...(submission.capitalIncome && {
        EinkuenfteKapitalvermoegen: this.formatCurrency(
          submission.capitalIncome,
        ),
      }),

      ...(submission.rentalIncome && {
        EinkuenfteVermietung: this.formatCurrency(submission.rentalIncome),
      }),

      // Deductions
      ...(submission.specialExpenses && {
        Sonderausgaben: this.formatCurrency(submission.specialExpenses),
      }),

      ...(submission.extraordinaryExpenses && {
        AussergewoehnlicheBelastungen: this.formatCurrency(
          submission.extraordinaryExpenses,
        ),
      }),

      // Church tax
      Kirchensteuerpflicht: submission.churchTaxApplicable ? '1' : '0',
    };
  }

  /**
   * Build Lohn data section (Employee tax)
   */
  private static buildLohnData(submission: EmployeeTaxSubmission) {
    const period = this.parseTaxPeriod(submission.taxPeriod);

    return {
      $: { version: this.ELSTER_VERSION },
      Jahr: submission.taxYear,
      Zeitraum: period.zeitraum,
      Steuernummer: submission.employer.taxNumber,

      // Employer information
      Betriebsnummer: submission.employer.operatingNumber,
      Firmenname: submission.employer.companyName,

      // Period
      Monat: period.period,

      // Totals
      Bruttolohn: this.formatCurrency(submission.totalGrossWages),
      Lohnsteuer: this.formatCurrency(submission.totalWageTax),
      Solidaritaetszuschlag: this.formatCurrency(
        submission.solidaritySurcharge,
      ),

      ...(submission.churchTax && {
        Kirchensteuer: this.formatCurrency(submission.churchTax),
      }),

      // Employee count
      AnzahlArbeitnehmer: submission.numberOfEmployees,

      // Social security
      Krankenversicherung: this.formatCurrency(
        submission.socialSecurityContributions.healthInsurance,
      ),
      Rentenversicherung: this.formatCurrency(
        submission.socialSecurityContributions.pensionInsurance,
      ),
      Arbeitslosenversicherung: this.formatCurrency(
        submission.socialSecurityContributions.unemploymentInsurance,
      ),
      Pflegeversicherung: this.formatCurrency(
        submission.socialSecurityContributions.careInsurance,
      ),

      // Special payments
      ...(submission.specialPayments && {
        Sonderzahlungen: this.formatCurrency(submission.specialPayments),
      }),
    };
  }

  /**
   * Build XML string from object
   */
  private static buildXmlString(xmlData: any): string {
    const builder = new Builder({
      xmldec: {
        version: this.XML_VERSION,
        encoding: this.XML_ENCODING,
      },
      renderOpts: {
        pretty: true,
        indent: '  ',
        newline: '\n',
      },
    });

    return builder.buildObject(xmlData);
  }

  /**
   * Format currency for ELSTER (German decimal format)
   */
  private static formatCurrency(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  /**
   * Format date for ELSTER (YYYYMMDD)
   */
  private static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Parse tax period to ELSTER format
   */
  private static parseTaxPeriod(taxPeriod: string): {
    zeitraum: string;
    period: string;
  } {
    // Quarterly: Q1, Q2, Q3, Q4
    if (taxPeriod.startsWith('Q')) {
      const quarter = taxPeriod.substring(1);
      return {
        zeitraum: `${quarter}1`, // Quarterly designation
        period: quarter,
      };
    }

    // Monthly: 01-12
    return {
      zeitraum: '01', // Monthly designation
      period: taxPeriod,
    };
  }

  /**
   * Generate unique ticket ID
   */
  private static generateTicket(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TICKET-${timestamp}-${random}`;
  }

  /**
   * Validate XML against ELSTER schema (placeholder)
   */
  static validateXml(xml: string): { valid: boolean; errors: string[] } {
    // TODO: Implement proper XML schema validation
    // For now, basic validation
    const errors: string[] = [];

    if (!xml.includes('<?xml')) {
      errors.push('Missing XML declaration');
    }

    if (!xml.includes('<Elster')) {
      errors.push('Missing Elster root element');
    }

    if (!xml.includes('</Elster>')) {
      errors.push('Missing Elster closing tag');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compress XML for transmission (GZIP)
   */
  static async compressXml(xml: string): Promise<Buffer> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(xml, 'utf8'), (err: Error | null, result: Buffer) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * Calculate XML size
   */
  static calculateXmlSize(xml: string): number {
    return Buffer.from(xml, 'utf8').length;
  }
}
