/**
 * DEÜV Message Format Interfaces
 * Datenaustausch der Rentenversicherung (DEÜV) format definitions
 */

/**
 * DEÜV message types
 */
export enum DeuevMessageType {
  /** DSME - Meldung (Registration/Notification) */
  DSME = 'DSME',

  /** DSKK - Krankenkasse (Health insurance carrier data) */
  DSKK = 'DSKK',

  /** DSRV - Rentenversicherung (Pension insurance data) */
  DSRV = 'DSRV',

  /** DBNA - Betriebsnummernnachweis (Employer number verification) */
  DBNA = 'DBNA',

  /** DSAN - Sofortmeldung (Immediate notification) */
  DSAN = 'DSAN',
}

/**
 * Abgabegrund (Reason for submission) codes
 */
export enum Abgabegrund {
  /** 10 - Beginn der versicherungspflichtigen Beschäftigung */
  BEGINN = '10',

  /** 13 - Beginn einer geringfügigen Beschäftigung */
  BEGINN_GERINGFUEGIG = '13',

  /** 30 - Ende der Beschäftigung */
  ENDE = '30',

  /** 34 - Ende einer geringfügigen Beschäftigung */
  ENDE_GERINGFUEGIG = '34',

  /** 40 - Unterbrechung */
  UNTERBRECHUNG = '40',

  /** 50 - Änderung */
  AENDERUNG = '50',

  /** 51 - Änderung Beitragsgruppe */
  AENDERUNG_BEITRAGSGRUPPE = '51',

  /** 52 - Änderung Entgelt */
  AENDERUNG_ENTGELT = '52',
}

/**
 * Beitragsgruppen (Contribution groups)
 */
export interface Beitragsgruppen {
  /** Krankenversicherung (Health insurance): 0-6 */
  kv: string;

  /** Rentenversicherung (Pension insurance): 0-9 */
  rv: string;

  /** Arbeitslosenversicherung (Unemployment insurance): 0-2 */
  av: string;

  /** Pflegeversicherung (Nursing care insurance): 0-2 */
  pv: string;
}

/**
 * DSME record (Core registration data)
 */
export interface DsmeRecord {
  /** Record identifier */
  satzart: 'DSME';

  /** Betriebsnummer (Employer ID) */
  betriebsnummer: string;

  /** Versicherungsnummer (Insurance number) */
  versicherungsnummer: string;

  /** Nachname (Last name) */
  nachname: string;

  /** Vorname (First name) */
  vorname: string;

  /** Geburtsdatum (Date of birth) - TTMMJJJJ */
  geburtsdatum: string;

  /** Geschlecht (Gender) - M/W/D */
  geschlecht: 'M' | 'W' | 'D';

  /** Staatsangehörigkeit (Nationality) - ISO 3166-1 alpha-3 */
  staatsangehoerigkeit: string;

  /** Anschrift (Address) */
  anschrift: {
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
    land?: string;
  };

  /** Abgabegrund (Reason code) */
  abgabegrund: Abgabegrund;

  /** Meldezeitraum von (Period start) - TTMMJJJJ */
  zeitraumVon: string;

  /** Meldezeitraum bis (Period end) - TTMMJJJJ */
  zeitraumBis?: string;

  /** Beitragsgruppen */
  beitragsgruppen: Beitragsgruppen;

  /** Entgelt (Salary/Wage) in cents */
  entgelt?: number;

  /** Personengruppe (Person group): 101-190 */
  personengruppe: string;

  /** Tätigkeitsschlüssel (Activity key) */
  taetigkeitsschluessel?: string;
}

/**
 * DSKK record (Health insurance carrier data)
 */
export interface DskkRecord {
  /** Record identifier */
  satzart: 'DSKK';

  /** Betriebsnummer */
  betriebsnummer: string;

  /** Krankenkassen-IK (Health insurance carrier ID) */
  krankenkasseIk: string;

  /** Krankenkassen-Name */
  krankenkasseName: string;

  /** VKNR (4-digit health insurance number) */
  vknr?: string;
}

/**
 * DSRV record (Pension insurance data)
 */
export interface DsrvRecord {
  /** Record identifier */
  satzart: 'DSRV';

  /** Betriebsnummer */
  betriebsnummer: string;

  /** Träger der Rentenversicherung */
  rentenversicherungstraeger: string;

  /** Additional pension insurance data */
  zusatzangaben?: Record<string, any>;
}

/**
 * Complete DEÜV message
 */
export interface DeuevMessage {
  /** Message header */
  header: {
    /** DEÜV version */
    version: string;

    /** Absender (Sender) */
    absender: string;

    /** Erstellungsdatum (Creation date) - TTMMJJJJ */
    erstellungsdatum: string;

    /** Erstellungsuhrzeit (Creation time) - HHMMSS */
    erstellungsuhrzeit: string;

    /** Testkennung (Test indicator) */
    testkennung: boolean;
  };

  /** DSME records */
  dsmeRecords: DsmeRecord[];

  /** DSKK records */
  dskkRecords?: DskkRecord[];

  /** DSRV records */
  dsrvRecords?: DsrvRecord[];

  /** Message footer */
  footer?: {
    /** Total record count */
    recordCount: number;
  };
}

/**
 * DEÜV file format configuration
 */
export interface DeuevFormatConfig {
  /** Character encoding (usually ISO-8859-15) */
  encoding: string;

  /** Line ending type */
  lineEnding: '\r\n' | '\n';

  /** Fixed-width field formatting */
  fixedWidth: boolean;

  /** Field separator (if not fixed-width) */
  fieldSeparator?: string;
}
