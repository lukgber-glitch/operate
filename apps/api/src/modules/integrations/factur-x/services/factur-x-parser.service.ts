import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import {
  FacturXInvoiceData,
  FacturXParseResult,
  FacturXProfile,
  FrenchVATCategory,
  FrenchInvoiceType,
  FrenchPaymentMeans,
  FrenchBusinessIdentifiers,
  FrenchAddress,
  FrenchParty,
  FacturXLineItem,
  FrenchVATBreakdown,
  FrenchVATInfo,
} from '../types/factur-x.types';

/**
 * Factur-X Parser Service
 *
 * Parses Factur-X XML (CII format) into structured invoice data.
 */
@Injectable()
export class FacturXParserService {
  private readonly logger = new Logger(FacturXParserService.name);
  private readonly xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: true, // Remove namespace prefixes for easier parsing
    });
  }

  /**
   * Parse Factur-X XML to invoice data
   */
  async parseXml(xml: string): Promise<FacturXParseResult> {
    try {
      this.logger.log('Parsing Factur-X XML');

      // Parse XML
      const parsed = this.xmlParser.parse(xml);

      // Navigate to CrossIndustryInvoice root
      const cii =
        parsed.CrossIndustryInvoice ||
        parsed['rsm:CrossIndustryInvoice'] ||
        null;
      if (!cii) {
        throw new Error('Invalid Factur-X XML: CrossIndustryInvoice not found');
      }

      // Extract profile
      const profile = this.extractProfile(cii);

      // Parse invoice data
      const invoice = this.parseCIIInvoice(cii);

      this.logger.log(
        `Successfully parsed Factur-X invoice ${invoice.number} (profile: ${profile})`,
      );

      return {
        success: true,
        invoice,
        xml,
        metadata: {
          profile,
          version: '1.0',
          createdAt: invoice.issueDate,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse XML: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [
          {
            code: 'PARSE_ERROR',
            message: error.message,
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * Extract Factur-X profile from CII
   */
  private extractProfile(cii: any): FacturXProfile {
    try {
      const context = cii.ExchangedDocumentContext;
      const guideline =
        context?.GuidelineSpecifiedDocumentContextParameter?.ID;

      if (typeof guideline === 'string') {
        if (guideline.includes('minimum')) return FacturXProfile.MINIMUM;
        if (guideline.includes('basicwl')) return FacturXProfile.BASIC_WL;
        if (guideline.includes('basic')) return FacturXProfile.BASIC;
        if (guideline.includes('extended')) return FacturXProfile.EXTENDED;
        if (guideline.includes('en16931')) return FacturXProfile.EN16931;
      }

      return FacturXProfile.EN16931; // Default
    } catch (error) {
      this.logger.warn('Could not determine profile, defaulting to EN16931');
      return FacturXProfile.EN16931;
    }
  }

  /**
   * Parse CII Invoice structure
   */
  private parseCIIInvoice(cii: any): FacturXInvoiceData {
    const doc = cii.ExchangedDocument;
    const transaction = cii.SupplyChainTradeTransaction;
    const agreement = transaction.ApplicableHeaderTradeAgreement;
    const delivery = transaction.ApplicableHeaderTradeDelivery;
    const settlement = transaction.ApplicableHeaderTradeSettlement;

    return {
      // Basic info
      number: this.getText(doc.ID),
      issueDate: this.parseDate(doc.IssueDateTime),
      type: this.parseInvoiceType(doc.TypeCode),
      currency: this.getText(settlement.InvoiceCurrencyCode) || 'EUR',

      // Dates
      dueDate: this.parsePaymentDueDate(settlement),
      deliveryDate: this.parseDeliveryDate(delivery),

      // Parties
      seller: this.parseTradeParty(agreement.SellerTradeParty),
      buyer: this.parseTradeParty(agreement.BuyerTradeParty),

      // Line items
      items: this.parseLineItems(
        transaction.IncludedSupplyChainTradeLineItem,
        this.getText(settlement.InvoiceCurrencyCode) || 'EUR',
      ),

      // VAT breakdown
      vatBreakdown: this.parseVATBreakdown(
        settlement.ApplicableTradeTax,
        this.getText(settlement.InvoiceCurrencyCode) || 'EUR',
      ),

      // Totals
      subtotal: this.parseAmount(
        settlement.SpecifiedTradeSettlementHeaderMonetarySummation
          .TaxBasisTotalAmount,
      ),
      totalVAT: this.parseAmount(
        settlement.SpecifiedTradeSettlementHeaderMonetarySummation
          .TaxTotalAmount,
      ),
      totalAmount: this.parseAmount(
        settlement.SpecifiedTradeSettlementHeaderMonetarySummation
          .GrandTotalAmount,
      ),

      // Payment
      paymentTerms: this.getText(
        settlement.SpecifiedTradePaymentTerms?.Description,
      ),
      paymentMeans: this.parsePaymentMeans(
        settlement.SpecifiedTradeSettlementPaymentMeans,
      ),
      bankAccount: this.parseBankAccount(
        settlement.SpecifiedTradeSettlementPaymentMeans,
      ),

      // References
      purchaseOrderReference: this.getText(
        agreement.BuyerOrderReferencedDocument?.IssuerAssignedID,
      ),
      contractReference: this.getText(
        agreement.ContractReferencedDocument?.IssuerAssignedID,
      ),
      customerReference: this.getText(agreement.BuyerReference),

      // Notes
      notes: this.parseNotes(doc.IncludedNote),
    };
  }

  /**
   * Parse Trade Party (Seller/Buyer)
   */
  private parseTradeParty(party: any): FrenchParty {
    const identifiers: FrenchBusinessIdentifiers = {};
    const taxRegs = this.ensureArray(party?.SpecifiedTaxRegistration);

    taxRegs.forEach((reg: any) => {
      const id = this.getText(reg.ID);
      const schemeId = reg.ID?.['@_schemeID'];

      if (schemeId === 'VA') {
        identifiers.tva = id;
      } else if (schemeId === 'FC') {
        identifiers.siret = id;
      }
    });

    // SIRET from legal organization
    const legalOrgId = party?.SpecifiedLegalOrganization?.ID;
    if (legalOrgId) {
      const id = this.getText(legalOrgId);
      if (id && id.length === 14) {
        identifiers.siret = id;
      } else if (id && id.length === 9) {
        identifiers.siren = id;
      }
    }

    const address = party?.PostalTradeAddress;
    const frenchAddress: FrenchAddress = {
      line1: this.getText(address?.LineOne) || '',
      line2: this.getText(address?.LineTwo),
      postalCode: this.getText(address?.PostcodeCode) || '',
      city: this.getText(address?.CityName) || '',
      country: this.getText(address?.CountryID) || 'FR',
    };

    return {
      name: this.getText(party?.Name) || '',
      legalName:
        this.getText(party?.SpecifiedLegalOrganization?.TradingBusinessName),
      address: frenchAddress,
      identifiers,
      electronicAddress: this.getText(
        party?.URIUniversalCommunication?.URIID,
      ),
      contact: party?.DefinedTradeContact
        ? {
            name: this.getText(party.DefinedTradeContact.PersonName),
            phone: this.getText(
              party.DefinedTradeContact.TelephoneUniversalCommunication
                ?.CompleteNumber,
            ),
            email: this.getText(
              party.DefinedTradeContact.EmailURIUniversalCommunication?.URIID,
            ),
          }
        : undefined,
    };
  }

  /**
   * Parse line items
   */
  private parseLineItems(items: any, currency: string): FacturXLineItem[] {
    const itemsArray = this.ensureArray(items);

    return itemsArray.map((item: any) => {
      const agreement = item.SpecifiedLineTradeAgreement;
      const delivery = item.SpecifiedLineTradeDelivery;
      const settlement = item.SpecifiedLineTradeSettlement;
      const tax = settlement?.ApplicableTradeTax;

      const quantity = this.parseFloat(delivery?.BilledQuantity);
      const unitPrice = this.parseAmount(
        agreement?.NetPriceProductTradePrice?.ChargeAmount,
      );
      const netAmount = this.parseAmount(
        settlement?.SpecifiedTradeSettlementLineMonetarySummation
          ?.LineTotalAmount,
      );

      const vatRate = this.parseFloat(tax?.RateApplicablePercent) || 0;
      const vatCategory = this.parseVATCategory(tax?.CategoryCode);
      const vatAmount = (netAmount * vatRate) / 100;

      return {
        id: this.getText(item.AssociatedDocumentLineDocument?.LineID) || '1',
        description: this.getText(item.SpecifiedTradeProduct?.Name) || '',
        quantity,
        unit:
          delivery?.BilledQuantity?.['@_unitCode'] ||
          this.getText(delivery?.BilledQuantity?.['@_unitCode']) ||
          'C62',
        unitPrice,
        netAmount,
        vat: {
          rate: vatRate,
          category: vatCategory,
          amount: vatAmount,
        },
        productCode: this.getText(
          item.SpecifiedTradeProduct?.SellerAssignedID,
        ),
      };
    });
  }

  /**
   * Parse VAT breakdown
   */
  private parseVATBreakdown(
    taxes: any,
    currency: string,
  ): FrenchVATBreakdown[] {
    const taxesArray = this.ensureArray(taxes);

    return taxesArray.map((tax: any) => ({
      rate: this.parseFloat(tax.RateApplicablePercent) || 0,
      category: this.parseVATCategory(tax.CategoryCode),
      taxableAmount: this.parseAmount(tax.BasisAmount),
      vatAmount: this.parseAmount(tax.CalculatedAmount),
    }));
  }

  /**
   * Parse VAT category code
   */
  private parseVATCategory(code: string): FrenchVATCategory {
    const codeStr = this.getText(code)?.toUpperCase();

    switch (codeStr) {
      case 'S':
        return FrenchVATCategory.STANDARD;
      case 'AA':
        return FrenchVATCategory.REDUCED;
      case 'AB':
        return FrenchVATCategory.SUPER_REDUCED;
      case 'Z':
        return FrenchVATCategory.ZERO_RATED;
      case 'E':
        return FrenchVATCategory.EXEMPT;
      case 'AE':
        return FrenchVATCategory.REVERSE_CHARGE;
      case 'K':
        return FrenchVATCategory.INTRA_EU;
      case 'G':
        return FrenchVATCategory.EXPORT;
      default:
        return FrenchVATCategory.STANDARD;
    }
  }

  /**
   * Parse invoice type code
   */
  private parseInvoiceType(code: any): FrenchInvoiceType {
    const typeCode = this.getText(code);

    switch (typeCode) {
      case '380':
        return FrenchInvoiceType.COMMERCIAL;
      case '381':
        return FrenchInvoiceType.CREDIT_NOTE;
      case '383':
        return FrenchInvoiceType.DEBIT_NOTE;
      case '384':
        return FrenchInvoiceType.CORRECTIVE;
      case '386':
        return FrenchInvoiceType.PREPAYMENT;
      case '389':
        return FrenchInvoiceType.SELF_BILLED;
      default:
        return FrenchInvoiceType.COMMERCIAL;
    }
  }

  /**
   * Parse payment means
   */
  private parsePaymentMeans(paymentMeans: any): FrenchPaymentMeans | undefined {
    const code = this.getText(paymentMeans?.TypeCode);
    if (!code) return undefined;

    return code as FrenchPaymentMeans;
  }

  /**
   * Parse bank account
   */
  private parseBankAccount(paymentMeans: any): any {
    const account = paymentMeans?.PayeePartyCreditorFinancialAccount;
    if (!account) return undefined;

    return {
      iban: this.getText(account.IBANID),
      bic: this.getText(
        paymentMeans?.PayeeSpecifiedCreditorFinancialInstitution?.BICID,
      ),
      bankName: this.getText(account.AccountName),
    };
  }

  /**
   * Parse date from DateTimeString
   */
  private parseDate(dateTime: any): Date {
    const dateStr = this.getText(dateTime?.DateTimeString);
    if (!dateStr) return new Date();

    // Format 102 = YYYYMMDD
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      return new Date(year, month, day);
    }

    // Try ISO format
    return new Date(dateStr);
  }

  /**
   * Parse payment due date
   */
  private parsePaymentDueDate(settlement: any): Date | undefined {
    const dueDate =
      settlement?.SpecifiedTradePaymentTerms?.DueDateDateTime?.DateTimeString;
    if (!dueDate) return undefined;

    return this.parseDate({ DateTimeString: dueDate });
  }

  /**
   * Parse delivery date
   */
  private parseDeliveryDate(delivery: any): Date | undefined {
    const deliveryDate =
      delivery?.ActualDeliverySupplyChainEvent?.OccurrenceDateTime
        ?.DateTimeString;
    if (!deliveryDate) return undefined;

    return this.parseDate({ DateTimeString: deliveryDate });
  }

  /**
   * Parse notes
   */
  private parseNotes(notes: any): string | undefined {
    const notesArray = this.ensureArray(notes);
    if (notesArray.length === 0) return undefined;

    return notesArray
      .map((note: any) => this.getText(note.Content))
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Parse amount from object with currencyID attribute
   */
  private parseAmount(obj: any): number {
    if (!obj) return 0;

    const value =
      typeof obj === 'object' ? obj['#text'] || obj : obj;

    return this.parseFloat(value);
  }

  /**
   * Get text from object (handles both string and object with #text)
   */
  private getText(obj: any): string | undefined {
    if (!obj) return undefined;
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj['#text']) return obj['#text'];
    return String(obj);
  }

  /**
   * Parse float value
   */
  private parseFloat(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'object' && value['#text']) {
      return parseFloat(value['#text']) || 0;
    }
    return 0;
  }

  /**
   * Ensure value is an array
   */
  private ensureArray(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
