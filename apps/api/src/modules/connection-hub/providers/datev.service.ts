import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  TokenResponse,
  DATEVCredentials,
  DATEVBookingRecord,
  DATEVAccount,
  DATEVExportFormat,
  DATEVSyncResult,
  DATEVError,
  DATEVErrorResponse,
  DATEVExportRequest,
  DATEVImportResult,
  DATEVASCIIHeader,
  DATEVChartOfAccounts,
} from './datev.types';
import {
  DATEV_API,
  DATEV_SCOPES,
  DATEV_ASCII_FORMAT,
  DATEV_TAX_KEYS,
  DATEV_FIELD_LENGTHS,
  DATEV_DATE_FORMATS,
  DATEV_DELIMITERS,
  DATEV_DEFAULTS,
  DATEV_ERROR_CODES,
  DATEV_CHART_OF_ACCOUNTS_MAP,
} from './datev.constants';

/**
 * DATEV Integration Service
 * Handles OAuth 2.0 authentication and DATEV API interactions
 *
 * DATEV ist die führende Buchhaltungssoftware für deutsche Steuerberater.
 * Diese Integration ermöglicht den Datenaustausch zwischen Operate und DATEV.
 *
 * Features:
 * - OAuth 2.0 authorization flow
 * - Export von Buchungen im DATEV ASCII Format
 * - Import von DATEV Buchungsdaten
 * - Synchronisation von Kontenrahmen (SKR03/SKR04)
 * - Export von Rechnungen im DATEV Format
 * - XML Format für digitale Belege
 *
 * Configuration Required:
 * - DATEV_CLIENT_ID
 * - DATEV_CLIENT_SECRET
 * - DATEV_CONSULTANT_NUMBER
 * - DATEV_CLIENT_NUMBER
 *
 * @see https://developer.datev.de/
 */
@Injectable()
export class DATEVService {
  private readonly logger = new Logger(DATEVService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get OAuth 2.0 authorization URL
   *
   * @param orgId - Organization ID (used as state parameter)
   * @param redirectUri - OAuth callback redirect URI
   * @param scopes - Optional custom scopes (defaults to accounting scopes)
   * @returns Authorization URL for user to visit
   */
  getAuthorizationUrl(
    orgId: string,
    redirectUri: string,
    scopes?: string[],
  ): string {
    const clientId = this.configService.get<string>('DATEV_CLIENT_ID');

    if (!clientId) {
      this.logger.error('DATEV_CLIENT_ID not configured');
      throw new BadRequestException(
        'DATEV integration is not configured on this server',
      );
    }

    const scopeList = scopes || DATEV_SCOPES;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopeList.join(' '),
      state: orgId,
    });

    const url = `${DATEV_API.AUTH_URL}?${params.toString()}`;

    this.logger.log(`Generated DATEV OAuth URL for org: ${orgId}`);

    return url;
  }

  /**
   * Exchange authorization code for access tokens
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Same redirect URI used in authorization request
   * @returns Token response with access and refresh tokens
   */
  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('DATEV_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DATEV_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.error('DATEV OAuth credentials not configured');
      throw new BadRequestException(
        'DATEV integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        DATEV_API.TOKEN_URL,
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully exchanged DATEV OAuth code for tokens');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange DATEV OAuth code', error);
      this.handleApiError(error as AxiosError<DATEVErrorResponse>);
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Valid refresh token
   * @returns New token response
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('DATEV_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DATEV_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.error('DATEV OAuth credentials not configured');
      throw new BadRequestException(
        'DATEV integration is not configured on this server',
      );
    }

    try {
      const response = await axios.post<TokenResponse>(
        DATEV_API.TOKEN_URL,
        new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully refreshed DATEV access token');

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh DATEV access token', error);
      this.handleApiError(error as AxiosError<DATEVErrorResponse>);
    }
  }

  /**
   * Exchange authorization code for access tokens (wrapper for OAuth callback)
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Same redirect URI used in authorization request
   * @returns Simplified token response
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const response = await this.exchangeCode(code, redirectUri || '');
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
    };
  }

  /**
   * Export bookings to DATEV ASCII format
   * Exportiert Buchungen im DATEV ASCII Format für Import in DATEV
   *
   * @param credentials - DATEV credentials (consultant number, client number, etc.)
   * @param bookings - Array of booking records to export
   * @param exportRequest - Export parameters (dates, chart of accounts, etc.)
   * @returns ASCII formatted string ready for DATEV import
   */
  exportBookingsToASCII(
    credentials: DATEVCredentials,
    bookings: DATEVBookingRecord[],
    exportRequest: DATEVExportRequest,
  ): string {
    this.logger.log(
      `Exporting ${bookings.length} bookings to DATEV ASCII format`,
    );

    // Validierung der Pflichtfelder
    this.validateCredentials(credentials);

    // Header erstellen (Zeile 1: Metadaten)
    const header = this.buildASCIIHeader(credentials, exportRequest);
    const headerLine1 = this.serializeHeaderLine1(header);

    // Zeile 2: Spaltenüberschriften
    const headerLine2 = this.getASCIIColumnHeaders();

    // Buchungssätze konvertieren
    const bookingLines = bookings
      .map((booking, index) => {
        try {
          return this.serializeBookingRecord(booking, credentials);
        } catch (error) {
          this.logger.error(
            `Error serializing booking at index ${index}:`,
            error,
          );
          return null;
        }
      })
      .filter((line) => line !== null)
      .join(DATEV_DELIMITERS.LINE);

    // Zusammenbauen: Header + Spalten + Buchungen
    const asciiContent = [headerLine1, headerLine2, bookingLines].join(
      DATEV_DELIMITERS.LINE,
    );

    this.logger.log('Successfully generated DATEV ASCII export');

    return asciiContent;
  }

  /**
   * Import bookings from DATEV API
   * Importiert Buchungsdaten aus DATEV über API
   *
   * @param accessToken - Valid access token
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Import result with counts and errors
   */
  async importBookings(
    accessToken: string,
    startDate: string,
    endDate: string,
  ): Promise<DATEVImportResult> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const response = await axios.get(
        `${DATEV_API.BASE_URL}${DATEV_API.ENDPOINTS.BOOKINGS}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Imported ${response.data.length} bookings from DATEV`);

      return {
        accounts_imported: 0,
        bookings_imported: response.data.length || 0,
        errors: [],
        imported_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to import bookings from DATEV', error);
      this.handleApiError(error as AxiosError<DATEVErrorResponse>);
    }
  }

  /**
   * Sync chart of accounts from DATEV
   * Synchronisiert Kontenrahmen (SKR03/SKR04) aus DATEV
   *
   * @param accessToken - Valid access token
   * @param chartOfAccounts - Chart of accounts to sync (SKR03, SKR04, etc.)
   * @returns Array of accounts
   */
  async syncChartOfAccounts(
    accessToken: string,
    chartOfAccounts: DATEVChartOfAccounts,
  ): Promise<DATEVAccount[]> {
    try {
      const response = await axios.get(
        `${DATEV_API.BASE_URL}${DATEV_API.ENDPOINTS.ACCOUNTS}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            chart_of_accounts: chartOfAccounts,
          },
        },
      );

      this.logger.log(
        `Synced ${response.data.length} accounts from DATEV (${chartOfAccounts})`,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to sync chart of accounts from DATEV', error);
      this.handleApiError(error as AxiosError<DATEVErrorResponse>);
    }
  }

  /**
   * Build DATEV ASCII Header
   * Erstellt die Header-Zeile für DATEV ASCII Export
   */
  private buildASCIIHeader(
    credentials: DATEVCredentials,
    exportRequest: DATEVExportRequest,
  ): DATEVASCIIHeader {
    const now = new Date();
    const createdDate = this.formatDateForHeader(now);

    return {
      format_version: DATEV_ASCII_FORMAT.FORMAT_VERSION,
      version: DATEV_ASCII_FORMAT.VERSION,
      data_category: DATEV_ASCII_FORMAT.DATA_CATEGORY_BOOKINGS,
      format_name: DATEV_ASCII_FORMAT.FORMAT_NAME_BOOKINGS,
      format_version_number: DATEV_ASCII_FORMAT.FORMAT_VERSION_NUMBER,
      created_date: createdDate,
      origin: DATEV_DEFAULTS.ORIGIN,
      exported_by: DATEV_DEFAULTS.ORIGIN,
      consultant_number: credentials.consultant_number,
      client_number: credentials.client_number,
      fiscal_year_start: exportRequest.fiscal_year_start,
      account_length: exportRequest.account_length,
      date_from: exportRequest.date_from,
      date_to: exportRequest.date_to,
      description: exportRequest.submission_name || 'Export from Operate',
      dictation_code: exportRequest.dictation_code || '',
      booking_type: DATEV_DEFAULTS.BOOKING_TYPE,
      accounting_purpose: DATEV_DEFAULTS.ACCOUNTING_PURPOSE,
      locked: DATEV_DEFAULTS.LOCKED,
      currency: DATEV_DEFAULTS.CURRENCY,
    };
  }

  /**
   * Serialize header line 1 (metadata)
   * Serialisiert die erste Zeile mit Metadaten
   */
  private serializeHeaderLine1(header: DATEVASCIIHeader): string {
    const fields = [
      header.format_version,
      header.version,
      header.data_category.toString(),
      header.format_name,
      header.format_version_number.toString(),
      header.created_date,
      '', // importiert
      header.origin,
      header.exported_by,
      '', // importiert von
      header.consultant_number,
      header.client_number,
      header.fiscal_year_start,
      header.account_length.toString(),
      header.date_from,
      header.date_to,
      header.description,
      header.dictation_code,
      header.booking_type.toString(),
      header.accounting_purpose.toString(),
      header.locked.toString(),
      header.currency,
    ];

    return fields.join(DATEV_DELIMITERS.FIELD);
  }

  /**
   * Get ASCII column headers (line 2)
   * Gibt die Spaltenüberschriften zurück (Zeile 2)
   */
  private getASCIIColumnHeaders(): string {
    const columns = [
      'Umsatz (ohne Soll/Haben-Kz)',
      'Soll/Haben-Kennzeichen',
      'WKZ Umsatz',
      'Kurs',
      'Basis-Umsatz',
      'WKZ Basis-Umsatz',
      'Konto',
      'Gegenkonto (ohne BU-Schlüssel)',
      'BU-Schlüssel',
      'Belegdatum',
      'Belegfeld 1',
      'Belegfeld 2',
      'Skonto',
      'Buchungstext',
      'Postensperre',
      'Diverse Adressnummer',
      'Geschäftspartnerbank',
      'Sachverhalt',
      'Zinssperre',
      'Beleglink',
      'Beleginfo - Art 1',
      'Beleginfo - Inhalt 1',
      'Beleginfo - Art 2',
      'Beleginfo - Inhalt 2',
      'Beleginfo - Art 3',
      'Beleginfo - Inhalt 3',
      'Beleginfo - Art 4',
      'Beleginfo - Inhalt 4',
      'Beleginfo - Art 5',
      'Beleginfo - Inhalt 5',
      'Beleginfo - Art 6',
      'Beleginfo - Inhalt 6',
      'Beleginfo - Art 7',
      'Beleginfo - Inhalt 7',
      'Beleginfo - Art 8',
      'Beleginfo - Inhalt 8',
      'KOST1 - Kostenstelle',
      'KOST2 - Kostenstelle',
      'Kost-Menge',
      'EU-Land u. UStID',
      'EU-Steuersatz',
      'Abw. Versteuerungsart',
      'Sachverhalt L+L',
      'Funktionsergänzung L+L',
      'BU 49 Hauptfunktionstyp',
      'BU 49 Hauptfunktionsnummer',
      'BU 49 Funktionsergänzung',
      'Zusatzinformation - Art 1',
      'Zusatzinformation - Inhalt 1',
      'Zusatzinformation - Art 2',
      'Zusatzinformation - Inhalt 2',
      'Zusatzinformation - Art 3',
      'Zusatzinformation - Inhalt 3',
      'Zusatzinformation - Art 4',
      'Zusatzinformation - Inhalt 4',
      'Zusatzinformation - Art 5',
      'Zusatzinformation - Inhalt 5',
      'Zusatzinformation - Art 6',
      'Zusatzinformation - Inhalt 6',
      'Zusatzinformation - Art 7',
      'Zusatzinformation - Inhalt 7',
      'Zusatzinformation - Art 8',
      'Zusatzinformation - Inhalt 8',
      'Zusatzinformation - Art 9',
      'Zusatzinformation - Inhalt 9',
      'Zusatzinformation - Art 10',
      'Zusatzinformation - Inhalt 10',
      'Zusatzinformation - Art 11',
      'Zusatzinformation - Inhalt 11',
      'Zusatzinformation - Art 12',
      'Zusatzinformation - Inhalt 12',
      'Zusatzinformation - Art 13',
      'Zusatzinformation - Inhalt 13',
      'Zusatzinformation - Art 14',
      'Zusatzinformation - Inhalt 14',
      'Zusatzinformation - Art 15',
      'Zusatzinformation - Inhalt 15',
      'Zusatzinformation - Art 16',
      'Zusatzinformation - Inhalt 16',
      'Zusatzinformation - Art 17',
      'Zusatzinformation - Inhalt 17',
      'Zusatzinformation - Art 18',
      'Zusatzinformation - Inhalt 18',
      'Zusatzinformation - Art 19',
      'Zusatzinformation - Inhalt 19',
      'Zusatzinformation - Art 20',
      'Zusatzinformation - Inhalt 20',
      'Stück',
      'Gewicht',
      'Zahlweise',
      'Forderungsart',
      'Veranlagungsjahr',
      'Zugeordnete Fälligkeit',
      'Skontotyp',
      'Auftragsnummer',
      'Buchungstyp',
      'Ust-Schlüssel (Anzahlungen)',
      'EU-Land (Anzahlungen)',
      'Sachverhalt L+L (Anzahlungen)',
      'EU-Steuersatz (Anzahlungen)',
      'Erlöskonto (Anzahlungen)',
      'Herkunft-Kz',
      'Buchungs GUID',
      'KOST-Datum',
      'SEPA-Mandatsreferenz',
      'Skontosperre',
      'Gesellschaftername',
      'Beteiligtennummer',
      'Identifikationsnummer',
      'Zeichnernummer',
      'Postensperre bis',
      'Bezeichnung SoBil-Sachverhalt',
      'Kennzeichen SoBil-Buchung',
      'Festschreibung',
      'Leistungsdatum',
      'Datum Zuord. Steuerperiode',
    ];

    return columns.join(DATEV_DELIMITERS.FIELD);
  }

  /**
   * Serialize booking record to DATEV ASCII line
   * Konvertiert einen Buchungssatz in eine DATEV ASCII Zeile
   */
  private serializeBookingRecord(
    booking: DATEVBookingRecord,
    credentials: DATEVCredentials,
  ): string {
    // Pflichtfelder validieren
    if (!booking.amount || !booking.account || !booking.contra_account) {
      throw new BadRequestException(
        'Missing required booking fields: amount, account, contra_account',
      );
    }

    // Default account length to 4 if not specified
    const accountLength = credentials.account_length || 4;

    // Felder im DATEV Format aufbereiten
    const fields = [
      this.formatAmount(booking.amount), // Umsatz
      booking.debit_credit || 'S', // Soll/Haben
      booking.currency || DATEV_DEFAULTS.CURRENCY, // WKZ Umsatz
      booking.exchange_rate || '', // Kurs
      booking.base_amount || '', // Basis-Umsatz
      booking.base_currency || '', // WKZ Basis-Umsatz
      this.formatAccount(booking.account, accountLength), // Konto
      this.formatAccount(booking.contra_account, accountLength), // Gegenkonto
      booking.tax_key || '', // BU-Schlüssel
      booking.document_date, // Belegdatum
      this.sanitizeText(booking.document_number, DATEV_FIELD_LENGTHS.DOCUMENT_NUMBER), // Belegfeld 1
      this.sanitizeText(booking.document_field_2 || '', DATEV_FIELD_LENGTHS.DOCUMENT_NUMBER), // Belegfeld 2
      '', // Skonto
      this.sanitizeText(booking.booking_text, DATEV_FIELD_LENGTHS.BOOKING_TEXT), // Buchungstext
      booking.locked_until || '', // Postensperre
      booking.address_number || '', // Diverse Adressnummer
      booking.business_partner_bank || '', // Geschäftspartnerbank
      booking.business_case || '', // Sachverhalt
      '', // Zinssperre
      '', // Beleglink
      ...Array(40).fill(''), // Beleginfo 1-8 (je 5 Felder)
      '', // KOST1
      '', // KOST2
      '', // Kost-Menge
      booking.eu_country_vat_id || '', // EU-Land u. UStID
      '', // EU-Steuersatz
      booking.vat_key || '', // Abw. Versteuerungsart
      '', // Sachverhalt L+L
      '', // Funktionsergänzung L+L
      '', // BU 49 Hauptfunktionstyp
      '', // BU 49 Hauptfunktionsnummer
      '', // BU 49 Funktionsergänzung
      ...Array(40).fill(''), // Zusatzinformation 1-20 (je 2 Felder)
      '', // Stück
      '', // Gewicht
      '', // Zahlweise
      '', // Forderungsart
      '', // Veranlagungsjahr
      booking.due_date || '', // Zugeordnete Fälligkeit
      '', // Skontotyp
      '', // Auftragsnummer
      '', // Buchungstyp
      '', // Ust-Schlüssel (Anzahlungen)
      '', // EU-Land (Anzahlungen)
      '', // Sachverhalt L+L (Anzahlungen)
      '', // EU-Steuersatz (Anzahlungen)
      '', // Erlöskonto (Anzahlungen)
      '', // Herkunft-Kz
      '', // Buchungs GUID
      '', // KOST-Datum
      '', // SEPA-Mandatsreferenz
      '', // Skontosperre
      '', // Gesellschaftername
      '', // Beteiligtennummer
      '', // Identifikationsnummer
      '', // Zeichnernummer
      booking.locked_until || '', // Postensperre bis
      '', // Bezeichnung SoBil-Sachverhalt
      '', // Kennzeichen SoBil-Buchung
      booking.locked || '0', // Festschreibung
      booking.service_date || '', // Leistungsdatum
      booking.tax_period_date || '', // Datum Zuord. Steuerperiode
    ];

    return fields.join(DATEV_DELIMITERS.FIELD);
  }

  /**
   * Format amount for DATEV (German decimal format)
   * Formatiert Betrag im deutschen Format (Komma als Dezimaltrennzeichen)
   */
  private formatAmount(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toFixed(2).replace('.', DATEV_DELIMITERS.DECIMAL);
  }

  /**
   * Format account number (pad with zeros if needed)
   * Formatiert Kontonummer (mit Nullen auffüllen falls nötig)
   */
  private formatAccount(account: string, length: 4 | 8): string {
    return account.padStart(length, '0');
  }

  /**
   * Sanitize text fields (remove special characters, limit length)
   * Bereinigt Textfelder (Sonderzeichen entfernen, Länge begrenzen)
   */
  private sanitizeText(text: string, maxLength: number): string {
    // Entferne Zeilenumbrüche und Tabs
    let sanitized = text.replace(/[\r\n\t]/g, ' ');

    // Entferne doppelte Anführungszeichen (Konflikt mit Feldtrenner)
    sanitized = sanitized.replace(/"/g, "'");

    // Begrenze Länge
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Format date for DATEV header (YYYYMMDD)
   */
  private formatDateForHeader(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Validate DATEV credentials
   * Validiert DATEV Zugangsdaten
   */
  private validateCredentials(credentials: DATEVCredentials): void {
    if (!credentials.consultant_number) {
      throw new BadRequestException(
        'Missing consultant_number (Beraternummer)',
      );
    }

    if (!credentials.client_number) {
      throw new BadRequestException('Missing client_number (Mandantennummer)');
    }

    // Beraternummer: 4-7 Ziffern
    if (
      !/^\d{4,7}$/.test(credentials.consultant_number)
    ) {
      throw new BadRequestException(
        'Invalid consultant_number format (must be 4-7 digits)',
      );
    }

    // Mandantennummer: 1-5 Ziffern
    if (!/^\d{1,5}$/.test(credentials.client_number)) {
      throw new BadRequestException(
        'Invalid client_number format (must be 1-5 digits)',
      );
    }
  }

  /**
   * Handle DATEV API errors
   * Converts axios errors to NestJS exceptions
   *
   * @param error - Axios error from DATEV API
   * @throws BadRequestException for client errors
   * @throws UnauthorizedException for auth errors
   */
  private handleApiError(error: AxiosError<DATEVErrorResponse>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      const message =
        data?.error?.message || error.message || 'DATEV API error';

      if (status === 401 || status === 403) {
        throw new UnauthorizedException(
          `DATEV authentication failed: ${message}`,
        );
      }

      throw new BadRequestException(`DATEV API error: ${message}`);
    }

    throw new BadRequestException(
      `DATEV API request failed: ${error.message}`,
    );
  }
}
