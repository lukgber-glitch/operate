import { Injectable, Logger } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import {
  XRechnungSyntax,
  InvoiceData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ComplianceResult,
  ComplianceIssue,
  XRechnungInvoice,
  XRECHNUNG_REQUIRED_FIELDS,
  XRECHNUNG_VERSION,
} from '../types/xrechnung.types';

/**
 * XRechnung Service
 * Handles generation, validation, and parsing of XRechnung invoices
 * XRechnung is the mandatory e-invoice format for German B2G contracts
 */
@Injectable()
export class XRechnungService {
  private readonly logger = new Logger(XRechnungService.name);
  private readonly xmlParser: XMLParser;
  private readonly xmlBuilder: XMLBuilder;

  constructor() {
    // Initialize XML parser with appropriate settings
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false,
      trimValues: true,
    });

    // Initialize XML builder
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true,
    });
  }

  /**
   * Generate XRechnung XML from invoice data
   * @param invoice - Internal invoice data
   * @param syntax - XML syntax to use (UBL or CII)
   * @returns XRechnung XML string
   */
  async generateXRechnung(
    invoice: InvoiceData,
    syntax: XRechnungSyntax = XRechnungSyntax.UBL,
  ): Promise<string> {
    this.logger.debug(
      `Generating XRechnung for invoice ${invoice.number} with syntax ${syntax}`,
    );

    // Check compliance before generation
    const compliance = this.checkCompliance(invoice);
    if (!compliance.compliant) {
      throw new Error(
        `Invoice does not meet XRechnung requirements: ${compliance.missingFields.join(', ')}`,
      );
    }

    // Map to XRechnung format
    const xrechnungInvoice = this.mapToXRechnung(invoice, syntax);

    // Generate XML based on syntax
    const xml =
      syntax === XRechnungSyntax.UBL
        ? this.generateUBL(xrechnungInvoice)
        : this.generateCII(xrechnungInvoice);

    this.logger.log(
      `Successfully generated XRechnung for invoice ${invoice.number}`,
    );

    return xml;
  }

  /**
   * Validate XRechnung XML against schema
   * @param xml - XRechnung XML string
   * @returns Validation result
   */
  async validateXRechnung(xml: string): Promise<ValidationResult> {
    this.logger.debug('Validating XRechnung XML');

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Parse XML to check well-formedness
      const parsed = this.xmlParser.parse(xml);

      // Check for required root element
      if (!parsed.Invoice && !parsed.CrossIndustryInvoice) {
        errors.push({
          code: 'INVALID_ROOT',
          message:
            'Invalid root element. Expected Invoice (UBL) or CrossIndustryInvoice (CII)',
          severity: 'error',
        });
      }

      // Detect syntax
      const syntax = parsed.Invoice
        ? XRechnungSyntax.UBL
        : XRechnungSyntax.CII;

      // Validate structure based on syntax
      if (syntax === XRechnungSyntax.UBL) {
        this.validateUBLStructure(parsed, errors, warnings);
      } else {
        this.validateCIIStructure(parsed, errors, warnings);
      }
    } catch (error) {
      errors.push({
        code: 'XML_PARSE_ERROR',
        message: `Failed to parse XML: ${error.message}`,
        severity: 'error',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse incoming XRechnung XML to internal format
   * @param xml - XRechnung XML string
   * @returns Internal invoice data
   */
  async parseXRechnung(xml: string): Promise<InvoiceData> {
    this.logger.debug('Parsing XRechnung XML');

    const parsed = this.xmlParser.parse(xml);

    // Detect syntax and parse accordingly
    if (parsed.Invoice) {
      return this.parseUBL(parsed);
    } else if (parsed.CrossIndustryInvoice) {
      return this.parseCII(parsed);
    } else {
      throw new Error(
        'Invalid XRechnung XML: Unknown root element',
      );
    }
  }

  /**
   * Get list of required fields for XRechnung compliance
   * @returns Array of required field paths
   */
  getRequiredFields(): string[] {
    return [...XRECHNUNG_REQUIRED_FIELDS];
  }

  /**
   * Check if invoice meets XRechnung requirements
   * @param invoice - Invoice data to check
   * @returns Compliance result
   */
  checkCompliance(invoice: InvoiceData): ComplianceResult {
    const missingFields: string[] = [];
    const issues: ComplianceIssue[] = [];

    // Check required fields
    for (const field of XRECHNUNG_REQUIRED_FIELDS) {
      if (!this.hasField(invoice, field)) {
        missingFields.push(field);
        issues.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field is missing: ${field}`,
          field,
          severity: 'error',
        });
      }
    }

    // Check Leitweg-ID for B2G (mandatory)
    if (!invoice.leitwegId) {
      issues.push({
        code: 'MISSING_LEITWEG_ID',
        message:
          'Leitweg-ID is mandatory for German B2G invoices',
        field: 'leitwegId',
        severity: 'error',
      });
    }

    // Validate Leitweg-ID format (if present)
    if (invoice.leitwegId && !this.isValidLeitwegId(invoice.leitwegId)) {
      issues.push({
        code: 'INVALID_LEITWEG_ID',
        message:
          'Leitweg-ID format is invalid. Expected format: XX-XXXXX-XXXXXX or XXXXXXXXXXXX',
        field: 'leitwegId',
        severity: 'error',
      });
    }

    // Check seller VAT ID format
    if (invoice.seller?.vatId && !this.isValidVATId(invoice.seller.vatId)) {
      issues.push({
        code: 'INVALID_VAT_ID',
        message: 'Seller VAT ID format is invalid',
        field: 'seller.vatId',
        severity: 'warning',
      });
    }

    // Check currency is EUR (recommended for XRechnung)
    if (invoice.currency !== 'EUR') {
      issues.push({
        code: 'NON_EUR_CURRENCY',
        message: 'XRechnung recommends EUR as currency',
        field: 'currency',
        severity: 'warning',
      });
    }

    // Check if items array is not empty
    if (!invoice.items || invoice.items.length === 0) {
      issues.push({
        code: 'NO_LINE_ITEMS',
        message: 'Invoice must have at least one line item',
        field: 'items',
        severity: 'error',
      });
    }

    return {
      compliant: issues.filter((i) => i.severity === 'error').length === 0,
      missingFields,
      issues,
    };
  }

  /**
   * Map internal invoice to XRechnung format
   * @private
   */
  private mapToXRechnung(
    invoice: InvoiceData,
    syntax: XRechnungSyntax,
  ): XRechnungInvoice {
    return {
      syntax,
      invoice,
      customizationId: XRECHNUNG_VERSION.SPECIFICATION,
      processId: XRECHNUNG_VERSION.PROCESS_ID,
    };
  }

  /**
   * Generate UBL XML
   * @private
   */
  private generateUBL(xrechnungInvoice: XRechnungInvoice): string {
    const { invoice } = xrechnungInvoice;

    const ublInvoice = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      Invoice: {
        '@_xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        '@_xmlns:cac':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        '@_xmlns:cbc':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',

        'cbc:CustomizationID': xrechnungInvoice.customizationId,
        'cbc:ProfileID': xrechnungInvoice.processId,
        'cbc:ID': invoice.number,
        'cbc:IssueDate': this.formatDate(invoice.issueDate),
        'cbc:DueDate': this.formatDate(invoice.dueDate),
        'cbc:InvoiceTypeCode': '380', // Commercial invoice
        'cbc:DocumentCurrencyCode': invoice.currency,
        'cbc:BuyerReference': invoice.buyer.buyerReference || invoice.leitwegId,

        // Seller party
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              '@_schemeID': 'EM',
              '#text': invoice.seller.email || 'seller@example.com',
            },
            'cac:PartyName': {
              'cbc:Name': invoice.seller.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.seller.address.street,
              'cbc:CityName': invoice.seller.address.city,
              'cbc:PostalZone': invoice.seller.address.postalCode,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.seller.address.country,
              },
            },
            'cac:PartyTaxScheme': {
              'cbc:CompanyID': invoice.seller.vatId,
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.seller.name,
            },
          },
        },

        // Buyer party
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              '@_schemeID': 'EM',
              '#text': invoice.buyer.email || 'buyer@example.com',
            },
            'cac:PartyName': {
              'cbc:Name': invoice.buyer.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.buyer.address.street,
              'cbc:CityName': invoice.buyer.address.city,
              'cbc:PostalZone': invoice.buyer.address.postalCode,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.buyer.address.country,
              },
            },
            ...(invoice.buyer.vatId && {
              'cac:PartyTaxScheme': {
                'cbc:CompanyID': invoice.buyer.vatId,
                'cac:TaxScheme': {
                  'cbc:ID': 'VAT',
                },
              },
            }),
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.buyer.name,
            },
          },
        },

        // Payment means
        ...(invoice.bankDetails && {
          'cac:PaymentMeans': {
            'cbc:PaymentMeansCode': '58', // SEPA credit transfer
            'cac:PayeeFinancialAccount': {
              'cbc:ID': invoice.bankDetails.iban,
              'cbc:Name': invoice.bankDetails.accountHolder,
              ...(invoice.bankDetails.bic && {
                'cac:FinancialInstitutionBranch': {
                  'cbc:ID': invoice.bankDetails.bic,
                },
              }),
            },
          },
        }),

        // Tax total
        'cac:TaxTotal': {
          'cbc:TaxAmount': {
            '@_currencyID': invoice.currency,
            '#text': invoice.taxAmount.toFixed(2),
          },
          'cac:TaxSubtotal': {
            'cbc:TaxableAmount': {
              '@_currencyID': invoice.currency,
              '#text': invoice.subtotal.toFixed(2),
            },
            'cbc:TaxAmount': {
              '@_currencyID': invoice.currency,
              '#text': invoice.taxAmount.toFixed(2),
            },
            'cac:TaxCategory': {
              'cbc:ID': 'S', // Standard rate
              'cbc:Percent': (invoice.vatRate || 19).toFixed(2),
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
          },
        },

        // Monetary totals
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            '@_currencyID': invoice.currency,
            '#text': invoice.subtotal.toFixed(2),
          },
          'cbc:TaxExclusiveAmount': {
            '@_currencyID': invoice.currency,
            '#text': invoice.subtotal.toFixed(2),
          },
          'cbc:TaxInclusiveAmount': {
            '@_currencyID': invoice.currency,
            '#text': invoice.totalAmount.toFixed(2),
          },
          'cbc:PayableAmount': {
            '@_currencyID': invoice.currency,
            '#text': invoice.totalAmount.toFixed(2),
          },
        },

        // Line items
        'cac:InvoiceLine': invoice.items.map((item, index) => ({
          'cbc:ID': (index + 1).toString(),
          'cbc:InvoicedQuantity': {
            '@_unitCode': item.unit || 'C62', // C62 = unit/piece
            '#text': item.quantity.toFixed(2),
          },
          'cbc:LineExtensionAmount': {
            '@_currencyID': invoice.currency,
            '#text': item.amount.toFixed(2),
          },
          'cac:Item': {
            'cbc:Name': item.description,
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': 'S',
              'cbc:Percent': (item.taxRate || invoice.vatRate || 19).toFixed(2),
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              '@_currencyID': invoice.currency,
              '#text': item.unitPrice.toFixed(2),
            },
          },
        })),
      },
    };

    return this.xmlBuilder.build(ublInvoice);
  }

  /**
   * Generate CII XML
   * @private
   */
  private generateCII(xrechnungInvoice: XRechnungInvoice): string {
    const { invoice } = xrechnungInvoice;

    const ciiInvoice = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      'rsm:CrossIndustryInvoice': {
        '@_xmlns:rsm':
          'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
        '@_xmlns:ram':
          'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
        '@_xmlns:qdt':
          'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
        '@_xmlns:udt':
          'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',

        'rsm:ExchangedDocumentContext': {
          'ram:GuidelineSpecifiedDocumentContextParameter': {
            'ram:ID': xrechnungInvoice.customizationId,
          },
          'ram:BusinessProcessSpecifiedDocumentContextParameter': {
            'ram:ID': xrechnungInvoice.processId,
          },
        },

        'rsm:ExchangedDocument': {
          'ram:ID': invoice.number,
          'ram:TypeCode': '380',
          'ram:IssueDateTime': {
            'udt:DateTimeString': {
              '@_format': '102',
              '#text': this.formatDateCII(invoice.issueDate),
            },
          },
        },

        'rsm:SupplyChainTradeTransaction': {
          // Line items
          'ram:IncludedSupplyChainTradeLineItem': invoice.items.map(
            (item, index) => ({
              'ram:AssociatedDocumentLineDocument': {
                'ram:LineID': (index + 1).toString(),
              },
              'ram:SpecifiedTradeProduct': {
                'ram:Name': item.description,
              },
              'ram:SpecifiedLineTradeAgreement': {
                'ram:NetPriceProductTradePrice': {
                  'ram:ChargeAmount': item.unitPrice.toFixed(2),
                },
              },
              'ram:SpecifiedLineTradeDelivery': {
                'ram:BilledQuantity': {
                  '@_unitCode': item.unit || 'C62',
                  '#text': item.quantity.toFixed(2),
                },
              },
              'ram:SpecifiedLineTradeSettlement': {
                'ram:ApplicableTradeTax': {
                  'ram:TypeCode': 'VAT',
                  'ram:CategoryCode': 'S',
                  'ram:RateApplicablePercent':
                    (item.taxRate || invoice.vatRate || 19).toFixed(2),
                },
                'ram:SpecifiedTradeSettlementLineMonetarySummation': {
                  'ram:LineTotalAmount': item.amount.toFixed(2),
                },
              },
            }),
          ),

          // Header trade agreement
          'ram:ApplicableHeaderTradeAgreement': {
            'ram:BuyerReference': invoice.buyer.buyerReference || invoice.leitwegId,
            'ram:SellerTradeParty': {
              'ram:Name': invoice.seller.name,
              'ram:PostalTradeAddress': {
                'ram:LineOne': invoice.seller.address.street,
                'ram:CityName': invoice.seller.address.city,
                'ram:PostcodeCode': invoice.seller.address.postalCode,
                'ram:CountryID': invoice.seller.address.country,
              },
              'ram:SpecifiedTaxRegistration': {
                'ram:ID': {
                  '@_schemeID': 'VA',
                  '#text': invoice.seller.vatId,
                },
              },
            },
            'ram:BuyerTradeParty': {
              'ram:Name': invoice.buyer.name,
              'ram:PostalTradeAddress': {
                'ram:LineOne': invoice.buyer.address.street,
                'ram:CityName': invoice.buyer.address.city,
                'ram:PostcodeCode': invoice.buyer.address.postalCode,
                'ram:CountryID': invoice.buyer.address.country,
              },
              ...(invoice.buyer.vatId && {
                'ram:SpecifiedTaxRegistration': {
                  'ram:ID': {
                    '@_schemeID': 'VA',
                    '#text': invoice.buyer.vatId,
                  },
                },
              }),
            },
          },

          // Header trade delivery
          'ram:ApplicableHeaderTradeDelivery': {},

          // Header trade settlement
          'ram:ApplicableHeaderTradeSettlement': {
            'ram:InvoiceCurrencyCode': invoice.currency,
            ...(invoice.bankDetails && {
              'ram:SpecifiedTradeSettlementPaymentMeans': {
                'ram:TypeCode': '58',
                'ram:PayeePartyCreditorFinancialAccount': {
                  'ram:IBANID': invoice.bankDetails.iban,
                  'ram:AccountName': invoice.bankDetails.accountHolder,
                },
                ...(invoice.bankDetails.bic && {
                  'ram:PayeeSpecifiedCreditorFinancialInstitution': {
                    'ram:BICID': invoice.bankDetails.bic,
                  },
                }),
              },
            }),
            'ram:ApplicableTradeTax': {
              'ram:CalculatedAmount': invoice.taxAmount.toFixed(2),
              'ram:TypeCode': 'VAT',
              'ram:BasisAmount': invoice.subtotal.toFixed(2),
              'ram:CategoryCode': 'S',
              'ram:RateApplicablePercent': (invoice.vatRate || 19).toFixed(2),
            },
            'ram:SpecifiedTradePaymentTerms': {
              'ram:DueDateDateTime': {
                'udt:DateTimeString': {
                  '@_format': '102',
                  '#text': this.formatDateCII(invoice.dueDate),
                },
              },
            },
            'ram:SpecifiedTradeSettlementHeaderMonetarySummation': {
              'ram:LineTotalAmount': invoice.subtotal.toFixed(2),
              'ram:TaxBasisTotalAmount': invoice.subtotal.toFixed(2),
              'ram:TaxTotalAmount': {
                '@_currencyID': invoice.currency,
                '#text': invoice.taxAmount.toFixed(2),
              },
              'ram:GrandTotalAmount': invoice.totalAmount.toFixed(2),
              'ram:DuePayableAmount': invoice.totalAmount.toFixed(2),
            },
          },
        },
      },
    };

    return this.xmlBuilder.build(ciiInvoice);
  }

  /**
   * Validate UBL structure
   * @private
   */
  private validateUBLStructure(
    parsed: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const invoice = parsed.Invoice;

    // Check required UBL elements
    if (!invoice['cbc:ID']) {
      errors.push({
        code: 'MISSING_INVOICE_ID',
        message: 'Invoice ID is missing',
        field: 'cbc:ID',
        severity: 'error',
      });
    }

    if (!invoice['cbc:IssueDate']) {
      errors.push({
        code: 'MISSING_ISSUE_DATE',
        message: 'Issue date is missing',
        field: 'cbc:IssueDate',
        severity: 'error',
      });
    }

    if (!invoice['cac:AccountingSupplierParty']) {
      errors.push({
        code: 'MISSING_SELLER',
        message: 'Seller information is missing',
        field: 'cac:AccountingSupplierParty',
        severity: 'error',
      });
    }

    if (!invoice['cac:AccountingCustomerParty']) {
      errors.push({
        code: 'MISSING_BUYER',
        message: 'Buyer information is missing',
        field: 'cac:AccountingCustomerParty',
        severity: 'error',
      });
    }

    // Check for BuyerReference (mandatory for XRechnung)
    if (!invoice['cbc:BuyerReference']) {
      errors.push({
        code: 'MISSING_BUYER_REFERENCE',
        message: 'Buyer reference is mandatory for XRechnung',
        field: 'cbc:BuyerReference',
        severity: 'error',
      });
    }
  }

  /**
   * Validate CII structure
   * @private
   */
  private validateCIIStructure(
    parsed: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const invoice = parsed.CrossIndustryInvoice;

    if (!invoice['rsm:ExchangedDocument']) {
      errors.push({
        code: 'MISSING_DOCUMENT',
        message: 'ExchangedDocument is missing',
        field: 'rsm:ExchangedDocument',
        severity: 'error',
      });
    }

    if (!invoice['rsm:SupplyChainTradeTransaction']) {
      errors.push({
        code: 'MISSING_TRANSACTION',
        message: 'SupplyChainTradeTransaction is missing',
        field: 'rsm:SupplyChainTradeTransaction',
        severity: 'error',
      });
    }
  }

  /**
   * Parse UBL to internal format
   * @private
   */
  private parseUBL(parsed: any): InvoiceData {
    const invoice = parsed.Invoice;
    const seller =
      invoice['cac:AccountingSupplierParty']?.['cac:Party'];
    const buyer =
      invoice['cac:AccountingCustomerParty']?.['cac:Party'];
    const monetary = invoice['cac:LegalMonetaryTotal'];
    const tax = invoice['cac:TaxTotal'];

    return {
      number: invoice['cbc:ID'],
      issueDate: new Date(invoice['cbc:IssueDate']),
      dueDate: new Date(invoice['cbc:DueDate']),
      currency: invoice['cbc:DocumentCurrencyCode'],
      subtotal: parseFloat(monetary?.['cbc:TaxExclusiveAmount']?.['#text'] || '0'),
      taxAmount: parseFloat(tax?.['cbc:TaxAmount']?.['#text'] || '0'),
      totalAmount: parseFloat(monetary?.['cbc:PayableAmount']?.['#text'] || '0'),
      seller: {
        name: seller?.['cac:PartyName']?.['cbc:Name'] || '',
        vatId:
          seller?.['cac:PartyTaxScheme']?.['cbc:CompanyID'] || '',
        address: {
          street: seller?.['cac:PostalAddress']?.['cbc:StreetName'] || '',
          city: seller?.['cac:PostalAddress']?.['cbc:CityName'] || '',
          postalCode: seller?.['cac:PostalAddress']?.['cbc:PostalZone'] || '',
          country:
            seller?.['cac:PostalAddress']?.['cac:Country']?.[
              'cbc:IdentificationCode'
            ] || '',
        },
      },
      buyer: {
        name: buyer?.['cac:PartyName']?.['cbc:Name'] || '',
        vatId: buyer?.['cac:PartyTaxScheme']?.['cbc:CompanyID'],
        address: {
          street: buyer?.['cac:PostalAddress']?.['cbc:StreetName'] || '',
          city: buyer?.['cac:PostalAddress']?.['cbc:CityName'] || '',
          postalCode: buyer?.['cac:PostalAddress']?.['cbc:PostalZone'] || '',
          country:
            buyer?.['cac:PostalAddress']?.['cac:Country']?.[
              'cbc:IdentificationCode'
            ] || '',
        },
        buyerReference: invoice['cbc:BuyerReference'],
      },
      items: this.parseUBLLineItems(invoice['cac:InvoiceLine']),
    };
  }

  /**
   * Parse CII to internal format
   * @private
   */
  private parseCII(parsed: any): InvoiceData {
    const invoice = parsed.CrossIndustryInvoice;
    const transaction = invoice['rsm:SupplyChainTradeTransaction'];
    const agreement = transaction?.['ram:ApplicableHeaderTradeAgreement'];
    const settlement = transaction?.['ram:ApplicableHeaderTradeSettlement'];
    const monetary =
      settlement?.['ram:SpecifiedTradeSettlementHeaderMonetarySummation'];

    return {
      number: invoice['rsm:ExchangedDocument']?.['ram:ID'] || '',
      issueDate: new Date(
        invoice['rsm:ExchangedDocument']?.['ram:IssueDateTime']?.[
          'udt:DateTimeString'
        ]?.['#text'] || '',
      ),
      dueDate: new Date(
        settlement?.['ram:SpecifiedTradePaymentTerms']?.[
          'ram:DueDateDateTime'
        ]?.['udt:DateTimeString']?.['#text'] || '',
      ),
      currency: settlement?.['ram:InvoiceCurrencyCode'] || 'EUR',
      subtotal: parseFloat(monetary?.['ram:LineTotalAmount'] || '0'),
      taxAmount: parseFloat(
        monetary?.['ram:TaxTotalAmount']?.['#text'] || '0',
      ),
      totalAmount: parseFloat(monetary?.['ram:GrandTotalAmount'] || '0'),
      seller: {
        name: agreement?.['ram:SellerTradeParty']?.['ram:Name'] || '',
        vatId:
          agreement?.['ram:SellerTradeParty']?.[
            'ram:SpecifiedTaxRegistration'
          ]?.['ram:ID']?.['#text'] || '',
        address: {
          street:
            agreement?.['ram:SellerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:LineOne'] || '',
          city:
            agreement?.['ram:SellerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:CityName'] || '',
          postalCode:
            agreement?.['ram:SellerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:PostcodeCode'] || '',
          country:
            agreement?.['ram:SellerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:CountryID'] || '',
        },
      },
      buyer: {
        name: agreement?.['ram:BuyerTradeParty']?.['ram:Name'] || '',
        address: {
          street:
            agreement?.['ram:BuyerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:LineOne'] || '',
          city:
            agreement?.['ram:BuyerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:CityName'] || '',
          postalCode:
            agreement?.['ram:BuyerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:PostcodeCode'] || '',
          country:
            agreement?.['ram:BuyerTradeParty']?.[
              'ram:PostalTradeAddress'
            ]?.['ram:CountryID'] || '',
        },
        buyerReference: agreement?.['ram:BuyerReference'],
      },
      items: [],
    };
  }

  /**
   * Parse UBL line items
   * @private
   */
  private parseUBLLineItems(lines: any): any[] {
    if (!lines) return [];
    const lineArray = Array.isArray(lines) ? lines : [lines];

    return lineArray.map((line) => ({
      description: line['cac:Item']?.['cbc:Name'] || '',
      quantity: parseFloat(
        line['cbc:InvoicedQuantity']?.['#text'] || '1',
      ),
      unitPrice: parseFloat(
        line['cac:Price']?.['cbc:PriceAmount']?.['#text'] || '0',
      ),
      amount: parseFloat(
        line['cbc:LineExtensionAmount']?.['#text'] || '0',
      ),
      unit: line['cbc:InvoicedQuantity']?.['@_unitCode'],
    }));
  }

  /**
   * Helper: Check if object has nested field
   * @private
   */
  private hasField(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return false;
      current = current[part];
    }

    return current !== null && current !== undefined;
  }

  /**
   * Helper: Validate Leitweg-ID format
   * @private
   */
  private isValidLeitwegId(leitwegId: string): boolean {
    // Leitweg-ID format: XX-XXXXX-XXXXXX or XXXXXXXXXXXX (12-13 characters)
    return /^[A-Z0-9]{2}-[A-Z0-9]{5}-[A-Z0-9]{6}$/.test(leitwegId) ||
      /^[A-Z0-9]{12,13}$/.test(leitwegId);
  }

  /**
   * Helper: Validate VAT ID format
   * @private
   */
  private isValidVATId(vatId: string): boolean {
    // Basic VAT ID validation (starts with country code)
    return /^[A-Z]{2}[A-Z0-9]+$/.test(vatId);
  }

  /**
   * Helper: Format date to YYYY-MM-DD
   * @private
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Format date to YYYYMMDD (CII format)
   * @private
   */
  private formatDateCII(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
}
