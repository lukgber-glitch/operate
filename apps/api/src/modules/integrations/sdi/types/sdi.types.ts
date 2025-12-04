/**
 * Sistema di Interscambio (SDI) TypeScript Types
 * Italian Electronic Invoicing System
 *
 * Standards:
 * - FatturaPA v1.2.2
 * - Digital Signature (CAdES-BES, XAdES-BES)
 * - Italian Fiscal Code Validation
 * - Agenzia delle Entrate SDI Protocol
 */

/**
 * SDI Configuration
 */
export interface SDIConfig {
  endpoint: string; // SDI endpoint URL
  transmitterCode: string; // Codice trasmittente (7 chars)
  certificatePath: string; // Path to digital signature certificate
  privateKeyPath: string; // Path to private key
  certificatePassword: string; // Certificate password
  environment: 'production' | 'test';
  mockMode: boolean;
  tlsMinVersion: 'TLSv1.2' | 'TLSv1.3';
  signatureType: 'CAdES-BES' | 'XAdES-BES';
  usePeppol: boolean; // Use Peppol as transport channel
}

/**
 * Codice Fiscale (Italian Tax Code)
 * Format: 16 alphanumeric characters for individuals
 * Format: 11 numeric characters for companies (same as Partita IVA)
 */
export interface CodiceFiscale {
  value: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  valid: boolean;
  validationErrors?: string[];
}

/**
 * Partita IVA (Italian VAT Number)
 * Format: IT + 11 digits
 */
export interface PartitaIVA {
  countryCode: 'IT';
  number: string; // 11 digits
  formatted: string; // IT + 11 digits
  valid: boolean;
}

/**
 * Codice Destinatario (Recipient Code)
 * 7-character code for SDI routing
 * Use '0000000' if sending to PEC email
 */
export interface CodiceDestinatario {
  value: string; // 7 characters
  pecEmail?: string; // Alternative: certified email
}

/**
 * FatturaPA Format Types
 */
export enum FatturaPAFormat {
  FPA12 = 'FPA12', // Public Administration (B2G)
  FPR12 = 'FPR12', // Private sector (B2B, B2C)
}

/**
 * FatturaPA Document Types
 */
export enum FatturaPADocumentType {
  TD01 = 'TD01', // Invoice
  TD02 = 'TD02', // Advance or down payment on invoice
  TD03 = 'TD03', // Advance or down payment on fee
  TD04 = 'TD04', // Credit note
  TD05 = 'TD05', // Debit note
  TD06 = 'TD06', // Fee, compensation or commission
  TD16 = 'TD16', // Internal reverse charge
  TD17 = 'TD17', // Integration/self-invoice for purchase of services from abroad
  TD18 = 'TD18', // Integration for purchase of goods from EU
  TD19 = 'TD19', // Integration/self-invoice for purchase of goods ex art.17 c.2 DPR 633/72
  TD20 = 'TD20', // Self-invoice for regularization and integration of invoices
  TD21 = 'TD21', // Self-invoice for split payment
  TD22 = 'TD22', // Extraction from San Marino
  TD23 = 'TD23', // Integration of invoices for importation of goods already in free circulation
  TD24 = 'TD24', // Deferred invoice
  TD25 = 'TD25', // Deferred credit note
  TD26 = 'TD26', // Sale of depreciable assets and for internal transfers
  TD27 = 'TD27', // Self-invoice for self-consumption or for free allocation without recourse
}

/**
 * SDI Transmission Status
 */
export enum SDITransmissionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED', // RC received
  REJECTED = 'REJECTED', // NS received
  FAILED_DELIVERY = 'FAILED_DELIVERY', // MC received
  ACCEPTED = 'ACCEPTED', // EC accepted
  REFUSED = 'REFUSED', // EC refused
  EXPIRED = 'EXPIRED', // DT received
  PROCESSING = 'PROCESSING',
}

/**
 * SDI Notification Types
 */
export enum SDINotificationType {
  RC = 'RC', // Ricevuta di consegna (Delivery receipt)
  NS = 'NS', // Notifica di scarto (Rejection notice)
  MC = 'MC', // Mancata consegna (Failed delivery)
  NE = 'NE', // Notifica esito (Outcome notification)
  EC = 'EC', // Esito committente (Buyer response)
  DT = 'DT', // Decorrenza termini (Deadline expiry)
}

/**
 * FatturaPA Invoice
 */
export interface FatturaPAInvoice {
  formatoTrasmissione: FatturaPAFormat;
  cedentePrestatore: FatturaPASupplier;
  cessionarioCommittente: FatturaPACustomer;
  datiGenerali: {
    tipoDocumento: FatturaPADocumentType;
    numero: string;
    data: Date;
    importoTotaleDocumento: number;
    causale?: string[];
    art73?: boolean; // Start-up/innovative company
  };
  datiPagamento?: FatturaPaymentData[];
  datiRiepilogo: FatturaTaxSummary[];
  dettaglioLinee: FatturaLine[];
  allegati?: FatturaAttachment[];
}

/**
 * FatturaPA Supplier (Cedente/Prestatore)
 */
export interface FatturaPASupplier {
  datiAnagrafici: {
    idFiscaleIVA: PartitaIVA;
    codiceFiscale?: CodiceFiscale;
    anagrafica: {
      denominazione?: string; // Company name
      nome?: string; // First name (for individuals)
      cognome?: string; // Last name (for individuals)
    };
    regimeFiscale: RegimeFiscale;
  };
  sede: FatturaAddress;
  contattiTrasmittente?: {
    telefono?: string;
    email?: string;
  };
}

/**
 * FatturaPA Customer (Cessionario/Committente)
 */
export interface FatturaPACustomer {
  datiAnagrafici: {
    idFiscaleIVA?: PartitaIVA;
    codiceFiscale: CodiceFiscale;
    anagrafica: {
      denominazione?: string;
      nome?: string;
      cognome?: string;
    };
  };
  sede: FatturaAddress;
  stabileOrganizzazione?: FatturaAddress;
}

/**
 * Italian Address
 */
export interface FatturaAddress {
  indirizzo: string; // Street address
  numeroCivico?: string; // Street number
  cap: string; // Postal code
  comune: string; // Municipality
  provincia?: string; // Province (2 chars)
  nazione: string; // Country code (ISO 3166-1 alpha-2)
}

/**
 * Regime Fiscale (Tax Regime)
 */
export enum RegimeFiscale {
  RF01 = 'RF01', // Ordinario
  RF02 = 'RF02', // Contribuenti minimi
  RF04 = 'RF04', // Agricoltura e attività connesse e pesca
  RF05 = 'RF05', // Vendita sali e tabacchi
  RF06 = 'RF06', // Commercio fiammiferi
  RF07 = 'RF07', // Editoria
  RF08 = 'RF08', // Gestione servizi telefonia pubblica
  RF09 = 'RF09', // Rivendita documenti di trasporto pubblico
  RF10 = 'RF10', // Intrattenimenti, giochi
  RF11 = 'RF11', // Agenzie viaggi e turismo
  RF12 = 'RF12', // Agriturismo
  RF13 = 'RF13', // Vendite a domicilio
  RF14 = 'RF14', // Rivendita beni usati, oggetti arte, antiquariato
  RF15 = 'RF15', // Agenzie aste pubbliche
  RF16 = 'RF16', // IVA per cassa P.A.
  RF17 = 'RF17', // IVA per cassa
  RF19 = 'RF19', // Forfettario
  RF18 = 'RF18', // Altri casi
}

/**
 * FatturaPA Line Item
 */
export interface FatturaLine {
  numeroLinea: number;
  descrizione: string;
  quantita?: number;
  unitaMisura?: string;
  prezzoUnitario: number;
  prezzoTotale: number;
  aliquotaIVA: number;
  natura?: NaturaIVA; // For non-taxable transactions
}

/**
 * Natura IVA (VAT Nature for exempt/non-taxable)
 */
export enum NaturaIVA {
  N1 = 'N1', // Excluded per art. 15
  N2_1 = 'N2.1', // Not subject to VAT - art.7 to 7-septies
  N2_2 = 'N2.2', // Not subject to VAT - other cases
  N3_1 = 'N3.1', // Non-taxable - exports
  N3_2 = 'N3.2', // Non-taxable - intra-EU sales
  N3_3 = 'N3.3', // Non-taxable - sales to San Marino
  N3_4 = 'N3.4', // Non-taxable - operations treated as exports
  N3_5 = 'N3.5', // Non-taxable - following declarations of intent
  N3_6 = 'N3.6', // Non-taxable - other operations
  N4 = 'N4', // Exempt
  N5 = 'N5', // Margin regime
  N6_1 = 'N6.1', // Reverse charge - transfer of scrap
  N6_2 = 'N6.2', // Reverse charge - transfer of gold
  N6_3 = 'N6.3', // Reverse charge - subcontracting in construction
  N6_4 = 'N6.4', // Reverse charge - transfer of buildings
  N6_5 = 'N6.5', // Reverse charge - transfer of mobile phones
  N6_6 = 'N6.6', // Reverse charge - transfer of electronic products
  N6_7 = 'N6.7', // Reverse charge - construction services
  N6_8 = 'N6.8', // Reverse charge - energy sector
  N6_9 = 'N6.9', // Reverse charge - other cases
  N7 = 'N7', // IVA paid in another EU country
}

/**
 * Tax Summary (Dati Riepilogo)
 */
export interface FatturaTaxSummary {
  aliquotaIVA: number;
  natura?: NaturaIVA;
  imponibile: number;
  imposta: number;
  esigibilitaIVA?: EsigibilitaIVA;
  riferimentoNormativo?: string;
}

/**
 * Esigibilità IVA (VAT Collectability)
 */
export enum EsigibilitaIVA {
  I = 'I', // Immediate
  D = 'D', // Deferred
  S = 'S', // Split payment
}

/**
 * Payment Data
 */
export interface FatturaPaymentData {
  condizioniPagamento: CondizioniPagamento;
  dettaglioPagamento: PaymentDetail[];
}

/**
 * Payment Conditions
 */
export enum CondizioniPagamento {
  TP01 = 'TP01', // Payment in installments
  TP02 = 'TP02', // Full payment
  TP03 = 'TP03', // Advance payment
}

/**
 * Payment Detail
 */
export interface PaymentDetail {
  modalitaPagamento: ModalitaPagamento;
  dataScadenzaPagamento?: Date;
  importoPagamento: number;
  iban?: string;
  bic?: string;
  istitutoFinanziario?: string;
}

/**
 * Payment Method
 */
export enum ModalitaPagamento {
  MP01 = 'MP01', // Cash
  MP02 = 'MP02', // Check
  MP03 = 'MP03', // Banker's draft
  MP04 = 'MP04', // Cash at treasury
  MP05 = 'MP05', // Bank transfer
  MP06 = 'MP06', // Promissory note
  MP07 = 'MP07', // Payment slip
  MP08 = 'MP08', // Payment card
  MP09 = 'MP09', // RID
  MP10 = 'MP10', // RID utenze
  MP11 = 'MP11', // RID veloce
  MP12 = 'MP12', // RIBA
  MP13 = 'MP13', // MAV
  MP14 = 'MP14', // Tax receipt
  MP15 = 'MP15', // Special account transfer
  MP16 = 'MP16', // Direct debit
  MP17 = 'MP17', // Direct debit for postal current account
  MP18 = 'MP18', // Postal payment slip
  MP19 = 'MP19', // SEPA Direct Debit
  MP20 = 'MP20', // SEPA Direct Debit CORE
  MP21 = 'MP21', // SEPA Direct Debit B2B
  MP22 = 'MP22', // Deduction on amounts already collected
  MP23 = 'MP23', // PagoPA
}

/**
 * Attachment
 */
export interface FatturaAttachment {
  nomeAttachment: string;
  algoritmoCompressione?: string;
  formatoAttachment: string;
  descrizioneAttachment?: string;
  attachment: string; // Base64 encoded
}

/**
 * SDI Notification
 */
export interface SDINotification {
  id: string;
  organizationId: string;
  invoiceId: string;
  identificativoSdI: string; // SDI File ID
  nomeFile: string; // Filename
  notificationType: SDINotificationType;
  dataRicezione: Date;
  messageId?: string;
  descrizione?: string;
  listaErrori?: SDIError[];
  esito?: 'EC01' | 'EC02'; // EC01 = Accepted, EC02 = Refused
  raw: string; // Raw XML notification
  createdAt: Date;
}

/**
 * SDI Error
 */
export interface SDIError {
  codice: string;
  descrizione: string;
  suggerimento?: string;
}

/**
 * SDI Transmission Record
 */
export interface SDITransmission {
  id: string;
  organizationId: string;
  invoiceId: string;
  identificativoSdI?: string; // Assigned by SDI after successful submission
  nomeFile: string;
  progressivoInvio: string; // Progressive number
  formatoTrasmissione: FatturaPAFormat;
  codiceFiscaleCedente: string;
  partitaIVACedente: string;
  codiceFiscaleCessionario: string;
  codiceDestinatario: string;
  pecDestinatario?: string;
  status: SDITransmissionStatus;
  fatturaXML: string; // FatturaPA XML
  firmato: boolean; // Is digitally signed
  signatureFormat?: 'CAdES-BES' | 'XAdES-BES';
  p7mFile?: Buffer; // Signed file (.p7m)
  notifications: SDINotification[];
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CIG/CUP Codes (for Public Administration)
 */
export interface CigCupCodes {
  codiceCIG?: string; // Codice Identificativo Gara
  codiceCUP?: string; // Codice Unitario Progetto
  codiceCommessa?: string;
  codiceContratto?: string;
}

/**
 * SDI Validation Result
 */
export interface SDIValidationResult {
  valid: boolean;
  errors: SDIValidationError[];
  warnings: SDIValidationError[];
}

/**
 * SDI Validation Error
 */
export interface SDIValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  code?: string;
}

/**
 * Digital Signature Info
 */
export interface DigitalSignatureInfo {
  algorithm: 'RSA' | 'ECDSA';
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  certificateSubject: string;
  certificateIssuer: string;
  certificateSerialNumber: string;
  validFrom: Date;
  validTo: Date;
  signatureFormat: 'CAdES-BES' | 'XAdES-BES';
  timestamped: boolean;
  timestampAuthority?: string;
}

/**
 * SDI Submission Result
 */
export interface SDISubmissionResult {
  success: boolean;
  identificativoSdI?: string;
  nomeFile: string;
  dataRicezione?: Date;
  errors?: SDIError[];
  rawResponse?: string;
}

/**
 * SDI Statistics
 */
export interface SDIStatistics {
  organizationId: string;
  period: {
    from: Date;
    to: Date;
  };
  totalInvoices: number;
  totalAmount: number;
  byStatus: Record<SDITransmissionStatus, number>;
  byDocumentType: Record<FatturaPADocumentType, number>;
  deliveryRate: number; // Percentage
  rejectionRate: number; // Percentage
  averageDeliveryTime?: number; // In hours
}

/**
 * Fiscal Code Validation Result
 */
export interface FiscalCodeValidationResult {
  valid: boolean;
  type: 'INDIVIDUAL' | 'COMPANY' | 'UNKNOWN';
  formatted?: string;
  extractedData?: {
    surname?: string;
    name?: string;
    birthDate?: Date;
    birthPlace?: string;
    gender?: 'M' | 'F';
  };
  errors?: string[];
}
