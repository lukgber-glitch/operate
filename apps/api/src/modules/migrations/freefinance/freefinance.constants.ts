/**
 * Constants for FreeFinance CSV/Excel migration
 * Field mappings and column headers for Austrian format
 */

import { FreeFinanceMigrationType } from './freefinance.types';

/**
 * Austrian/German column headers in FreeFinance exports
 * Maps FreeFinance field names to internal field names
 */
export const FREEFINANCE_CUSTOMER_FIELDS = {
  // Identifier
  'Kundennummer': 'customerNumber',
  'Kunden-Nr': 'customerNumber',
  'Kunden-Nr.': 'customerNumber',
  'KundenNr': 'customerNumber',

  // Company info
  'Firma': 'companyName',
  'Firmenname': 'companyName',
  'Unternehmensname': 'companyName',
  'Vorname': 'firstName',
  'Nachname': 'lastName',
  'Name': 'companyName',

  // Type
  'Kundentyp': 'type',
  'Typ': 'type',
  'Art': 'type',

  // Contact
  'E-Mail': 'email',
  'Email': 'email',
  'E-Mail-Adresse': 'email',
  'Telefon': 'phone',
  'Tel': 'phone',
  'Tel.': 'phone',
  'Mobil': 'mobile',
  'Mobiltelefon': 'mobile',
  'Website': 'website',
  'Webseite': 'website',
  'Homepage': 'website',

  // Address
  'Straße': 'street',
  'Strasse': 'street',
  'Adresse': 'street',
  'PLZ': 'zip',
  'Postleitzahl': 'zip',
  'Ort': 'city',
  'Stadt': 'city',
  'Land': 'country',
  'Landeskennzeichen': 'country',

  // Austrian tax identifiers
  'UID-Nummer': 'uidNummer',
  'UID-Nr': 'uidNummer',
  'UID-Nr.': 'uidNummer',
  'UID': 'uidNummer',
  'USt-IdNr': 'uidNummer',
  'Steuernummer': 'steuernummer',
  'Steuer-Nr': 'steuernummer',
  'Steuer-Nr.': 'steuernummer',
  'Finanzamt': 'finanzamt',

  // Banking
  'IBAN': 'iban',
  'BIC': 'bic',
  'SWIFT': 'bic',
  'Bank': 'bankName',
  'Bankname': 'bankName',
  'Bankinstitut': 'bankName',

  // Business registration
  'Firmenbuchnummer': 'registrationNumber',
  'FB-Nr': 'registrationNumber',
  'FB-Nummer': 'registrationNumber',
  'Handelsgericht': 'commercialRegisterCourt',

  // Payment terms
  'Zahlungsziel': 'paymentTermDays',
  'Zahlungsziel (Tage)': 'paymentTermDays',
  'Skonto': 'discount',
  'Skonto (%)': 'discount',
  'Skontotage': 'discountDays',
  'Skonto-Tage': 'discountDays',

  // Notes
  'Notizen': 'notes',
  'Bemerkungen': 'notes',
  'Kommentar': 'notes',
  'Anmerkungen': 'notes',

  // Status
  'Aktiv': 'isActive',
  'Status': 'isActive',

  // Dates
  'Erstellt am': 'createdAt',
  'Angelegt am': 'createdAt',
};

export const FREEFINANCE_VENDOR_FIELDS = {
  // Identifier
  'Lieferantennummer': 'vendorNumber',
  'Lieferanten-Nr': 'vendorNumber',
  'Lieferanten-Nr.': 'vendorNumber',

  // Company info
  'Firma': 'companyName',
  'Firmenname': 'companyName',
  'Unternehmensname': 'companyName',
  'Vorname': 'firstName',
  'Nachname': 'lastName',
  'Name': 'companyName',

  // Contact
  'E-Mail': 'email',
  'Email': 'email',
  'Telefon': 'phone',
  'Tel': 'phone',
  'Tel.': 'phone',
  'Mobil': 'mobile',
  'Website': 'website',

  // Address
  'Straße': 'street',
  'Strasse': 'street',
  'PLZ': 'zip',
  'Postleitzahl': 'zip',
  'Ort': 'city',
  'Land': 'country',

  // Tax
  'UID-Nummer': 'uidNummer',
  'UID-Nr': 'uidNummer',
  'UID': 'uidNummer',
  'Steuernummer': 'steuernummer',

  // Banking
  'IBAN': 'iban',
  'BIC': 'bic',
  'Bank': 'bankName',

  // Payment terms
  'Zahlungsziel': 'paymentTermDays',
  'Zahlungsziel (Tage)': 'paymentTermDays',

  // Notes
  'Notizen': 'notes',
  'Bemerkungen': 'notes',

  // Status
  'Aktiv': 'isActive',
};

export const FREEFINANCE_OUTGOING_INVOICE_FIELDS = {
  // Identifier
  'Rechnungsnummer': 'invoiceNumber',
  'Rechnung-Nr': 'invoiceNumber',
  'Rechnung-Nr.': 'invoiceNumber',
  'Belegnummer': 'invoiceNumber',

  // Type
  'Belegart': 'type',
  'Art': 'type',
  'Typ': 'type',

  // Status
  'Status': 'status',
  'Rechnungsstatus': 'status',

  // Customer
  'Kundennummer': 'customerNumber',
  'Kunden-Nr': 'customerNumber',
  'Kunde': 'customerName',
  'Kundenname': 'customerName',
  'Kundenadresse': 'customerAddress',
  'Kunden-Email': 'customerEmail',
  'Kunden-UID': 'customerUidNummer',

  // Dates
  'Rechnungsdatum': 'invoiceDate',
  'Datum': 'invoiceDate',
  'Fälligkeitsdatum': 'dueDate',
  'Fällig am': 'dueDate',
  'Zahlbar bis': 'dueDate',
  'Leistungsdatum': 'serviceDate',
  'Lieferdatum': 'serviceDate',
  'Zahlungsdatum': 'paidDate',
  'Bezahlt am': 'paidDate',

  // Amounts (EUR)
  'Nettobetrag': 'netAmount',
  'Netto': 'netAmount',
  'Summe Netto': 'netAmount',
  'MwSt': 'vatAmount',
  'USt': 'vatAmount',
  'Steuer': 'vatAmount',
  'Mehrwertsteuer': 'vatAmount',
  'Bruttobetrag': 'grossAmount',
  'Brutto': 'grossAmount',
  'Gesamtbetrag': 'grossAmount',
  'Endbetrag': 'grossAmount',
  'Bezahlter Betrag': 'paidAmount',
  'Offener Betrag': 'openAmount',
  'Währung': 'currency',

  // Payment
  'Zahlungsziel': 'paymentTermDays',
  'Zahlungsziel (Tage)': 'paymentTermDays',
  'Zahlungsart': 'paymentMethod',
  'Zahlungsmethode': 'paymentMethod',
  'Skonto': 'discount',
  'Skonto (%)': 'discount',
  'Skontotage': 'discountDays',

  // Austrian specific
  'Reverse-Charge': 'reverseCharge',
  'Innergemeinschaftliche Lieferung': 'innerCommunitySupply',
  'IG-Lieferung': 'innerCommunitySupply',
  'Ausfuhrlieferung': 'exportDelivery',
  'Export': 'exportDelivery',

  // Notes
  'Kopftext': 'headerText',
  'Fußtext': 'footerText',
  'Fusstext': 'footerText',
  'Notizen': 'notes',
  'Bemerkungen': 'notes',

  // References
  'Auftragsnummer': 'orderNumber',
  'Lieferscheinnummer': 'deliveryNoteNumber',

  // Accounting
  'Buchungsdatum': 'bookingDate',
  'Buchungsperiode': 'bookingPeriod',
};

export const FREEFINANCE_INCOMING_INVOICE_FIELDS = {
  // Identifier
  'Rechnungsnummer': 'invoiceNumber',
  'Interne Nummer': 'invoiceNumber',
  'Kreditorenrechnungsnummer': 'vendorInvoiceNumber',
  'Lieferantenrechnungsnummer': 'vendorInvoiceNumber',

  // Vendor
  'Lieferantennummer': 'vendorNumber',
  'Lieferant': 'vendorName',
  'Lieferantenname': 'vendorName',
  'Lieferanten-UID': 'vendorUidNummer',

  // Dates
  'Rechnungsdatum': 'invoiceDate',
  'Datum': 'invoiceDate',
  'Fälligkeitsdatum': 'dueDate',
  'Fällig am': 'dueDate',
  'Eingangsdatum': 'receiptDate',
  'Erhalten am': 'receiptDate',
  'Leistungsdatum': 'serviceDate',
  'Zahlungsdatum': 'paidDate',
  'Bezahlt am': 'paidDate',

  // Amounts
  'Nettobetrag': 'netAmount',
  'Netto': 'netAmount',
  'MwSt': 'vatAmount',
  'USt': 'vatAmount',
  'Vorsteuer': 'vatAmount',
  'Bruttobetrag': 'grossAmount',
  'Brutto': 'grossAmount',
  'Gesamtbetrag': 'grossAmount',
  'Bezahlter Betrag': 'paidAmount',
  'Offener Betrag': 'openAmount',
  'Währung': 'currency',

  // Payment
  'Zahlungsart': 'paymentMethod',
  'Zahlungsziel': 'paymentTermDays',

  // Classification
  'Kategorie': 'category',
  'Ausgabenkategorie': 'expenseCategory',
  'Kostenstelle': 'accountingCode',
  'Kontierungscode': 'accountingCode',

  // Austrian specific
  'Reverse-Charge': 'reverseCharge',
  'Vorsteuerabzug': 'deductibleVat',
  'Abzugsfähige Vorsteuer': 'deductibleVat',

  // Description
  'Beschreibung': 'description',
  'Verwendungszweck': 'description',
  'Notizen': 'notes',

  // Attachment
  'Anhang': 'hasAttachment',
  'Datei vorhanden': 'hasAttachment',
  'Dateipfad': 'attachmentPath',

  // Accounting
  'Buchungsdatum': 'bookingDate',
  'Buchungsperiode': 'bookingPeriod',
};

export const FREEFINANCE_INVOICE_ITEM_FIELDS = {
  'Position': 'position',
  'Pos': 'position',
  'Pos.': 'position',
  'Beschreibung': 'description',
  'Artikel': 'description',
  'Leistung': 'description',
  'Menge': 'quantity',
  'Anzahl': 'quantity',
  'Einheit': 'unit',
  'ME': 'unit',
  'Einzelpreis': 'unitPrice',
  'Preis': 'unitPrice',
  'Netto-Preis': 'unitPrice',
  'Rabatt': 'discount',
  'Rabatt (€)': 'discount',
  'Rabatt (%)': 'discountPercent',
  'MwSt-Satz': 'vatRate',
  'USt-Satz': 'vatRate',
  'Steuersatz': 'vatRate',
  'Nettobetrag': 'netAmount',
  'MwSt': 'vatAmount',
  'USt': 'vatAmount',
  'Bruttobetrag': 'grossAmount',
  'Gesamt': 'grossAmount',
  'Artikelnummer': 'productNumber',
  'Artikel-Nr': 'productNumber',
  'Kontierungscode': 'accountingCode',
  'Konto': 'accountingCode',
};

export const FREEFINANCE_PRODUCT_FIELDS = {
  // Identifier
  'Artikelnummer': 'productNumber',
  'Artikel-Nr': 'productNumber',
  'Artikel-Nr.': 'productNumber',
  'Produktnummer': 'productNumber',

  // Basic info
  'Artikelname': 'name',
  'Produktname': 'name',
  'Bezeichnung': 'name',
  'Name': 'name',
  'Beschreibung': 'description',
  'Artikelbeschreibung': 'description',

  // Pricing
  'Verkaufspreis': 'unitPrice',
  'Preis': 'unitPrice',
  'Einzelpreis': 'unitPrice',
  'Netto-Preis': 'unitPrice',
  'Währung': 'currency',

  // Austrian VAT
  'MwSt-Satz': 'vatRate',
  'USt-Satz': 'vatRate',
  'Steuersatz': 'vatRate',

  // Unit
  'Einheit': 'unit',
  'ME': 'unit',
  'Mengeneinheit': 'unit',

  // Category
  'Kategorie': 'category',
  'Produktgruppe': 'productGroup',
  'Warengruppe': 'productGroup',

  // Accounting
  'Kontierungscode': 'accountingCode',
  'Erlöskonto': 'revenueAccount',
  'Konto': 'accountingCode',

  // Stock
  'Lagerverwaltung': 'trackStock',
  'Bestandsführung': 'trackStock',
  'Bestand': 'stockQuantity',
  'Lagerbestand': 'stockQuantity',
  'Mindestbestand': 'minStockLevel',

  // Status
  'Aktiv': 'isActive',
  'Status': 'isActive',
  'Dienstleistung': 'isService',
  'Art': 'isService',

  // Codes
  'EAN': 'ean',
  'EAN-Code': 'ean',
  'SKU': 'sku',
  'Artikelnummer (extern)': 'sku',
};

/**
 * Austrian VAT rates (as of 2024)
 */
export const AUSTRIAN_VAT_RATES = {
  STANDARD: 20, // Standard rate
  REDUCED_1: 13, // Food, agricultural products
  REDUCED_2: 10, // Books, newspapers, cultural events
  ZERO: 0, // Exports, intra-community supplies
};

/**
 * Default values for Austrian businesses
 */
export const DEFAULT_VALUES = {
  currency: 'EUR',
  country: 'AT',
  vatRate: 20,
  unit: 'Stk',
  paymentTermDays: 14,
};

/**
 * Austrian date formats
 */
export const DATE_FORMATS = [
  'DD.MM.YYYY', // Standard Austrian format
  'DD.MM.YY',
  'D.M.YYYY',
  'D.M.YY',
  'YYYY-MM-DD', // ISO format
  'DD/MM/YYYY',
];

/**
 * Status mappings from German/Austrian to English
 */
export const STATUS_MAPPINGS = {
  customers: {
    'Aktiv': true,
    'Inaktiv': false,
    'Gesperrt': false,
    'active': true,
    'inactive': false,
    'blocked': false,
    'Ja': true,
    'Nein': false,
  },
  vendors: {
    'Aktiv': true,
    'Inaktiv': false,
    'active': true,
    'inactive': false,
    'Ja': true,
    'Nein': false,
  },
  invoices: {
    'Entwurf': 'draft',
    'Versendet': 'sent',
    'Gesendet': 'sent',
    'Bezahlt': 'paid',
    'Teilweise bezahlt': 'partially_paid',
    'Teilbezahlt': 'partially_paid',
    'Überfällig': 'overdue',
    'Fällig': 'overdue',
    'Storniert': 'cancelled',
    'draft': 'draft',
    'sent': 'sent',
    'paid': 'paid',
    'partially_paid': 'partially_paid',
    'overdue': 'overdue',
    'cancelled': 'cancelled',
  },
};

/**
 * Customer type mappings
 */
export const CUSTOMER_TYPE_MAPPINGS = {
  'Geschäftskunde': 'business',
  'Unternehmen': 'business',
  'Privatkunde': 'private',
  'Privatperson': 'private',
  'EU-Kunde': 'eu',
  'EU': 'eu',
  'Drittland': 'third_country',
  'Ausland': 'third_country',
  'business': 'business',
  'private': 'private',
  'eu': 'eu',
  'third_country': 'third_country',
};

/**
 * Payment method mappings
 */
export const PAYMENT_METHOD_MAPPINGS = {
  'Überweisung': 'bank_transfer',
  'Banküberweisung': 'bank_transfer',
  'Bar': 'cash',
  'Bargeld': 'cash',
  'Karte': 'card',
  'Kreditkarte': 'card',
  'EC-Karte': 'card',
  'PayPal': 'paypal',
  'SEPA': 'sepa',
  'Lastschrift': 'sepa',
  'Sonstige': 'other',
  'Andere': 'other',
  'bank_transfer': 'bank_transfer',
  'cash': 'cash',
  'card': 'card',
  'paypal': 'paypal',
  'sepa': 'sepa',
  'other': 'other',
};

/**
 * Invoice type mappings
 */
export const INVOICE_TYPE_MAPPINGS = {
  'Rechnung': 'invoice',
  'Gutschrift': 'credit_note',
  'Stornorechnung': 'cancellation',
  'Proforma': 'proforma',
  'Proforma-Rechnung': 'proforma',
  'invoice': 'invoice',
  'credit_note': 'credit_note',
  'cancellation': 'cancellation',
  'proforma': 'proforma',
};

/**
 * Validation rules for Austrian data
 */
export const VALIDATION_RULES = {
  customers: {
    required: ['customerNumber', 'country'],
    requireEitherNameField: ['companyName', 'firstName', 'lastName'],
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[\d\s()-]+$/,
    uidNummer: /^ATU\d{8}$/, // Austrian UID format: ATU12345678
    steuernummer: /^\d{2}[-\s]?\d{3}[-\s\/]?\d{4}$/, // Austrian tax number
    iban: /^AT\d{18}$/, // Austrian IBAN: AT + 18 digits
    bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  },
  vendors: {
    required: ['vendorNumber', 'country'],
    requireEitherNameField: ['companyName', 'firstName', 'lastName'],
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[\d\s()-]+$/,
    uidNummer: /^[A-Z]{2}[A-Z0-9]+$/, // EU VAT format
    iban: /^[A-Z]{2}\d{2}[A-Z\d]+$/,
    bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  },
  outgoingInvoices: {
    required: ['invoiceNumber', 'customerNumber', 'customerName', 'invoiceDate', 'grossAmount'],
    invoiceNumber: /^[A-Z\d-_\/]+$/i,
    amount: /^\d+([.,]\d{1,2})?$/,
    vatRate: [0, 10, 13, 20], // Valid Austrian VAT rates
  },
  incomingInvoices: {
    required: ['invoiceNumber', 'vendorName', 'invoiceDate', 'grossAmount'],
    invoiceNumber: /^[A-Z\d-_\/]+$/i,
    amount: /^\d+([.,]\d{1,2})?$/,
    vatRate: [0, 10, 13, 20],
  },
  products: {
    required: ['productNumber', 'name', 'unitPrice', 'vatRate'],
    productNumber: /^[A-Z\d-_\.]+$/i,
    amount: /^\d+([.,]\d{1,2})?$/,
    vatRate: [0, 10, 13, 20],
    ean: /^\d{8}$|^\d{13}$/, // EAN-8 or EAN-13
  },
};

/**
 * Maximum batch sizes for processing
 */
export const BATCH_SIZES = {
  customers: 100,
  vendors: 100,
  outgoingInvoices: 50,
  incomingInvoices: 50,
  products: 200,
};

/**
 * Supported file types and extensions
 */
export const SUPPORTED_FILE_TYPES = {
  csv: ['text/csv', 'application/csv', 'text/plain'],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
  ],
};

export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.ods'];

/**
 * CSV parsing options for Austrian/German files
 */
export const CSV_PARSE_OPTIONS = {
  delimiter: ';', // German/Austrian CSV standard
  quote: '"',
  escape: '"',
  encoding: 'utf8',
  bom: true, // Handle BOM for Austrian/German files
  skipEmptyLines: true,
  trim: true,
  relaxColumnCount: true,
  columns: true, // Parse headers
};

/**
 * Number parsing (German format: 1.234,56)
 */
export const GERMAN_NUMBER_FORMAT = {
  decimalSeparator: ',',
  thousandsSeparator: '.',
};

/**
 * Field mapping configurations
 */
export const FIELD_MAPPINGS: Record<FreeFinanceMigrationType, Record<string, string>> = {
  [FreeFinanceMigrationType.CUSTOMERS]: FREEFINANCE_CUSTOMER_FIELDS,
  [FreeFinanceMigrationType.VENDORS]: FREEFINANCE_VENDOR_FIELDS,
  [FreeFinanceMigrationType.OUTGOING_INVOICES]: FREEFINANCE_OUTGOING_INVOICE_FIELDS,
  [FreeFinanceMigrationType.INCOMING_INVOICES]: FREEFINANCE_INCOMING_INVOICE_FIELDS,
  [FreeFinanceMigrationType.PRODUCTS]: FREEFINANCE_PRODUCT_FIELDS,
};

/**
 * Austrian tax offices (Finanzämter)
 */
export const AUSTRIAN_TAX_OFFICES = [
  'Wien 1/23',
  'Wien 2/20/21/22',
  'Wien 3/11',
  'Wien 4/5/10',
  'Wien 6/7/8',
  'Wien 9/18/19 Währing',
  'Wien 12/13/14 Purkersdorf',
  'Wien 23',
  'Graz-Stadt',
  'Graz-Umgebung',
  'Linz',
  'Salzburg-Stadt',
  'Innsbruck',
  'Klagenfurt',
  'Bregenz',
  // ... add more as needed
];

/**
 * EU country codes for validation
 */
export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
];
