import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import {
  FacturXInvoiceData,
  FacturXProfile,
  FrenchVATCategory,
  FrenchInvoiceType,
} from '../types/factur-x.types';

/**
 * Factur-X Generator Service
 *
 * Generates EN 16931-compliant Cross Industry Invoice (CII) XML for Factur-X.
 *
 * Schema: UN/CEFACT Cross Industry Invoice D16B
 * Namespace: urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100
 */
@Injectable()
export class FacturXGeneratorService {
  private readonly logger = new Logger(FacturXGeneratorService.name);
  private readonly xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true,
      processEntities: true,
    });
  }

  /**
   * Generate Factur-X XML from invoice data
   */
  async generateXml(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile = FacturXProfile.EN16931,
  ): Promise<string> {
    try {
      this.logger.log(
        `Generating Factur-X XML for invoice ${invoice.number} (profile: ${profile})`,
      );

      const ciiInvoice = this.buildCIIInvoice(invoice, profile);
      const xml = this.xmlBuilder.build(ciiInvoice);

      // Add XML declaration manually (fast-xml-parser doesn't add encoding)
      const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;

      this.logger.log(
        `Successfully generated Factur-X XML for invoice ${invoice.number}`,
      );
      return fullXml;
    } catch (error) {
      this.logger.error(
        `Failed to generate XML: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`XML generation failed: ${error.message}`);
    }
  }

  /**
   * Build CII (Cross Industry Invoice) structure
   */
  private buildCIIInvoice(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile,
  ): any {
    return {
      'rsm:CrossIndustryInvoice': {
        '@_xmlns:rsm':
          'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
        '@_xmlns:qdt':
          'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
        '@_xmlns:ram':
          'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
        '@_xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
        '@_xmlns:udt':
          'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',

        // Context section
        'rsm:ExchangedDocumentContext': this.buildDocumentContext(profile),

        // Header section
        'rsm:ExchangedDocument': this.buildDocument(invoice),

        // Transaction section
        'rsm:SupplyChainTradeTransaction':
          this.buildSupplyChainTradeTransaction(invoice, profile),
      },
    };
  }

  /**
   * Build Document Context (profile and guidelines)
   */
  private buildDocumentContext(profile: FacturXProfile): any {
    const guidelineId = this.getGuidelineId(profile);

    return {
      'ram:GuidelineSpecifiedDocumentContextParameter': {
        'ram:ID': guidelineId,
      },
    };
  }

  /**
   * Build Document Header
   */
  private buildDocument(invoice: FacturXInvoiceData): any {
    return {
      'ram:ID': invoice.number,
      'ram:TypeCode': invoice.type,
      'ram:IssueDateTime': {
        'udt:DateTimeString': {
          '@_format': '102',
          '#text': this.formatDate(invoice.issueDate),
        },
      },
      'ram:IncludedNote': invoice.notes
        ? [
            {
              'ram:Content': invoice.notes,
            },
          ]
        : undefined,
    };
  }

  /**
   * Build Supply Chain Trade Transaction
   */
  private buildSupplyChainTradeTransaction(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile,
  ): any {
    return {
      // Line items
      'ram:IncludedSupplyChainTradeLineItem': invoice.items.map((item, index) =>
        this.buildLineItem(item, index + 1, invoice.currency),
      ),

      // Agreement (parties and references)
      'ram:ApplicableHeaderTradeAgreement':
        this.buildHeaderTradeAgreement(invoice),

      // Delivery
      'ram:ApplicableHeaderTradeDelivery':
        this.buildHeaderTradeDelivery(invoice),

      // Settlement (payment and totals)
      'ram:ApplicableHeaderTradeSettlement':
        this.buildHeaderTradeSettlement(invoice, profile),
    };
  }

  /**
   * Build Line Item
   */
  private buildLineItem(item: any, lineNumber: number, currency: string): any {
    return {
      'ram:AssociatedDocumentLineDocument': {
        'ram:LineID': item.id || lineNumber.toString(),
      },
      'ram:SpecifiedTradeProduct': {
        'ram:Name': item.description,
        'ram:SellerAssignedID': item.productCode || undefined,
      },
      'ram:SpecifiedLineTradeAgreement': {
        'ram:NetPriceProductTradePrice': {
          'ram:ChargeAmount': {
            '@_currencyID': currency,
            '#text': item.unitPrice.toFixed(2),
          },
        },
      },
      'ram:SpecifiedLineTradeDelivery': {
        'ram:BilledQuantity': {
          '@_unitCode': item.unit || 'C62',
          '#text': item.quantity.toString(),
        },
      },
      'ram:SpecifiedLineTradeSettlement': {
        'ram:ApplicableTradeTax': {
          'ram:TypeCode': 'VAT',
          'ram:CategoryCode': item.vat.category,
          'ram:RateApplicablePercent': item.vat.rate.toString(),
        },
        'ram:SpecifiedTradeSettlementLineMonetarySummation': {
          'ram:LineTotalAmount': {
            '@_currencyID': currency,
            '#text': item.netAmount.toFixed(2),
          },
        },
      },
    };
  }

  /**
   * Build Header Trade Agreement (Seller, Buyer, References)
   */
  private buildHeaderTradeAgreement(invoice: FacturXInvoiceData): any {
    return {
      'ram:BuyerReference': invoice.customerReference || undefined,
      'ram:SellerTradeParty': this.buildTradeParty(
        invoice.seller,
        'seller',
        invoice,
      ),
      'ram:BuyerTradeParty': this.buildTradeParty(
        invoice.buyer,
        'buyer',
        invoice,
      ),
      'ram:BuyerOrderReferencedDocument': invoice.purchaseOrderReference
        ? {
            'ram:IssuerAssignedID': invoice.purchaseOrderReference,
          }
        : undefined,
      'ram:ContractReferencedDocument': invoice.contractReference
        ? {
            'ram:IssuerAssignedID': invoice.contractReference,
          }
        : undefined,
    };
  }

  /**
   * Build Trade Party (Seller or Buyer)
   */
  private buildTradeParty(
    party: any,
    role: 'seller' | 'buyer',
    invoice: FacturXInvoiceData,
  ): any {
    const result: any = {
      'ram:Name': party.name,
    };

    // Legal name if different
    if (party.legalName && party.legalName !== party.name) {
      result['ram:SpecifiedLegalOrganization'] = {
        'ram:TradingBusinessName': party.legalName,
      };
    }

    // Address
    if (party.address) {
      result['ram:PostalTradeAddress'] = {
        'ram:PostcodeCode': party.address.postalCode,
        'ram:LineOne': party.address.line1,
        'ram:LineTwo': party.address.line2 || undefined,
        'ram:CityName': party.address.city,
        'ram:CountryID': party.address.country,
      };
    }

    // Electronic address (for Peppol/Chorus Pro)
    if (party.electronicAddress) {
      result['ram:URIUniversalCommunication'] = {
        'ram:URIID': {
          '@_schemeID': 'EM',
          '#text': party.electronicAddress,
        },
      };
    }

    // Tax registration
    if (party.identifiers?.tva) {
      result['ram:SpecifiedTaxRegistration'] = [
        {
          'ram:ID': {
            '@_schemeID': 'VA',
            '#text': party.identifiers.tva,
          },
        },
      ];
    }

    // SIRET for French parties
    if (party.identifiers?.siret) {
      if (!result['ram:SpecifiedTaxRegistration']) {
        result['ram:SpecifiedTaxRegistration'] = [];
      }
      result['ram:SpecifiedTaxRegistration'].push({
        'ram:ID': {
          '@_schemeID': 'FC',
          '#text': party.identifiers.siret,
        },
      });
    }

    // Legal organization (SIRET/SIREN)
    if (party.identifiers?.siret || party.identifiers?.siren) {
      result['ram:SpecifiedLegalOrganization'] = {
        ...result['ram:SpecifiedLegalOrganization'],
        'ram:ID': {
          '@_schemeID': '0002',
          '#text': party.identifiers.siret || party.identifiers.siren,
        },
      };
    }

    return result;
  }

  /**
   * Build Header Trade Delivery
   */
  private buildHeaderTradeDelivery(invoice: FacturXInvoiceData): any {
    return {
      'ram:ActualDeliverySupplyChainEvent': invoice.deliveryDate
        ? {
            'ram:OccurrenceDateTime': {
              'udt:DateTimeString': {
                '@_format': '102',
                '#text': this.formatDate(invoice.deliveryDate),
              },
            },
          }
        : undefined,
    };
  }

  /**
   * Build Header Trade Settlement (Payment, VAT, Totals)
   */
  private buildHeaderTradeSettlement(
    invoice: FacturXInvoiceData,
    profile: FacturXProfile,
  ): any {
    return {
      'ram:InvoiceCurrencyCode': invoice.currency,
      'ram:SpecifiedTradeSettlementPaymentMeans':
        this.buildPaymentMeans(invoice),
      'ram:ApplicableTradeTax': invoice.vatBreakdown.map((vat) =>
        this.buildTradeTax(vat, invoice.currency),
      ),
      'ram:SpecifiedTradePaymentTerms': invoice.paymentTerms
        ? {
            'ram:Description': invoice.paymentTerms,
            'ram:DueDateDateTime': invoice.dueDate
              ? {
                  'udt:DateTimeString': {
                    '@_format': '102',
                    '#text': this.formatDate(invoice.dueDate),
                  },
                }
              : undefined,
          }
        : undefined,
      'ram:SpecifiedTradeSettlementHeaderMonetarySummation':
        this.buildMonetarySummation(invoice),
    };
  }

  /**
   * Build Payment Means
   */
  private buildPaymentMeans(invoice: FacturXInvoiceData): any {
    if (!invoice.paymentMeans && !invoice.bankAccount) {
      return undefined;
    }

    const result: any = {
      'ram:TypeCode': invoice.paymentMeans || '30', // Default: bank transfer
    };

    if (invoice.bankAccount) {
      result['ram:PayeePartyCreditorFinancialAccount'] = {
        'ram:IBANID': invoice.bankAccount.iban,
        'ram:AccountName': invoice.bankAccount.bankName || undefined,
      };

      if (invoice.bankAccount.bic) {
        result['ram:PayeeSpecifiedCreditorFinancialInstitution'] = {
          'ram:BICID': invoice.bankAccount.bic,
        };
      }
    }

    return result;
  }

  /**
   * Build Trade Tax (VAT breakdown)
   */
  private buildTradeTax(vat: any, currency: string): any {
    return {
      'ram:CalculatedAmount': {
        '@_currencyID': currency,
        '#text': vat.vatAmount.toFixed(2),
      },
      'ram:TypeCode': 'VAT',
      'ram:ExemptionReason':
        vat.category === FrenchVATCategory.EXEMPT ||
        vat.category === FrenchVATCategory.REVERSE_CHARGE
          ? this.getVATExemptionReason(vat.category)
          : undefined,
      'ram:BasisAmount': {
        '@_currencyID': currency,
        '#text': vat.taxableAmount.toFixed(2),
      },
      'ram:CategoryCode': vat.category,
      'ram:RateApplicablePercent':
        vat.rate > 0 ? vat.rate.toString() : undefined,
    };
  }

  /**
   * Build Monetary Summation (Totals)
   */
  private buildMonetarySummation(invoice: FacturXInvoiceData): any {
    return {
      'ram:LineTotalAmount': {
        '@_currencyID': invoice.currency,
        '#text': invoice.subtotal.toFixed(2),
      },
      'ram:TaxBasisTotalAmount': {
        '@_currencyID': invoice.currency,
        '#text': invoice.subtotal.toFixed(2),
      },
      'ram:TaxTotalAmount': {
        '@_currencyID': invoice.currency,
        '#text': invoice.totalVAT.toFixed(2),
      },
      'ram:GrandTotalAmount': {
        '@_currencyID': invoice.currency,
        '#text': invoice.totalAmount.toFixed(2),
      },
      'ram:DuePayableAmount': {
        '@_currencyID': invoice.currency,
        '#text': invoice.totalAmount.toFixed(2),
      },
    };
  }

  /**
   * Get Guideline ID for Factur-X profile
   */
  private getGuidelineId(profile: FacturXProfile): string {
    switch (profile) {
      case FacturXProfile.MINIMUM:
        return 'urn:factur-x.eu:1p0:minimum';
      case FacturXProfile.BASIC_WL:
        return 'urn:factur-x.eu:1p0:basicwl';
      case FacturXProfile.BASIC:
        return 'urn:factur-x.eu:1p0:basic';
      case FacturXProfile.EN16931:
        return 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931';
      case FacturXProfile.EXTENDED:
        return 'urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended';
      default:
        return 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931';
    }
  }

  /**
   * Get VAT exemption reason text
   */
  private getVATExemptionReason(category: FrenchVATCategory): string {
    switch (category) {
      case FrenchVATCategory.EXEMPT:
        return 'TVA non applicable, art. 293 B du CGI';
      case FrenchVATCategory.REVERSE_CHARGE:
        return 'Autoliquidation';
      case FrenchVATCategory.INTRA_EU:
        return 'Livraison intracommunautaire';
      case FrenchVATCategory.EXPORT:
        return 'Exportation hors UE';
      default:
        return 'Exempt';
    }
  }

  /**
   * Format date to YYYYMMDD format (102)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
