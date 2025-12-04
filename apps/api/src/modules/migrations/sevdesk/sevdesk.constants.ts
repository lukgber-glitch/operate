/**
 * sevDesk Migration Constants
 * Field mappings and configuration constants
 */

import { SevDeskFieldMapping, SevDeskEntityType } from './sevdesk.types';

/**
 * CSV Column Headers for sevDesk Exports
 */
export const SEVDESK_CSV_HEADERS = {
  CONTACT: {
    NAME: ['Name', 'name', 'Kontaktname', 'Firmenname'],
    CUSTOMER_NUMBER: ['Kundennummer', 'customerNumber', 'Customer Number'],
    EMAIL: ['E-Mail', 'email', 'Email', 'E-Mail-Adresse'],
    PHONE: ['Telefon', 'phone', 'Telefonnummer', 'Phone'],
    WEBSITE: ['Webseite', 'website', 'Website', 'Homepage'],
    STREET: ['Straße', 'street', 'Street', 'Strasse'],
    ZIP: ['PLZ', 'zip', 'zipCode', 'Postleitzahl'],
    CITY: ['Stadt', 'city', 'City', 'Ort'],
    COUNTRY: ['Land', 'country', 'Country', 'Ländercode'],
    TAX_NUMBER: ['Steuernummer', 'taxNumber', 'Tax Number'],
    VAT_NUMBER: ['USt-IdNr.', 'vatNumber', 'VAT Number', 'UStIdNr'],
    CATEGORY: ['Kategorie', 'category', 'Category'],
    DESCRIPTION: ['Beschreibung', 'description', 'Description', 'Notizen'],
  },
  INVOICE: {
    INVOICE_NUMBER: ['Rechnungsnummer', 'invoiceNumber', 'Invoice Number', 'Nr.'],
    CONTACT_NAME: ['Kunde', 'contactName', 'Customer', 'Kundenname'],
    INVOICE_DATE: ['Rechnungsdatum', 'invoiceDate', 'Invoice Date', 'Datum'],
    DELIVERY_DATE: ['Lieferdatum', 'deliveryDate', 'Delivery Date', 'Leistungsdatum'],
    STATUS: ['Status', 'status', 'State'],
    HEADER: ['Kopfzeile', 'header', 'Header'],
    HEAD_TEXT: ['Einleitungstext', 'headText', 'Introduction'],
    FOOT_TEXT: ['Schlusstext', 'footText', 'Footer'],
    ADDRESS_NAME: ['Adressname', 'addressName', 'Address Name'],
    ADDRESS_STREET: ['Adressstraße', 'addressStreet', 'Address Street'],
    ADDRESS_ZIP: ['Adress-PLZ', 'addressZip', 'Address ZIP'],
    ADDRESS_CITY: ['Adressstadt', 'addressCity', 'Address City'],
    ADDRESS_COUNTRY: ['Adressland', 'addressCountry', 'Address Country'],
    CURRENCY: ['Währung', 'currency', 'Currency'],
    SUM_NET: ['Nettosumme', 'sumNet', 'Net Total', 'Netto'],
    SUM_TAX: ['MwSt.', 'sumTax', 'Tax', 'Steuerbetrag'],
    SUM_GROSS: ['Bruttosumme', 'sumGross', 'Gross Total', 'Brutto'],
    SUM_DISCOUNT: ['Rabatt', 'sumDiscount', 'Discount'],
    CUSTOMER_NOTE: ['Kundennotiz', 'customerInternalNote', 'Internal Note'],
  },
  INVOICE_LINE_ITEM: {
    NAME: ['Artikelname', 'name', 'Name', 'Bezeichnung'],
    TEXT: ['Beschreibung', 'text', 'Description'],
    QUANTITY: ['Menge', 'quantity', 'Quantity', 'Anzahl'],
    UNITY: ['Einheit', 'unity', 'Unit', 'Mengeneinheit'],
    PRICE: ['Preis', 'price', 'Price', 'Einzelpreis'],
    TAX_RATE: ['Steuersatz', 'taxRate', 'Tax Rate', 'MwSt-Satz'],
    DISCOUNT: ['Rabatt', 'discount', 'Discount'],
    TOTAL: ['Gesamt', 'total', 'Total', 'Summe'],
  },
  EXPENSE: {
    DATE: ['Datum', 'date', 'Date', 'Belegdatum'],
    SUPPLIER: ['Lieferant', 'supplier', 'Supplier', 'Kreditor'],
    DESCRIPTION: ['Beschreibung', 'description', 'Description', 'Verwendungszweck'],
    CATEGORY: ['Kategorie', 'category', 'Category', 'Buchungskategorie'],
    AMOUNT: ['Betrag', 'amount', 'Amount', 'Summe'],
    TAX_RATE: ['Steuersatz', 'taxRate', 'Tax Rate', 'MwSt-Satz'],
    TAX_AMOUNT: ['Steuerbetrag', 'taxAmount', 'Tax Amount', 'MwSt-Betrag'],
    CURRENCY: ['Währung', 'currency', 'Currency'],
    PAYMENT_METHOD: ['Zahlungsart', 'paymentMethod', 'Payment Method'],
    RECEIPT_NUMBER: ['Belegnummer', 'receiptNumber', 'Receipt Number'],
    NOTES: ['Notizen', 'notes', 'Notes', 'Bemerkung'],
  },
  PRODUCT: {
    NAME: ['Artikelname', 'name', 'Name', 'Bezeichnung'],
    PRODUCT_NUMBER: ['Artikelnummer', 'productNumber', 'Product Number', 'Art.-Nr.'],
    DESCRIPTION: ['Beschreibung', 'description', 'Description'],
    PRICE: ['Preis', 'price', 'Price', 'Verkaufspreis'],
    PRICE_PURCHASE: ['Einkaufspreis', 'pricePurchase', 'Purchase Price'],
    PRICE_NET: ['Nettopreis', 'priceNet', 'Net Price'],
    PRICE_GROSS: ['Bruttopreis', 'priceGross', 'Gross Price'],
    TAX_RATE: ['Steuersatz', 'taxRate', 'Tax Rate', 'MwSt-Satz'],
    UNITY: ['Einheit', 'unity', 'Unit', 'Mengeneinheit'],
    CATEGORY: ['Kategorie', 'category', 'Category'],
    STOCK: ['Bestand', 'stock', 'Stock', 'Lagerbestand'],
    STOCK_ENABLED: ['Lagerverwaltung', 'stockEnabled', 'Stock Management'],
    ACTIVE: ['Aktiv', 'active', 'Active', 'Status'],
  },
};

/**
 * Field Mappings from sevDesk to Operate Schema
 */
export const SEVDESK_FIELD_MAPPINGS: Record<SevDeskEntityType, SevDeskFieldMapping[]> = {
  [SevDeskEntityType.CONTACT]: [
    { sevDeskField: 'name', operateField: 'name', required: true },
    { sevDeskField: 'customerNumber', operateField: 'customerNumber' },
    { sevDeskField: 'email', operateField: 'email' },
    { sevDeskField: 'phone', operateField: 'phone' },
    { sevDeskField: 'website', operateField: 'website' },
    { sevDeskField: 'street', operateField: 'address.street' },
    { sevDeskField: 'zip', operateField: 'address.zipCode' },
    { sevDeskField: 'city', operateField: 'address.city' },
    { sevDeskField: 'country', operateField: 'address.country', transform: (val) => val?.toUpperCase() },
    { sevDeskField: 'taxNumber', operateField: 'taxNumber' },
    { sevDeskField: 'vatNumber', operateField: 'vatNumber' },
    { sevDeskField: 'category', operateField: 'category' },
    { sevDeskField: 'description', operateField: 'notes' },
  ],
  [SevDeskEntityType.INVOICE]: [
    { sevDeskField: 'invoiceNumber', operateField: 'invoiceNumber', required: true },
    { sevDeskField: 'contactName', operateField: 'contact.name' },
    { sevDeskField: 'invoiceDate', operateField: 'invoiceDate', required: true, transform: (val) => new Date(val) },
    { sevDeskField: 'deliveryDate', operateField: 'deliveryDate', transform: (val) => val ? new Date(val) : null },
    { sevDeskField: 'status', operateField: 'status' },
    { sevDeskField: 'currency', operateField: 'currency' },
    { sevDeskField: 'sumNet', operateField: 'amountNet', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'sumTax', operateField: 'amountTax', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'sumGross', operateField: 'amountGross', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'sumDiscount', operateField: 'discount', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'header', operateField: 'header' },
    { sevDeskField: 'headText', operateField: 'introText' },
    { sevDeskField: 'footText', operateField: 'footerText' },
    { sevDeskField: 'customerInternalNote', operateField: 'internalNotes' },
  ],
  [SevDeskEntityType.EXPENSE]: [
    { sevDeskField: 'date', operateField: 'date', required: true, transform: (val) => new Date(val) },
    { sevDeskField: 'supplier', operateField: 'vendor' },
    { sevDeskField: 'description', operateField: 'description', required: true },
    { sevDeskField: 'category', operateField: 'category' },
    { sevDeskField: 'amount', operateField: 'amount', required: true, transform: (val) => parseFloat(val) },
    { sevDeskField: 'taxRate', operateField: 'taxRate', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'taxAmount', operateField: 'taxAmount', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'currency', operateField: 'currency' },
    { sevDeskField: 'paymentMethod', operateField: 'paymentMethod' },
    { sevDeskField: 'receiptNumber', operateField: 'receiptNumber' },
    { sevDeskField: 'notes', operateField: 'notes' },
  ],
  [SevDeskEntityType.PRODUCT]: [
    { sevDeskField: 'name', operateField: 'name', required: true },
    { sevDeskField: 'productNumber', operateField: 'sku' },
    { sevDeskField: 'description', operateField: 'description' },
    { sevDeskField: 'price', operateField: 'price', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'pricePurchase', operateField: 'costPrice', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'taxRate', operateField: 'taxRate', transform: (val) => parseFloat(val) || 0 },
    { sevDeskField: 'unity', operateField: 'unit' },
    { sevDeskField: 'category', operateField: 'category' },
    { sevDeskField: 'stock', operateField: 'stockQuantity', transform: (val) => parseInt(val) || 0 },
    { sevDeskField: 'stockEnabled', operateField: 'trackInventory', transform: (val) => val === 'true' || val === '1' },
    { sevDeskField: 'active', operateField: 'isActive', transform: (val) => val === 'true' || val === '1' },
  ],
};

/**
 * Default values for sevDesk entities
 */
export const SEVDESK_DEFAULTS = {
  CURRENCY: 'EUR',
  COUNTRY: 'DE',
  TAX_RATE: 19,
  UNITY: 'Stk',
  INVOICE_STATUS: 'draft',
  CATEGORY_DEFAULT: 'Sonstige',
};

/**
 * Validation rules
 */
export const SEVDESK_VALIDATION_RULES = {
  CONTACT: {
    name: { required: true, maxLength: 255 },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { maxLength: 50 },
    website: { pattern: /^https?:\/\/.+/ },
    vatNumber: { pattern: /^[A-Z]{2}[0-9A-Z]+$/ },
  },
  INVOICE: {
    invoiceNumber: { required: true, maxLength: 100 },
    invoiceDate: { required: true },
    sumGross: { required: true, min: 0 },
  },
  EXPENSE: {
    date: { required: true },
    description: { required: true, maxLength: 500 },
    amount: { required: true, min: 0 },
  },
  PRODUCT: {
    name: { required: true, maxLength: 255 },
    price: { min: 0 },
    stock: { min: 0 },
  },
};

/**
 * Duplicate detection fields
 */
export const SEVDESK_DUPLICATE_KEYS = {
  [SevDeskEntityType.CONTACT]: ['email', 'customerNumber', 'name'],
  [SevDeskEntityType.INVOICE]: ['invoiceNumber', 'invoiceDate'],
  [SevDeskEntityType.EXPENSE]: ['receiptNumber', 'date', 'amount'],
  [SevDeskEntityType.PRODUCT]: ['productNumber', 'name'],
};

/**
 * Supported file formats
 */
export const SEVDESK_SUPPORTED_FORMATS = {
  CSV: ['.csv'],
  EXCEL: ['.xlsx', '.xls'],
};

export const SEVDESK_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SEVDESK_BATCH_SIZE = 100;
