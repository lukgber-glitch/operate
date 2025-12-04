/**
 * JP-PINT Mapper
 *
 * Maps between JP-PINT DTOs and UBL XML format
 * Handles Japanese-specific mappings for Peppol integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { Builder } from 'xml2js';
import {
  JPPINTInvoice,
  JPPINTSendDocumentDto,
  JapaneseParty,
  JapaneseTaxInfo,
} from './jp-pint.types';
import {
  JP_PINT_CUSTOMIZATION_ID,
  JP_PINT_PROFILE_ID,
  JP_COUNTRY_CODE,
  JP_TAX_CATEGORIES,
} from './jp-pint.constants';
import { JPPINTValidator } from './jp-pint.validator';

/**
 * JP-PINT Mapper Service
 */
@Injectable()
export class JPPINTMapper {
  private readonly logger = new Logger(JPPINTMapper.name);
  private readonly xmlBuilder: Builder;

  constructor(private readonly validator: JPPINTValidator) {
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
    });
  }

  /**
   * Map JP-PINT DTO to Invoice object
   */
  mapDtoToInvoice(dto: JPPINTSendDocumentDto): JPPINTInvoice {
    const invoice: JPPINTInvoice = {
      customizationId: JP_PINT_CUSTOMIZATION_ID,
      profileId: JP_PINT_PROFILE_ID,
      invoiceNumber: dto.invoiceNumber,
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      timestamp: new Date(dto.timestamp),
      currency: dto.currency,
      supplier: this.mapDtoPartyToJapaneseParty(dto.supplier, true),
      customer: this.mapDtoPartyToJapaneseParty(dto.customer, false),
      lines: dto.lines.map((line) => ({
        id: line.id,
        quantity: line.quantity,
        unitCode: line.unitCode,
        description: line.description,
        priceAmount: line.priceAmount,
        lineExtensionAmount: line.lineExtensionAmount,
        taxPercent: line.taxPercent,
        taxAmount: line.taxAmount,
        taxCategory: line.taxCategory,
      })),
      taxTotal: dto.taxTotal,
      taxBreakdown: dto.taxBreakdown.map((item) => ({
        category: item.category,
        rate: item.rate,
        taxableAmount: item.taxableAmount,
        taxAmount: item.taxAmount,
      })),
      consumptionTaxTotal: dto.taxTotal,
      totalAmount: dto.totalAmount,
      invoiceRegistryNumberSupplier: dto.supplier.invoiceRegistryNumber,
      paymentMeans: dto.paymentMeans
        ? {
            paymentMeansCode: dto.paymentMeans.paymentMeansCode,
            paymentId: dto.paymentMeans.paymentId,
            iban: dto.paymentMeans.bankAccount?.accountNumber,
            bic: dto.paymentMeans.bankAccount?.bankCode,
            accountName: dto.paymentMeans.bankAccount?.accountName,
          }
        : undefined,
    };

    return invoice;
  }

  /**
   * Map DTO party to Japanese party
   */
  private mapDtoPartyToJapaneseParty(
    party: JPPINTSendDocumentDto['supplier'] | JPPINTSendDocumentDto['customer'],
    isSupplier: boolean,
  ): JapaneseParty {
    return {
      participantId: {
        scheme: party.participantId.scheme,
        identifier: party.participantId.identifier,
        formatted: `${party.participantId.scheme}:${party.participantId.identifier}`,
        invoiceRegistryNumber: party.invoiceRegistryNumber,
      },
      name: party.name,
      registeredName: party.registeredName,
      corporateNumber: party.corporateNumber,
      invoiceRegistryNumber: party.invoiceRegistryNumber,
      address: {
        postalCode: party.address.postalCode,
        prefecture: party.address.prefecture,
        city: party.address.city,
        addressLine1: party.address.addressLine1,
        addressLine2: party.address.addressLine2,
        streetName: party.address.addressLine1,
        cityName: party.address.city,
        postalZone: party.address.postalCode,
        countryCode: JP_COUNTRY_CODE,
      },
      vatId: party.invoiceRegistryNumber, // Use invoice registry number as VAT ID
      contact: party.contact,
    };
  }

  /**
   * Convert JP-PINT Invoice to UBL XML
   */
  convertToUBLXML(invoice: JPPINTInvoice): string {
    const ublInvoice = {
      Invoice: {
        $: {
          xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
          'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        },
        'cbc:CustomizationID': invoice.customizationId,
        'cbc:ProfileID': invoice.profileId,
        'cbc:ID': invoice.invoiceNumber,
        'cbc:IssueDate': invoice.issueDate.toISOString().split('T')[0],
        'cbc:IssueTime': invoice.timestamp.toISOString().split('T')[1].split('.')[0] + 'Z',
        'cbc:DueDate': invoice.dueDate
          ? invoice.dueDate.toISOString().split('T')[0]
          : undefined,
        'cbc:InvoiceTypeCode': '380',
        'cbc:DocumentCurrencyCode': invoice.currency,

        // Supplier Party
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              $: { schemeID: invoice.supplier.participantId.scheme },
              _: invoice.supplier.participantId.identifier,
            },
            'cac:PartyIdentification': [
              {
                'cbc:ID': {
                  $: { schemeID: '0183' },
                  _: invoice.supplier.corporateNumber,
                },
              },
              invoice.supplier.invoiceRegistryNumber
                ? {
                    'cbc:ID': {
                      $: { schemeID: 'JP:IVR' },
                      _: invoice.supplier.invoiceRegistryNumber,
                    },
                  }
                : undefined,
            ].filter(Boolean),
            'cac:PartyName': {
              'cbc:Name': invoice.supplier.name,
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.supplier.registeredName,
              'cbc:CompanyID': {
                $: { schemeID: '0183' },
                _: invoice.supplier.corporateNumber,
              },
            },
            'cac:PostalAddress': this.mapAddressToUBL(invoice.supplier.address),
            'cac:PartyTaxScheme': invoice.supplier.invoiceRegistryNumber
              ? {
                  'cbc:CompanyID': invoice.supplier.invoiceRegistryNumber,
                  'cac:TaxScheme': {
                    'cbc:ID': 'VAT',
                  },
                }
              : undefined,
            'cac:Contact': invoice.supplier.contact
              ? {
                  'cbc:Name': invoice.supplier.contact.name,
                  'cbc:Telephone': invoice.supplier.contact.telephone,
                  'cbc:ElectronicMail': invoice.supplier.contact.email,
                }
              : undefined,
          },
        },

        // Customer Party
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              $: { schemeID: invoice.customer.participantId.scheme },
              _: invoice.customer.participantId.identifier,
            },
            'cac:PartyIdentification': [
              {
                'cbc:ID': {
                  $: { schemeID: '0183' },
                  _: invoice.customer.corporateNumber,
                },
              },
              invoice.customer.invoiceRegistryNumber
                ? {
                    'cbc:ID': {
                      $: { schemeID: 'JP:IVR' },
                      _: invoice.customer.invoiceRegistryNumber,
                    },
                  }
                : undefined,
            ].filter(Boolean),
            'cac:PartyName': {
              'cbc:Name': invoice.customer.name,
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.customer.registeredName,
              'cbc:CompanyID': {
                $: { schemeID: '0183' },
                _: invoice.customer.corporateNumber,
              },
            },
            'cac:PostalAddress': this.mapAddressToUBL(invoice.customer.address),
            'cac:PartyTaxScheme': invoice.customer.invoiceRegistryNumber
              ? {
                  'cbc:CompanyID': invoice.customer.invoiceRegistryNumber,
                  'cac:TaxScheme': {
                    'cbc:ID': 'VAT',
                  },
                }
              : undefined,
            'cac:Contact': invoice.customer.contact
              ? {
                  'cbc:Name': invoice.customer.contact.name,
                  'cbc:Telephone': invoice.customer.contact.telephone,
                  'cbc:ElectronicMail': invoice.customer.contact.email,
                }
              : undefined,
          },
        },

        // Payment Means
        'cac:PaymentMeans': invoice.paymentMeans
          ? {
              'cbc:PaymentMeansCode': invoice.paymentMeans.paymentMeansCode,
              'cbc:PaymentID': invoice.paymentMeans.paymentId,
              'cac:PayeeFinancialAccount': invoice.paymentMeans.iban
                ? {
                    'cbc:ID': invoice.paymentMeans.iban,
                    'cbc:Name': invoice.paymentMeans.accountName,
                    'cac:FinancialInstitutionBranch': {
                      'cbc:ID': invoice.paymentMeans.bic,
                    },
                  }
                : undefined,
            }
          : undefined,

        // Tax Total with breakdown
        'cac:TaxTotal': [
          {
            'cbc:TaxAmount': {
              $: { currencyID: invoice.currency },
              _: invoice.taxTotal.toFixed(0), // JPY has no decimals
            },
            'cac:TaxSubtotal': invoice.taxBreakdown.map((breakdown) => ({
              'cbc:TaxableAmount': {
                $: { currencyID: invoice.currency },
                _: breakdown.taxableAmount.toFixed(0),
              },
              'cbc:TaxAmount': {
                $: { currencyID: invoice.currency },
                _: breakdown.taxAmount.toFixed(0),
              },
              'cac:TaxCategory': {
                'cbc:ID': breakdown.category,
                'cbc:Percent': breakdown.rate.toFixed(1),
                'cac:TaxScheme': {
                  'cbc:ID': 'VAT',
                },
              },
            })),
          },
        ],

        // Monetary Totals
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            $: { currencyID: invoice.currency },
            _: (invoice.totalAmount - invoice.taxTotal).toFixed(0),
          },
          'cbc:TaxExclusiveAmount': {
            $: { currencyID: invoice.currency },
            _: (invoice.totalAmount - invoice.taxTotal).toFixed(0),
          },
          'cbc:TaxInclusiveAmount': {
            $: { currencyID: invoice.currency },
            _: invoice.totalAmount.toFixed(0),
          },
          'cbc:PayableAmount': {
            $: { currencyID: invoice.currency },
            _: invoice.totalAmount.toFixed(0),
          },
        },

        // Invoice Lines
        'cac:InvoiceLine': invoice.lines.map((line) => ({
          'cbc:ID': line.id,
          'cbc:InvoicedQuantity': {
            $: { unitCode: line.unitCode },
            _: line.quantity,
          },
          'cbc:LineExtensionAmount': {
            $: { currencyID: invoice.currency },
            _: line.lineExtensionAmount.toFixed(0),
          },
          'cac:Item': {
            'cbc:Description': line.description,
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': line.taxCategory || JP_TAX_CATEGORIES.STANDARD,
              'cbc:Percent': line.taxPercent.toFixed(1),
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              $: { currencyID: invoice.currency },
              _: line.priceAmount.toFixed(0),
            },
          },
        })),
      },
    };

    const xml = this.xmlBuilder.buildObject(ublInvoice);
    return xml;
  }

  /**
   * Map Japanese address to UBL format
   */
  private mapAddressToUBL(address: any): any {
    return {
      'cbc:StreetName': address.addressLine1,
      'cbc:AdditionalStreetName': address.addressLine2,
      'cbc:CityName': address.city,
      'cbc:PostalZone': this.validator.formatPostalCode(address.postalCode),
      'cbc:CountrySubentity': address.prefecture,
      'cac:Country': {
        'cbc:IdentificationCode': JP_COUNTRY_CODE,
      },
    };
  }

  /**
   * Format amount for JPY (no decimals)
   */
  private formatJPYAmount(amount: number): string {
    return Math.round(amount).toString();
  }

  /**
   * Calculate tax breakdown from invoice lines
   */
  calculateTaxBreakdown(
    lines: Array<{
      taxCategory?: string;
      taxPercent: number;
      lineExtensionAmount: number;
      taxAmount: number;
    }>,
  ): JapaneseTaxInfo[] {
    const breakdown = new Map<string, JapaneseTaxInfo>();

    lines.forEach((line) => {
      const category = line.taxCategory || JP_TAX_CATEGORIES.STANDARD;
      const key = `${category}-${line.taxPercent}`;

      if (breakdown.has(key)) {
        const existing = breakdown.get(key)!;
        existing.baseAmount += line.lineExtensionAmount;
        existing.amount += line.taxAmount;
      } else {
        breakdown.set(key, {
          category: category as any,
          rate: line.taxPercent,
          amount: line.taxAmount,
          baseAmount: line.lineExtensionAmount,
        });
      }
    });

    return Array.from(breakdown.values());
  }
}
