import { Injectable, Logger } from '@nestjs/common';
import { VatCalculation } from './vat-calculation.service';
import { format } from 'date-fns';
import { randomUUID } from 'crypto';

/**
 * Organization data for ELSTER submission
 */
export interface ElsterOrganizationData {
  taxNumber: string; // Steuernummer (XXX/XXX/XXXXX)
  vatId?: string; // USt-IdNr. (DEXXXXXXXXX)
  taxOfficeId?: string; // Finanzamt number (4 digits)
  name: string;
}

/**
 * ELSTER XML Generation Options
 */
export interface ElsterXmlOptions {
  testMode?: boolean; // Generate XML for test environment
  includeSignature?: boolean; // Include signature placeholder
  transferTicket?: string; // Transfer ticket from previous submission
}

/**
 * ELSTER Kennzahlen (Tax Form Fields)
 */
export interface ElsterKennzahlen {
  kz81: number; // Steuerpflichtige Umsätze 19% (in cents)
  kz86: number; // Steuerpflichtige Umsätze 7% (in cents)
  kz43: number; // Steuerfreie Umsätze (in cents)
  kz41: number; // Innergemeinschaftliche Lieferungen (in cents)
  kz60: number; // Reverse Charge Umsätze (in cents)
  kz66: number; // Vorsteuerbeträge (in cents)
  kz61: number; // Innergemeinschaftliche Erwerbe Vorsteuer (in cents)
  kz62: number; // Einfuhrumsatzsteuer (in cents)
  kz83: number; // Verbleibende Umsatzsteuer-Vorauszahlung (in cents)
}

/**
 * ELSTER Submission Request
 */
export interface ElsterSubmissionRequest {
  steuernummer: string;
  finanzamt: string;
  jahr: number;
  zeitraum: string; // "01"-"12" for monthly, "41"-"44" for quarterly
  kennzahlen: ElsterKennzahlen;
}

/**
 * ELSTER XML Generator Service
 *
 * Generates ELSTER-compatible XML for German VAT returns (UStVA).
 * Follows the ELSTER ERiC XML schema for electronic tax filing.
 *
 * @see https://www.elster.de
 */
@Injectable()
export class ElsterXmlGeneratorService {
  private readonly logger = new Logger(ElsterXmlGeneratorService.name);

  /**
   * Generate UStVA XML from VAT calculation
   *
   * @param calculation VAT calculation result
   * @param org Organization data with tax information
   * @param options XML generation options
   * @returns ELSTER-compatible XML string
   */
  generateUstVaXml(
    calculation: VatCalculation,
    org: ElsterOrganizationData,
    options: ElsterXmlOptions = {},
  ): string {
    this.logger.log(
      `Generating UStVA XML for organization ${org.name}, period ${calculation.period}`,
    );

    const { testMode = false, includeSignature = false } = options;

    // Convert calculation to Kennzahlen (in cents)
    const kennzahlen: ElsterKennzahlen = {
      kz81: Math.round(calculation.umsaetze.steuerpflichtig19),
      kz86: Math.round(calculation.umsaetze.steuerpflichtig7),
      kz43: Math.round(calculation.umsaetze.steuerfrei),
      kz41: Math.round(calculation.umsaetze.euLieferungen),
      kz60: Math.round(calculation.umsaetze.reverseCharge),
      kz66: Math.round(calculation.vorsteuer.abziehbar),
      kz61: Math.round(calculation.vorsteuer.innergemeinschaftlich),
      kz62: Math.round(calculation.vorsteuer.einfuhr),
      kz83: Math.round(calculation.zahllast),
    };

    const { year, zeitraum } = this.parseElsterPeriod(calculation.period);
    const transferTicket = this.generateTicket();
    const datenlieferant = this.escapeXml(org.name);

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransferHeader version="11">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>UStVA</DatenArt>
    <Vorgang>${testMode ? 'send-NoSig-Test' : 'send-NoSig'}</Vorgang>
    <TransferTicket>${transferTicket}</TransferTicket>
    <Testmerker>${testMode ? '700000004' : '0'}</Testmerker>
    <HerstellerID>74931</HerstellerID>
    <DatenLieferant>${datenlieferant}</DatenLieferant>
    <Datum>${format(new Date(), 'yyyyMMdd')}</Datum>
    <Uhrzeit>${format(new Date(), 'HHmmss')}</Uhrzeit>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader version="11">
        <NutzdatenTicket>${this.generateTicket()}</NutzdatenTicket>
        <Empfaenger id="F">
          ${org.taxOfficeId ? `<Ziel id="${org.taxOfficeId}">${org.taxOfficeId}</Ziel>` : ''}
        </Empfaenger>
        <Hersteller>
          <ProduktName>Operate VAT System</ProduktName>
          <ProduktVersion>1.0</ProduktVersion>
        </Hersteller>
      </NutzdatenHeader>
      <Nutzdaten>
        <Anmeldungssteuern art="UStVA" version="202401">
          <DatenLieferant>
            <Name>${datenlieferant}</Name>
            <Steuernummer>${this.escapeXml(org.taxNumber)}</Steuernummer>
          </DatenLieferant>
          <Erstellungsdatum>${format(new Date(), 'yyyyMMdd')}</Erstellungsdatum>
          <Steuerfall>
            <Steuernummer>${this.escapeXml(org.taxNumber)}</Steuernummer>
            ${org.vatId ? `<Umsatzsteuer-ID>${this.escapeXml(org.vatId)}</Umsatzsteuer-ID>` : ''}
          </Steuerfall>
          <Erklarung>
            <Jahr>${year}</Jahr>
            <Zeitraum>${zeitraum}</Zeitraum>
            ${this.generateKennzahlenXml(kennzahlen)}
          </Erklarung>
        </Anmeldungssteuern>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;

    return xml;
  }

  /**
   * Generate submission request from VAT calculation
   */
  generateSubmissionRequest(
    calculation: VatCalculation,
    org: ElsterOrganizationData,
  ): ElsterSubmissionRequest {
    const { year, zeitraum } = this.parseElsterPeriod(calculation.period);

    const kennzahlen: ElsterKennzahlen = {
      kz81: Math.round(calculation.umsaetze.steuerpflichtig19),
      kz86: Math.round(calculation.umsaetze.steuerpflichtig7),
      kz43: Math.round(calculation.umsaetze.steuerfrei),
      kz41: Math.round(calculation.umsaetze.euLieferungen),
      kz60: Math.round(calculation.umsaetze.reverseCharge),
      kz66: Math.round(calculation.vorsteuer.abziehbar),
      kz61: Math.round(calculation.vorsteuer.innergemeinschaftlich),
      kz62: Math.round(calculation.vorsteuer.einfuhr),
      kz83: Math.round(calculation.zahllast),
    };

    return {
      steuernummer: org.taxNumber,
      finanzamt: org.taxOfficeId || '',
      jahr: year,
      zeitraum,
      kennzahlen,
    };
  }

  /**
   * Validate ELSTER XML structure
   */
  validateXml(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic XML validation
    if (!xml.includes('<?xml version="1.0"')) {
      errors.push('Missing XML declaration');
    }

    if (!xml.includes('<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">')) {
      errors.push('Missing ELSTER root element with namespace');
    }

    if (!xml.includes('<TransferHeader')) {
      errors.push('Missing TransferHeader');
    }

    if (!xml.includes('<DatenTeil>')) {
      errors.push('Missing DatenTeil');
    }

    if (!xml.includes('<Anmeldungssteuern art="UStVA"')) {
      errors.push('Missing UStVA declaration');
    }

    // Check for required fields
    if (!xml.includes('<Steuernummer>')) {
      errors.push('Missing tax number (Steuernummer)');
    }

    if (!xml.includes('<Jahr>')) {
      errors.push('Missing year');
    }

    if (!xml.includes('<Zeitraum>')) {
      errors.push('Missing period (Zeitraum)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate Kennzahlen XML section
   */
  private generateKennzahlenXml(kennzahlen: ElsterKennzahlen): string {
    const lines: string[] = [];

    // Only include non-zero values
    if (kennzahlen.kz81 > 0) {
      lines.push(`            <Kz81>${kennzahlen.kz81}</Kz81>`);
    }
    if (kennzahlen.kz86 > 0) {
      lines.push(`            <Kz86>${kennzahlen.kz86}</Kz86>`);
    }
    if (kennzahlen.kz43 > 0) {
      lines.push(`            <Kz43>${kennzahlen.kz43}</Kz43>`);
    }
    if (kennzahlen.kz41 > 0) {
      lines.push(`            <Kz41>${kennzahlen.kz41}</Kz41>`);
    }
    if (kennzahlen.kz60 > 0) {
      lines.push(`            <Kz60>${kennzahlen.kz60}</Kz60>`);
    }
    if (kennzahlen.kz66 > 0) {
      lines.push(`            <Kz66>${kennzahlen.kz66}</Kz66>`);
    }
    if (kennzahlen.kz61 > 0) {
      lines.push(`            <Kz61>${kennzahlen.kz61}</Kz61>`);
    }
    if (kennzahlen.kz62 > 0) {
      lines.push(`            <Kz62>${kennzahlen.kz62}</Kz62>`);
    }
    if (kennzahlen.kz83 > 0) {
      lines.push(`            <Kz83>${kennzahlen.kz83}</Kz83>`);
    }

    return lines.join('\n');
  }

  /**
   * Parse period string to ELSTER format
   *
   * @param period Format: "2025-Q1" or "2025-01"
   * @returns { year, zeitraum } where zeitraum is "01"-"12" for monthly, "41"-"44" for quarterly
   */
  private parseElsterPeriod(period: string): {
    year: number;
    zeitraum: string;
  } {
    const parts = period.split('-');
    const year = parseInt(parts[0], 10);

    if (parts[1].startsWith('Q')) {
      // Quarterly: Q1 -> 41, Q2 -> 42, Q3 -> 43, Q4 -> 44
      const quarter = parseInt(parts[1].substring(1), 10);
      const zeitraum = (40 + quarter).toString();
      return { year, zeitraum };
    } else {
      // Monthly: 01-12
      const month = parts[1].padStart(2, '0');
      return { year, zeitraum: month };
    }
  }

  /**
   * Generate ELSTER transfer ticket (unique ID)
   */
  private generateTicket(): string {
    return randomUUID().replace(/-/g, '').toUpperCase();
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get ELSTER field descriptions (for documentation)
   */
  getKennzahlenDescriptions(): Record<string, string> {
    return {
      kz81: 'Steuerpflichtige Umsätze zum Steuersatz 19% (in Cent)',
      kz86: 'Steuerpflichtige Umsätze zum Steuersatz 7% (in Cent)',
      kz43: 'Steuerfreie Umsätze (in Cent)',
      kz41: 'Innergemeinschaftliche Lieferungen (§4 Nr. 1b UStG) (in Cent)',
      kz60:
        'Steuerpflichtige Umsätze, für die der Leistungsempfänger die Steuer nach §13b UStG schuldet (in Cent)',
      kz66: 'Vorsteuerbeträge aus Rechnungen von anderen Unternehmern (in Cent)',
      kz61: 'Vorsteuerbeträge aus dem innergemeinschaftlichen Erwerb (in Cent)',
      kz62: 'Entstandene Einfuhrumsatzsteuer (in Cent)',
      kz83: 'Verbleibende Umsatzsteuer-Vorauszahlung / Überschuss (in Cent)',
    };
  }

  /**
   * Format amount for display (cents to EUR)
   */
  formatAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
  }

  /**
   * Get period description
   */
  getPeriodDescription(period: string): string {
    const parts = period.split('-');
    const year = parts[0];

    if (parts[1].startsWith('Q')) {
      const quarter = parts[1].substring(1);
      return `Q${quarter} ${year}`;
    } else {
      const month = parseInt(parts[1], 10);
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
  }
}
