/**
 * InvoiceNow Mapper
 * Maps internal invoice format to Peppol BIS Billing 3.0 (PINT-SG) UBL format
 */

import { Injectable, Logger } from '@nestjs/common';
import { Builder } from 'xml2js';
import {
  InvoiceNowDocument,
  InvoiceNowDocumentType,
  SingaporeGstCategory,
} from '@operate/shared/types/integrations/invoice-now.types';
import {
  PINT_SG,
  SINGAPORE_COUNTRY_CODE,
  SINGAPORE_PEPPOL_SCHEME,
  INVOICE_TYPE_CODES,
  UBL_TAX_CATEGORY_IDS,
} from './invoice-now.constants';

/**
 * InvoiceNow to UBL Mapper
 * Converts InvoiceNow documents to UBL 2.1 XML format
 */
@Injectable()
export class InvoiceNowMapper {
  private readonly logger = new Logger(InvoiceNowMapper.name);
  private readonly xmlBuilder: Builder;

  constructor() {
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
    });
  }

  /**
   * Convert InvoiceNow document to UBL XML
   */
  toUblXml(document: InvoiceNowDocument): string {
    this.logger.debug('Converting document to UBL XML', {
      documentType: document.documentType,
      invoiceNumber: document.invoiceNumber,
    });

    const ublDocument = this.buildUblDocument(document);
    const xml = this.xmlBuilder.buildObject(ublDocument);

    return xml;
  }

  /**
   * Build UBL document structure
   */
  private buildUblDocument(document: InvoiceNowDocument): any {
    const rootElement =
      document.documentType === InvoiceNowDocumentType.CREDIT_NOTE ? 'CreditNote' : 'Invoice';

    const ublDocument = {
      [rootElement]: {
        $: {
          xmlns: `urn:oasis:names:specification:ubl:schema:xsd:${rootElement}-2`,
          'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
          'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        },
        'cbc:CustomizationID': PINT_SG.CUSTOMIZATION_ID,
        'cbc:ProfileID': PINT_SG.PROFILE_ID,
        'cbc:ID': document.invoiceNumber,
        'cbc:IssueDate': this.formatDate(document.issueDate),
        'cbc:DueDate': document.dueDate ? this.formatDate(document.dueDate) : undefined,
        'cbc:InvoiceTypeCode': this.getInvoiceTypeCode(document.documentType),
        'cbc:Note': document.notes,
        'cbc:DocumentCurrencyCode': document.currency,
        'cbc:BuyerReference': document.projectReference,
        'cac:BillingReference': document.billingReference
          ? {
              'cac:InvoiceDocumentReference': {
                'cbc:ID': document.billingReference,
              },
            }
          : undefined,
        'cac:AccountingSupplierParty': this.buildSupplierParty(document),
        'cac:AccountingCustomerParty': this.buildCustomerParty(document),
        'cac:PaymentMeans': document.paymentMeans
          ? this.buildPaymentMeans(document)
          : undefined,
        'cac:PaymentTerms': document.paymentTerms
          ? {
              'cbc:Note': document.paymentTerms,
            }
          : undefined,
        'cac:TaxTotal': this.buildTaxTotal(document),
        'cac:LegalMonetaryTotal': this.buildLegalMonetaryTotal(document),
        [`cac:${rootElement === 'CreditNote' ? 'CreditNoteLine' : 'InvoiceLine'}`]:
          this.buildLines(document),
      },
    };

    return ublDocument;
  }

  /**
   * Build supplier party (AccountingSupplierParty)
   */
  private buildSupplierParty(document: InvoiceNowDocument): any {
    return {
      'cac:Party': {
        'cbc:EndpointID': {
          $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
          _: document.supplier.uen,
        },
        'cac:PartyIdentification': {
          'cbc:ID': {
            $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
            _: document.supplier.uen,
          },
        },
        'cac:PartyName': {
          'cbc:Name': document.supplier.name,
        },
        'cac:PostalAddress': {
          'cbc:StreetName': document.supplier.address.streetName,
          'cbc:CityName': document.supplier.address.cityName,
          'cbc:PostalZone': document.supplier.address.postalCode,
          'cac:Country': {
            'cbc:IdentificationCode': document.supplier.address.countryCode,
          },
        },
        'cac:PartyTaxScheme': document.supplier.gstRegistrationNumber
          ? {
              'cbc:CompanyID': document.supplier.gstRegistrationNumber,
              'cac:TaxScheme': {
                'cbc:ID': 'GST',
              },
            }
          : undefined,
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': document.supplier.name,
          'cbc:CompanyID': {
            $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
            _: document.supplier.uen,
          },
        },
        'cac:Contact': document.supplier.contact
          ? {
              'cbc:Name': document.supplier.contact.name,
              'cbc:Telephone': document.supplier.contact.telephone,
              'cbc:ElectronicMail': document.supplier.contact.email,
            }
          : undefined,
      },
    };
  }

  /**
   * Build customer party (AccountingCustomerParty)
   */
  private buildCustomerParty(document: InvoiceNowDocument): any {
    return {
      'cac:Party': {
        'cbc:EndpointID': {
          $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
          _: document.customer.uen,
        },
        'cac:PartyIdentification': {
          'cbc:ID': {
            $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
            _: document.customer.uen,
          },
        },
        'cac:PartyName': {
          'cbc:Name': document.customer.name,
        },
        'cac:PostalAddress': {
          'cbc:StreetName': document.customer.address.streetName,
          'cbc:CityName': document.customer.address.cityName,
          'cbc:PostalZone': document.customer.address.postalCode,
          'cac:Country': {
            'cbc:IdentificationCode': document.customer.address.countryCode,
          },
        },
        'cac:PartyTaxScheme': document.customer.gstRegistrationNumber
          ? {
              'cbc:CompanyID': document.customer.gstRegistrationNumber,
              'cac:TaxScheme': {
                'cbc:ID': 'GST',
              },
            }
          : undefined,
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': document.customer.name,
          'cbc:CompanyID': {
            $: { schemeID: SINGAPORE_PEPPOL_SCHEME },
            _: document.customer.uen,
          },
        },
        'cac:Contact': document.customer.contact
          ? {
              'cbc:Name': document.customer.contact.name,
              'cbc:Telephone': document.customer.contact.telephone,
              'cbc:ElectronicMail': document.customer.contact.email,
            }
          : undefined,
      },
    };
  }

  /**
   * Build payment means
   */
  private buildPaymentMeans(document: InvoiceNowDocument): any {
    if (!document.paymentMeans) {
      return undefined;
    }

    const paymentMeans: any = {
      'cbc:PaymentMeansCode': document.paymentMeans.paymentMeansCode,
      'cbc:PaymentID': document.paymentMeans.paymentId,
    };

    // Bank account details
    if (document.paymentMeans.payeeAccountId) {
      paymentMeans['cac:PayeeFinancialAccount'] = {
        'cbc:ID': document.paymentMeans.payeeAccountId,
        'cbc:Name': document.paymentMeans.payeeAccountName,
        'cac:FinancialInstitutionBranch': document.paymentMeans.payeeBankBic
          ? {
              'cbc:ID': document.paymentMeans.payeeBankBic,
            }
          : undefined,
      };
    }

    // PayNow details (Singapore-specific)
    if (document.paymentMeans.payNowUen || document.paymentMeans.payNowMobile) {
      paymentMeans['cbc:InstructionNote'] = document.paymentMeans.payNowUen
        ? `PayNow UEN: ${document.paymentMeans.payNowUen}`
        : `PayNow Mobile: ${document.paymentMeans.payNowMobile}`;
    }

    return paymentMeans;
  }

  /**
   * Build tax total
   */
  private buildTaxTotal(document: InvoiceNowDocument): any {
    // Group tax amounts by category and rate
    const taxSubtotals = new Map<string, { taxableAmount: number; taxAmount: number; percent: number }>();

    document.lines.forEach((line) => {
      const key = `${line.taxCategory}_${line.taxPercent}`;
      const existing = taxSubtotals.get(key) || { taxableAmount: 0, taxAmount: 0, percent: line.taxPercent };
      existing.taxableAmount += line.lineExtensionAmount;
      existing.taxAmount += line.taxAmount;
      taxSubtotals.set(key, existing);
    });

    return {
      'cbc:TaxAmount': {
        $: { currencyID: document.currency },
        _: document.taxTotal.toFixed(2),
      },
      'cac:TaxSubtotal': Array.from(taxSubtotals.entries()).map(([key, subtotal]) => {
        const [category] = key.split('_');
        return {
          'cbc:TaxableAmount': {
            $: { currencyID: document.currency },
            _: subtotal.taxableAmount.toFixed(2),
          },
          'cbc:TaxAmount': {
            $: { currencyID: document.currency },
            _: subtotal.taxAmount.toFixed(2),
          },
          'cac:TaxCategory': {
            'cbc:ID': this.mapTaxCategoryToUbl(category as SingaporeGstCategory),
            'cbc:Percent': subtotal.percent.toFixed(2),
            'cac:TaxScheme': {
              'cbc:ID': 'GST',
            },
          },
        };
      }),
    };
  }

  /**
   * Build legal monetary total
   */
  private buildLegalMonetaryTotal(document: InvoiceNowDocument): any {
    const lineExtensionAmount = document.lines.reduce(
      (sum, line) => sum + line.lineExtensionAmount,
      0,
    );

    return {
      'cbc:LineExtensionAmount': {
        $: { currencyID: document.currency },
        _: lineExtensionAmount.toFixed(2),
      },
      'cbc:TaxExclusiveAmount': {
        $: { currencyID: document.currency },
        _: lineExtensionAmount.toFixed(2),
      },
      'cbc:TaxInclusiveAmount': {
        $: { currencyID: document.currency },
        _: document.totalAmount.toFixed(2),
      },
      'cbc:PayableAmount': {
        $: { currencyID: document.currency },
        _: document.totalAmount.toFixed(2),
      },
    };
  }

  /**
   * Build invoice lines
   */
  private buildLines(document: InvoiceNowDocument): any[] {
    return document.lines.map((line) => ({
      'cbc:ID': line.id,
      'cbc:InvoicedQuantity': {
        $: { unitCode: line.unitCode },
        _: line.quantity.toString(),
      },
      'cbc:LineExtensionAmount': {
        $: { currencyID: document.currency },
        _: line.lineExtensionAmount.toFixed(2),
      },
      'cac:Item': {
        'cbc:Description': line.description,
        'cac:ClassifiedTaxCategory': {
          'cbc:ID': this.mapTaxCategoryToUbl(line.taxCategory),
          'cbc:Percent': line.taxPercent.toFixed(2),
          'cac:TaxScheme': {
            'cbc:ID': 'GST',
          },
        },
        'cac:CommodityClassification': line.itemClassificationCode
          ? {
              'cbc:ItemClassificationCode': {
                $: { listID: 'UNSPSC' },
                _: line.itemClassificationCode,
              },
            }
          : undefined,
      },
      'cac:Price': {
        'cbc:PriceAmount': {
          $: { currencyID: document.currency },
          _: line.unitPrice.toFixed(2),
        },
      },
    }));
  }

  /**
   * Format date to ISO 8601 (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get invoice type code based on document type
   */
  private getInvoiceTypeCode(documentType: InvoiceNowDocumentType): string {
    switch (documentType) {
      case InvoiceNowDocumentType.INVOICE:
        return INVOICE_TYPE_CODES.COMMERCIAL_INVOICE;
      case InvoiceNowDocumentType.CREDIT_NOTE:
        return INVOICE_TYPE_CODES.CREDIT_NOTE;
      case InvoiceNowDocumentType.DEBIT_NOTE:
        return INVOICE_TYPE_CODES.DEBIT_NOTE;
      case InvoiceNowDocumentType.SELF_BILLED_INVOICE:
        return INVOICE_TYPE_CODES.SELF_BILLED_INVOICE;
      default:
        return INVOICE_TYPE_CODES.COMMERCIAL_INVOICE;
    }
  }

  /**
   * Map Singapore GST category to UBL tax category ID
   */
  private mapTaxCategoryToUbl(category: SingaporeGstCategory): string {
    switch (category) {
      case SingaporeGstCategory.STANDARD_RATED:
        return UBL_TAX_CATEGORY_IDS.STANDARD_RATED;
      case SingaporeGstCategory.ZERO_RATED:
        return UBL_TAX_CATEGORY_IDS.ZERO_RATED;
      case SingaporeGstCategory.EXEMPT:
        return UBL_TAX_CATEGORY_IDS.EXEMPT;
      case SingaporeGstCategory.OUT_OF_SCOPE:
        return UBL_TAX_CATEGORY_IDS.OUT_OF_SCOPE;
      default:
        return UBL_TAX_CATEGORY_IDS.STANDARD_RATED;
    }
  }
}
