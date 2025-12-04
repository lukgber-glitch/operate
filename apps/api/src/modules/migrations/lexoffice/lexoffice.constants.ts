/**
 * Constants for lexoffice CSV/Excel migration
 * Field mappings and column headers
 */

import { LexofficeMigrationType } from './lexoffice.types';

/**
 * Common German column headers in lexoffice exports
 * Maps lexoffice field names to internal field names
 */
export const LEXOFFICE_CONTACT_FIELDS = {
  // Identifier
  'Kontaktnummer': 'contactNumber',
  'Kundennummer': 'contactNumber',
  'Lieferantennummer': 'contactNumber',

  // Name
  'Firma': 'companyName',
  'Firmenname': 'companyName',
  'Unternehmensname': 'companyName',
  'Vorname': 'firstName',
  'Nachname': 'lastName',
  'Name': 'companyName',

  // Type
  'Typ': 'type',
  'Kontakttyp': 'type',

  // Contact
  'E-Mail': 'email',
  'Email': 'email',
  'Telefon': 'phone',
  'Tel': 'phone',
  'Mobil': 'mobile',
  'Mobile': 'mobile',
  'Website': 'website',
  'Webseite': 'website',

  // Address
  'Straße': 'street',
  'Strasse': 'street',
  'PLZ': 'zip',
  'Postleitzahl': 'zip',
  'Ort': 'city',
  'Stadt': 'city',
  'Land': 'country',

  // Tax
  'USt-IdNr': 'vatId',
  'USt-ID': 'vatId',
  'UStIdNr': 'vatId',
  'Steuernummer': 'taxNumber',

  // Banking
  'IBAN': 'iban',
  'BIC': 'bic',
  'Bank': 'bankName',
  'Bankname': 'bankName',

  // Notes
  'Notizen': 'notes',
  'Bemerkungen': 'notes',
  'Kommentar': 'notes',
};

export const LEXOFFICE_INVOICE_FIELDS = {
  // Identifier
  'Rechnungsnummer': 'invoiceNumber',
  'Belegnummer': 'invoiceNumber',
  'Nummer': 'invoiceNumber',

  // Status
  'Status': 'status',

  // Customer
  'Kundennummer': 'customerNumber',
  'Kunde': 'customerName',
  'Kundenname': 'customerName',
  'Kundenadresse': 'customerAddress',
  'Kunden-Email': 'customerEmail',
  'Kunden-USt-ID': 'customerVatId',

  // Dates
  'Rechnungsdatum': 'invoiceDate',
  'Datum': 'invoiceDate',
  'Fälligkeitsdatum': 'dueDate',
  'Fällig am': 'dueDate',
  'Leistungsdatum': 'deliveryDate',
  'Zahlungsdatum': 'paidDate',
  'Bezahlt am': 'paidDate',

  // Amounts
  'Nettobetrag': 'subtotal',
  'Netto': 'subtotal',
  'MwSt': 'taxAmount',
  'Steuer': 'taxAmount',
  'Bruttobetrag': 'totalAmount',
  'Brutto': 'totalAmount',
  'Gesamtbetrag': 'totalAmount',
  'Betrag': 'totalAmount',
  'Währung': 'currency',

  // Payment
  'Zahlungsbedingungen': 'paymentTerms',
  'Zahlungsart': 'paymentMethod',
  'Zahlungsmethode': 'paymentMethod',

  // Notes
  'Einleitung': 'introduction',
  'Notizen': 'notes',
  'Bemerkungen': 'notes',
};

export const LEXOFFICE_INVOICE_ITEM_FIELDS = {
  'Position': 'position',
  'Pos': 'position',
  'Beschreibung': 'description',
  'Artikel': 'description',
  'Menge': 'quantity',
  'Anzahl': 'quantity',
  'Einheit': 'unit',
  'Einzelpreis': 'unitPrice',
  'Preis': 'unitPrice',
  'Rabatt': 'discount',
  'MwSt-Satz': 'taxRate',
  'Steuersatz': 'taxRate',
  'Betrag': 'amount',
  'Gesamt': 'amount',
  'Artikelnummer': 'productNumber',
};

export const LEXOFFICE_VOUCHER_FIELDS = {
  // Identifier
  'Belegnummer': 'voucherNumber',
  'Nummer': 'voucherNumber',
  'Quittungsnummer': 'receiptNumber',

  // Type
  'Typ': 'type',
  'Belegart': 'type',

  // Vendor
  'Lieferant': 'vendorName',
  'Lieferantenname': 'vendorName',
  'Lieferanten-USt-ID': 'vendorVatId',

  // Date and amounts
  'Datum': 'date',
  'Belegdatum': 'date',
  'Betrag': 'amount',
  'Gesamtbetrag': 'amount',
  'Währung': 'currency',
  'MwSt': 'taxAmount',
  'Steuer': 'taxAmount',
  'MwSt-Satz': 'taxRate',
  'Steuersatz': 'taxRate',

  // Category
  'Kategorie': 'category',
  'Ausgabenkategorie': 'category',

  // Description
  'Beschreibung': 'description',
  'Verwendungszweck': 'description',

  // Payment
  'Zahlungsart': 'paymentMethod',

  // Status
  'Status': 'status',

  // Attachment
  'Anhang': 'attachmentUrl',
  'Datei': 'attachmentUrl',
};

export const LEXOFFICE_PRODUCT_FIELDS = {
  // Identifier
  'Artikelnummer': 'productNumber',
  'Produktnummer': 'productNumber',

  // Basic info
  'Artikelname': 'name',
  'Produktname': 'name',
  'Name': 'name',
  'Beschreibung': 'description',

  // Pricing
  'Verkaufspreis': 'unitPrice',
  'Preis': 'unitPrice',
  'Einzelpreis': 'unitPrice',
  'Währung': 'currency',

  // Tax
  'MwSt-Satz': 'taxRate',
  'Steuersatz': 'taxRate',

  // Unit
  'Einheit': 'unit',

  // Category
  'Kategorie': 'category',
  'Produktgruppe': 'category',

  // Stock
  'Bestand': 'stockQuantity',
  'Lagerbestand': 'stockQuantity',

  // Status
  'Aktiv': 'isActive',
  'Status': 'isActive',
};

/**
 * Default values for missing fields
 */
export const DEFAULT_VALUES = {
  currency: 'EUR',
  country: 'DE',
  taxRate: 19,
  unit: 'Stk',
};

/**
 * German date formats commonly used in lexoffice
 */
export const DATE_FORMATS = [
  'DD.MM.YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD.MM.YY',
  'D.M.YYYY',
];

/**
 * Status mappings from German to English
 */
export const STATUS_MAPPINGS = {
  contacts: {
    'aktiv': true,
    'inaktiv': false,
    'active': true,
    'inactive': false,
  },
  invoices: {
    'Entwurf': 'draft',
    'Offen': 'open',
    'Bezahlt': 'paid',
    'Storniert': 'cancelled',
    'Überfällig': 'overdue',
    'draft': 'draft',
    'open': 'open',
    'paid': 'paid',
    'cancelled': 'cancelled',
    'overdue': 'overdue',
  },
  vouchers: {
    'Ausstehend': 'pending',
    'Genehmigt': 'approved',
    'Abgelehnt': 'rejected',
    'pending': 'pending',
    'approved': 'approved',
    'rejected': 'rejected',
  },
};

/**
 * Contact type mappings
 */
export const CONTACT_TYPE_MAPPINGS = {
  'Kunde': 'customer',
  'Lieferant': 'vendor',
  'Beides': 'both',
  'customer': 'customer',
  'vendor': 'vendor',
  'both': 'both',
};

/**
 * Voucher type mappings
 */
export const VOUCHER_TYPE_MAPPINGS = {
  'Ausgabe': 'expense',
  'Quittung': 'receipt',
  'Sonstiges': 'other',
  'expense': 'expense',
  'receipt': 'receipt',
  'other': 'other',
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  contacts: {
    required: ['companyName', 'firstName', 'lastName'], // At least one name field required
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[\d\s()-]+$/,
    vatId: /^[A-Z]{2}[\dA-Z]+$/,
    iban: /^[A-Z]{2}\d{2}[A-Z\d]+$/,
  },
  invoices: {
    required: ['invoiceNumber', 'customerName', 'invoiceDate', 'totalAmount'],
    invoiceNumber: /^[A-Z\d-_]+$/i,
    amount: /^\d+([.,]\d{1,2})?$/,
  },
  vouchers: {
    required: ['date', 'amount', 'description'],
    amount: /^\d+([.,]\d{1,2})?$/,
  },
  products: {
    required: ['name', 'unitPrice'],
    amount: /^\d+([.,]\d{1,2})?$/,
  },
};

/**
 * Maximum batch sizes for processing
 */
export const BATCH_SIZES = {
  contacts: 100,
  invoices: 50,
  vouchers: 100,
  products: 200,
};

/**
 * Supported file types and extensions
 */
export const SUPPORTED_FILE_TYPES = {
  csv: ['text/csv', 'application/csv'],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

/**
 * CSV parsing options
 */
export const CSV_PARSE_OPTIONS = {
  delimiter: ';', // German CSV standard
  quote: '"',
  escape: '"',
  encoding: 'utf8',
  bom: true, // Handle BOM for German files
  skipEmptyLines: true,
  trim: true,
};

/**
 * Field mapping configurations
 */
export const FIELD_MAPPINGS: Record<LexofficeMigrationType, Record<string, string>> = {
  [LexofficeMigrationType.CONTACTS]: LEXOFFICE_CONTACT_FIELDS,
  [LexofficeMigrationType.INVOICES]: LEXOFFICE_INVOICE_FIELDS,
  [LexofficeMigrationType.VOUCHERS]: LEXOFFICE_VOUCHER_FIELDS,
  [LexofficeMigrationType.PRODUCTS]: LEXOFFICE_PRODUCT_FIELDS,
};
