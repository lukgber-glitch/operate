import {
  DeuevMessage,
  DsmeRecord,
  DskkRecord,
  DeuevMessageType,
  Abgabegrund,
  DeuevFormatConfig,
} from '../interfaces/deuev-message.interface';

/**
 * DEÜV Message Builder Utility
 * Builds DEÜV-compliant messages for social security reporting
 */
export class DeuevBuilder {
  private readonly formatConfig: DeuevFormatConfig = {
    encoding: 'ISO-8859-15',
    lineEnding: '\r\n',
    fixedWidth: true,
  };

  /**
   * Build complete DEÜV message
   */
  buildMessage(message: DeuevMessage): string {
    const lines: string[] = [];

    // Add header (VOSZ)
    lines.push(this.buildHeader(message.header));

    // Add DSME records
    for (const dsme of message.dsmeRecords) {
      lines.push(this.buildDsmeRecord(dsme));
    }

    // Add DSKK records if present
    if (message.dskkRecords) {
      for (const dskk of message.dskkRecords) {
        lines.push(this.buildDskkRecord(dskk));
      }
    }

    // Add footer (NCSZ)
    if (message.footer) {
      lines.push(this.buildFooter(message.footer.recordCount));
    }

    return lines.join(this.formatConfig.lineEnding);
  }

  /**
   * Build VOSZ header record
   */
  private buildHeader(header: DeuevMessage['header']): string {
    const parts: string[] = [];

    // VOSZ record identifier
    parts.push('VOSZ');

    // DEÜV version
    parts.push(this.padRight(header.version, 4));

    // Absender
    parts.push(this.padRight(header.absender, 15));

    // Creation date (TTMMJJJJ)
    parts.push(this.formatDate(header.erstellungsdatum));

    // Creation time (HHMMSS)
    parts.push(this.formatTime(header.erstellungsuhrzeit));

    // Test indicator (T or blank)
    parts.push(header.testkennung ? 'T' : ' ');

    return parts.join('');
  }

  /**
   * Build DSME (Meldung) record
   */
  private buildDsmeRecord(dsme: DsmeRecord): string {
    const parts: string[] = [];

    // Record identifier
    parts.push('DSME');

    // Betriebsnummer (8 digits)
    parts.push(this.padLeft(dsme.betriebsnummer, 8, '0'));

    // Versicherungsnummer (12 characters)
    parts.push(this.padRight(dsme.versicherungsnummer, 12));

    // Nachname (max 30 chars)
    parts.push(this.padRight(this.sanitize(dsme.nachname), 30));

    // Vorname (max 30 chars)
    parts.push(this.padRight(this.sanitize(dsme.vorname), 30));

    // Geburtsdatum (TTMMJJJJ)
    parts.push(this.formatDate(dsme.geburtsdatum));

    // Geschlecht (1 char: M/W/D)
    parts.push(dsme.geschlecht);

    // Staatsangehörigkeit (3 chars ISO 3166-1 alpha-3)
    parts.push(this.padRight(dsme.staatsangehoerigkeit, 3));

    // Anschrift - Straße (max 33 chars)
    parts.push(
      this.padRight(this.sanitize(dsme.anschrift.strasse), 33),
    );

    // Anschrift - Hausnummer (max 9 chars)
    parts.push(
      this.padRight(this.sanitize(dsme.anschrift.hausnummer), 9),
    );

    // Anschrift - PLZ (5 chars)
    parts.push(this.padRight(dsme.anschrift.plz, 5));

    // Anschrift - Ort (max 34 chars)
    parts.push(this.padRight(this.sanitize(dsme.anschrift.ort), 34));

    // Anschrift - Land (3 chars, optional, default DEU)
    parts.push(this.padRight(dsme.anschrift.land || 'DEU', 3));

    // Abgabegrund (2 chars)
    parts.push(this.padLeft(dsme.abgabegrund, 2, '0'));

    // Zeitraum von (TTMMJJJJ)
    parts.push(this.formatDate(dsme.zeitraumVon));

    // Zeitraum bis (TTMMJJJJ or blank)
    parts.push(
      dsme.zeitraumBis ? this.formatDate(dsme.zeitraumBis) : '        ',
    );

    // Beitragsgruppen (4 chars: KV RV AV PV)
    parts.push(dsme.beitragsgruppen.kv);
    parts.push(dsme.beitragsgruppen.rv);
    parts.push(dsme.beitragsgruppen.av);
    parts.push(dsme.beitragsgruppen.pv);

    // Entgelt (10 digits, in cents)
    if (dsme.entgelt !== undefined) {
      parts.push(this.padLeft(dsme.entgelt.toString(), 10, '0'));
    } else {
      parts.push('          ');
    }

    // Personengruppe (3 chars)
    parts.push(this.padRight(dsme.personengruppe, 3));

    // Tätigkeitsschlüssel (9 chars, optional)
    parts.push(
      this.padRight(dsme.taetigkeitsschluessel || '', 9),
    );

    return parts.join('');
  }

  /**
   * Build DSKK (Krankenkasse) record
   */
  private buildDskkRecord(dskk: DskkRecord): string {
    const parts: string[] = [];

    // Record identifier
    parts.push('DSKK');

    // Betriebsnummer (8 digits)
    parts.push(this.padLeft(dskk.betriebsnummer, 8, '0'));

    // Krankenkassen-IK (9 digits)
    parts.push(this.padLeft(dskk.krankenkasseIk, 9, '0'));

    // Krankenkassen-Name (max 50 chars)
    parts.push(this.padRight(this.sanitize(dskk.krankenkasseName), 50));

    // VKNR (4 digits, optional)
    if (dskk.vknr) {
      parts.push(this.padLeft(dskk.vknr, 4, '0'));
    } else {
      parts.push('    ');
    }

    return parts.join('');
  }

  /**
   * Build NCSZ footer record
   */
  private buildFooter(recordCount: number): string {
    const parts: string[] = [];

    // Record identifier
    parts.push('NCSZ');

    // Total record count (8 digits)
    parts.push(this.padLeft(recordCount.toString(), 8, '0'));

    return parts.join('');
  }

  /**
   * Format date to DEÜV format (TTMMJJJJ)
   */
  private formatDate(date: string): string {
    // Input: ISO 8601 (YYYY-MM-DD) or TTMMJJJJ
    if (date.length === 8 && /^\d{8}$/.test(date)) {
      return date; // Already in correct format
    }

    // Parse ISO date
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());

    return `${day}${month}${year}`;
  }

  /**
   * Format time to DEÜV format (HHMMSS)
   */
  private formatTime(time: string): string {
    // Input: HHMMSS or HH:MM:SS
    if (time.length === 6 && /^\d{6}$/.test(time)) {
      return time;
    }

    // Remove colons if present
    return time.replace(/:/g, '').padEnd(6, '0');
  }

  /**
   * Sanitize string for DEÜV (remove special chars, convert umlauts)
   */
  private sanitize(input: string): string {
    return (
      input
        .toUpperCase()
        // Convert German umlauts
        .replace(/Ä/g, 'AE')
        .replace(/Ö/g, 'OE')
        .replace(/Ü/g, 'UE')
        .replace(/ß/g, 'SS')
        // Remove unsupported characters
        .replace(/[^A-Z0-9 \-\.]/g, '')
    );
  }

  /**
   * Pad string to the right with spaces
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ').substring(0, length);
  }

  /**
   * Pad string to the left with specified character
   */
  private padLeft(str: string, length: number, char = ' '): string {
    return str.padStart(length, char).substring(0, length);
  }

  /**
   * Validate DEÜV message structure
   */
  validateMessage(message: DeuevMessage): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate header
    if (!message.header.version) {
      errors.push('Missing DEÜV version');
    }
    if (!message.header.absender) {
      errors.push('Missing sender (Absender)');
    }

    // Validate DSME records
    if (!message.dsmeRecords || message.dsmeRecords.length === 0) {
      errors.push('No DSME records found');
    }

    message.dsmeRecords.forEach((dsme, index) => {
      if (!/^\d{8}$/.test(dsme.betriebsnummer)) {
        errors.push(
          `DSME[${index}]: Invalid Betriebsnummer format`,
        );
      }
      if (!/^\d{8}[A-Z]\d{3}$/.test(dsme.versicherungsnummer)) {
        errors.push(
          `DSME[${index}]: Invalid Versicherungsnummer format`,
        );
      }
      if (!/^\d{5}$/.test(dsme.anschrift.plz)) {
        errors.push(`DSME[${index}]: Invalid postal code format`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate message checksum (if required by carrier)
   */
  calculateChecksum(message: string): string {
    let sum = 0;
    for (let i = 0; i < message.length; i++) {
      sum += message.charCodeAt(i);
    }
    return sum.toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Create minimal DEÜV message for testing
   */
  static createTestMessage(
    betriebsnummer: string,
    absender: string,
  ): DeuevMessage {
    const now = new Date();

    return {
      header: {
        version: '8.1',
        absender,
        erstellungsdatum: now.toISOString().split('T')[0],
        erstellungsuhrzeit: now
          .toTimeString()
          .split(' ')[0]
          .replace(/:/g, ''),
        testkennung: true,
      },
      dsmeRecords: [
        {
          satzart: 'DSME',
          betriebsnummer,
          versicherungsnummer: '12345678A901',
          nachname: 'TESTMANN',
          vorname: 'TEST',
          geburtsdatum: '01011990',
          geschlecht: 'M',
          staatsangehoerigkeit: 'DEU',
          anschrift: {
            strasse: 'TESTSTRASSE',
            hausnummer: '1',
            plz: '12345',
            ort: 'TESTSTADT',
          },
          abgabegrund: Abgabegrund.BEGINN,
          zeitraumVon: '01012024',
          beitragsgruppen: {
            kv: '1',
            rv: '1',
            av: '1',
            pv: '1',
          },
          personengruppe: '101',
        },
      ],
      footer: {
        recordCount: 1,
      },
    };
  }
}
