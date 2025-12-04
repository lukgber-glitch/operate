import { Injectable, Logger } from '@nestjs/common';
import * as builder from 'xmlbuilder2';
import { UAEInvoiceType, UBL_NAMESPACES } from './constants/uae.constants';
import {
  UAEInvoiceData,
  UBLInvoiceDocument,
  UAEInvoiceLineItem,
  UAEPartyInfo,
  UAEAddress,
} from './interfaces/uae.types';
import { UAETaxService } from './uae-tax.service';
import { UAEValidationService } from './uae-validation.service';

/**
 * UAE Invoice Service
 * Generates Peppol BIS 3.0 compliant UBL 2.1 XML invoices for UAE FTA
 */
@Injectable()
export class UAEInvoiceService {
  private readonly logger = new Logger(UAEInvoiceService.name);

  constructor(
    private readonly taxService: UAETaxService,
    private readonly validationService: UAEValidationService,
  ) {}

  /**
   * Generate UBL 2.1 XML invoice
   */
  async generateInvoiceXML(invoiceData: UAEInvoiceData): Promise<UBLInvoiceDocument> {
    this.logger.log(`Generating UBL invoice for ${invoiceData.invoiceNumber}`);

    // Validate invoice data
    const errors = this.validationService.validateInvoiceData(invoiceData);
    if (errors.length > 0) {
      throw new Error(`Invoice validation failed: ${errors.map((e) => e.message).join(', ')}`);
    }

    // Determine root element based on invoice type
    let rootElement: string;
    let namespace: string;

    switch (invoiceData.invoiceType) {
      case UAEInvoiceType.CREDIT_NOTE:
        rootElement = 'CreditNote';
        namespace = UBL_NAMESPACES.creditNote;
        break;
      case UAEInvoiceType.DEBIT_NOTE:
        rootElement = 'DebitNote';
        namespace = UBL_NAMESPACES.debitNote;
        break;
      default:
        rootElement = 'Invoice';
        namespace = UBL_NAMESPACES.invoice;
    }

    // Build XML document
    const doc = builder.create({ version: '1.0', encoding: 'UTF-8' });

    const root = doc.ele(namespace, rootElement);

    // Add namespaces
    root.att('xmlns:cac', UBL_NAMESPACES.cac);
    root.att('xmlns:cbc', UBL_NAMESPACES.cbc);

    // UBL Version
    root.ele(UBL_NAMESPACES.cbc, 'UBLVersionID').txt('2.1');
    root.ele(UBL_NAMESPACES.cbc, 'CustomizationID').txt('urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0');

    // Invoice identification
    root.ele(UBL_NAMESPACES.cbc, 'ID').txt(invoiceData.invoiceNumber);
    root.ele(UBL_NAMESPACES.cbc, 'IssueDate').txt(this.formatDate(invoiceData.issueDate));

    if (invoiceData.dueDate) {
      root.ele(UBL_NAMESPACES.cbc, 'DueDate').txt(this.formatDate(invoiceData.dueDate));
    }

    root.ele(UBL_NAMESPACES.cbc, 'InvoiceTypeCode').txt(invoiceData.invoiceType);

    // Notes
    if (invoiceData.notes && invoiceData.notes.length > 0) {
      invoiceData.notes.forEach((note) => {
        root.ele(UBL_NAMESPACES.cbc, 'Note').txt(note);
      });
    }

    // Document currency
    root.ele(UBL_NAMESPACES.cbc, 'DocumentCurrencyCode').txt(invoiceData.totals.currency);

    if (invoiceData.taxCurrency && invoiceData.taxCurrency !== invoiceData.totals.currency) {
      root.ele(UBL_NAMESPACES.cbc, 'TaxCurrencyCode').txt(invoiceData.taxCurrency);
    }

    // Document references
    if (invoiceData.orderReference) {
      const orderRef = root.ele(UBL_NAMESPACES.cac, 'OrderReference');
      orderRef.ele(UBL_NAMESPACES.cbc, 'ID').txt(invoiceData.orderReference);
    }

    if (invoiceData.originalInvoiceReference) {
      const billingRef = root.ele(UBL_NAMESPACES.cac, 'BillingReference');
      const invDocRef = billingRef.ele(UBL_NAMESPACES.cac, 'InvoiceDocumentReference');
      invDocRef.ele(UBL_NAMESPACES.cbc, 'ID').txt(invoiceData.originalInvoiceReference);
    }

    // Supplier party
    this.addParty(root, 'AccountingSupplierParty', invoiceData.supplier);

    // Customer party
    this.addParty(root, 'AccountingCustomerParty', invoiceData.customer);

    // Delivery
    if (invoiceData.delivery) {
      const delivery = root.ele(UBL_NAMESPACES.cac, 'Delivery');
      if (invoiceData.delivery.actualDeliveryDate) {
        delivery.ele(UBL_NAMESPACES.cbc, 'ActualDeliveryDate').txt(
          this.formatDate(invoiceData.delivery.actualDeliveryDate),
        );
      }
      if (invoiceData.delivery.deliveryLocation) {
        const location = delivery.ele(UBL_NAMESPACES.cac, 'DeliveryLocation');
        this.addAddress(location, invoiceData.delivery.deliveryLocation);
      }
    }

    // Payment means
    if (invoiceData.payment) {
      this.addPaymentMeans(root, invoiceData.payment);
    }

    // Allowances and charges
    if (invoiceData.totals.allowances) {
      invoiceData.totals.allowances.forEach((allowance) => {
        this.addAllowanceCharge(root, allowance);
      });
    }

    if (invoiceData.totals.charges) {
      invoiceData.totals.charges.forEach((charge) => {
        this.addAllowanceCharge(root, charge);
      });
    }

    // Tax total
    this.addTaxTotal(root, invoiceData);

    // Legal monetary total
    this.addLegalMonetaryTotal(root, invoiceData);

    // Invoice lines
    invoiceData.lineItems.forEach((lineItem, index) => {
      this.addInvoiceLine(root, lineItem, index + 1);
    });

    const xml = root.end({ prettyPrint: true });

    return {
      xml,
      hash: this.calculateHash(xml),
    };
  }

  /**
   * Add party information (supplier or customer)
   */
  private addParty(
    parent: any,
    elementName: string,
    party: UAEPartyInfo,
  ): void {
    const partyElement = parent.ele(UBL_NAMESPACES.cac, elementName);
    const partyNode = partyElement.ele(UBL_NAMESPACES.cac, 'Party');

    // Party identification (TRN)
    if (party.trn) {
      const partyId = partyNode.ele(UBL_NAMESPACES.cac, 'PartyIdentification');
      partyId.ele(UBL_NAMESPACES.cbc, 'ID').att('schemeID', 'TRN').txt(party.trn);
    }

    // Emirates ID
    if (party.emiratesId) {
      const partyId = partyNode.ele(UBL_NAMESPACES.cac, 'PartyIdentification');
      partyId.ele(UBL_NAMESPACES.cbc, 'ID').att('schemeID', 'EID').txt(party.emiratesId);
    }

    // Party name
    const partyName = partyNode.ele(UBL_NAMESPACES.cac, 'PartyName');
    partyName.ele(UBL_NAMESPACES.cbc, 'Name').txt(party.legalName);

    // Postal address
    this.addAddress(partyNode, party.address);

    // Party tax scheme
    if (party.vatRegistered && party.trn) {
      const partyTaxScheme = partyNode.ele(UBL_NAMESPACES.cac, 'PartyTaxScheme');
      partyTaxScheme.ele(UBL_NAMESPACES.cbc, 'CompanyID').txt(party.trn);
      const taxScheme = partyTaxScheme.ele(UBL_NAMESPACES.cac, 'TaxScheme');
      taxScheme.ele(UBL_NAMESPACES.cbc, 'ID').txt('VAT');
    }

    // Party legal entity
    const partyLegal = partyNode.ele(UBL_NAMESPACES.cac, 'PartyLegalEntity');
    partyLegal.ele(UBL_NAMESPACES.cbc, 'RegistrationName').txt(party.legalName);

    if (party.commercialRegistration) {
      partyLegal.ele(UBL_NAMESPACES.cbc, 'CompanyID').txt(party.commercialRegistration);
    }

    // Contact
    if (party.contactName || party.phone || party.email) {
      const contact = partyNode.ele(UBL_NAMESPACES.cac, 'Contact');
      if (party.contactName) {
        contact.ele(UBL_NAMESPACES.cbc, 'Name').txt(party.contactName);
      }
      if (party.phone) {
        contact.ele(UBL_NAMESPACES.cbc, 'Telephone').txt(party.phone);
      }
      if (party.email) {
        contact.ele(UBL_NAMESPACES.cbc, 'ElectronicMail').txt(party.email);
      }
    }
  }

  /**
   * Add address
   */
  private addAddress(parent: any, address: UAEAddress): void {
    const postalAddress = parent.ele(UBL_NAMESPACES.cac, 'PostalAddress');

    postalAddress.ele(UBL_NAMESPACES.cbc, 'StreetName').txt(address.streetName);

    if (address.additionalStreet) {
      postalAddress.ele(UBL_NAMESPACES.cbc, 'AdditionalStreetName').txt(address.additionalStreet);
    }

    if (address.buildingNumber) {
      postalAddress.ele(UBL_NAMESPACES.cbc, 'BuildingNumber').txt(address.buildingNumber);
    }

    postalAddress.ele(UBL_NAMESPACES.cbc, 'CityName').txt(address.cityName);

    if (address.postalZone) {
      postalAddress.ele(UBL_NAMESPACES.cbc, 'PostalZone').txt(address.postalZone);
    }

    if (address.emirate) {
      postalAddress.ele(UBL_NAMESPACES.cbc, 'CountrySubentity').txt(address.emirate);
    }

    const country = postalAddress.ele(UBL_NAMESPACES.cac, 'Country');
    country.ele(UBL_NAMESPACES.cbc, 'IdentificationCode').txt(address.country);
  }

  /**
   * Add payment means
   */
  private addPaymentMeans(parent: any, payment: any): void {
    const paymentMeans = parent.ele(UBL_NAMESPACES.cac, 'PaymentMeans');

    if (payment.paymentMeansCode) {
      paymentMeans.ele(UBL_NAMESPACES.cbc, 'PaymentMeansCode').txt(payment.paymentMeansCode);
    }

    if (payment.paymentId) {
      paymentMeans.ele(UBL_NAMESPACES.cbc, 'PaymentID').txt(payment.paymentId);
    }

    if (payment.payeeFinancialAccount) {
      const financialAccount = paymentMeans.ele(UBL_NAMESPACES.cac, 'PayeeFinancialAccount');
      financialAccount.ele(UBL_NAMESPACES.cbc, 'ID').txt(payment.payeeFinancialAccount.accountId);

      if (payment.payeeFinancialAccount.accountName) {
        financialAccount.ele(UBL_NAMESPACES.cbc, 'Name').txt(payment.payeeFinancialAccount.accountName);
      }

      if (payment.payeeFinancialAccount.financialInstitution) {
        const institution = financialAccount.ele(UBL_NAMESPACES.cac, 'FinancialInstitutionBranch');
        const financialInst = institution.ele(UBL_NAMESPACES.cac, 'FinancialInstitution');

        if (payment.payeeFinancialAccount.financialInstitution.bic) {
          financialInst.ele(UBL_NAMESPACES.cbc, 'ID').txt(payment.payeeFinancialAccount.financialInstitution.bic);
        }
      }
    }
  }

  /**
   * Add allowance or charge
   */
  private addAllowanceCharge(parent: any, item: any): void {
    const element = parent.ele(UBL_NAMESPACES.cac, 'AllowanceCharge');
    element.ele(UBL_NAMESPACES.cbc, 'ChargeIndicator').txt(item.type === 'CHARGE' ? 'true' : 'false');

    if (item.reasonCode) {
      element.ele(UBL_NAMESPACES.cbc, 'AllowanceChargeReasonCode').txt(item.reasonCode);
    }

    if (item.reason) {
      element.ele(UBL_NAMESPACES.cbc, 'AllowanceChargeReason').txt(item.reason);
    }

    if (item.percentage) {
      element.ele(UBL_NAMESPACES.cbc, 'MultiplierFactorNumeric').txt(item.percentage.toString());
    }

    element.ele(UBL_NAMESPACES.cbc, 'Amount')
      .att('currencyID', 'AED')
      .txt(item.amount.toFixed(2));

    if (item.baseAmount) {
      element.ele(UBL_NAMESPACES.cbc, 'BaseAmount')
        .att('currencyID', 'AED')
        .txt(item.baseAmount.toFixed(2));
    }
  }

  /**
   * Add tax total
   */
  private addTaxTotal(parent: any, invoiceData: UAEInvoiceData): void {
    const taxTotal = parent.ele(UBL_NAMESPACES.cac, 'TaxTotal');

    taxTotal.ele(UBL_NAMESPACES.cbc, 'TaxAmount')
      .att('currencyID', invoiceData.totals.currency)
      .txt(invoiceData.totals.taxTotalAmount.toFixed(2));

    // Tax subtotals by category
    invoiceData.totals.taxBreakdown.forEach((breakdown) => {
      const taxSubtotal = taxTotal.ele(UBL_NAMESPACES.cac, 'TaxSubtotal');

      taxSubtotal.ele(UBL_NAMESPACES.cbc, 'TaxableAmount')
        .att('currencyID', invoiceData.totals.currency)
        .txt(breakdown.taxableAmount.toFixed(2));

      taxSubtotal.ele(UBL_NAMESPACES.cbc, 'TaxAmount')
        .att('currencyID', invoiceData.totals.currency)
        .txt(breakdown.taxAmount.toFixed(2));

      const taxCategory = taxSubtotal.ele(UBL_NAMESPACES.cac, 'TaxCategory');
      taxCategory.ele(UBL_NAMESPACES.cbc, 'ID').txt(breakdown.taxCategory);
      taxCategory.ele(UBL_NAMESPACES.cbc, 'Percent').txt((breakdown.taxRate * 100).toFixed(2));

      const taxScheme = taxCategory.ele(UBL_NAMESPACES.cac, 'TaxScheme');
      taxScheme.ele(UBL_NAMESPACES.cbc, 'ID').txt('VAT');
    });
  }

  /**
   * Add legal monetary total
   */
  private addLegalMonetaryTotal(parent: any, invoiceData: UAEInvoiceData): void {
    const monetary = parent.ele(UBL_NAMESPACES.cac, 'LegalMonetaryTotal');
    const currency = invoiceData.totals.currency;

    monetary.ele(UBL_NAMESPACES.cbc, 'LineExtensionAmount')
      .att('currencyID', currency)
      .txt(invoiceData.totals.lineExtensionAmount.toFixed(2));

    monetary.ele(UBL_NAMESPACES.cbc, 'TaxExclusiveAmount')
      .att('currencyID', currency)
      .txt(invoiceData.totals.taxExclusiveAmount.toFixed(2));

    monetary.ele(UBL_NAMESPACES.cbc, 'TaxInclusiveAmount')
      .att('currencyID', currency)
      .txt(invoiceData.totals.taxInclusiveAmount.toFixed(2));

    if (invoiceData.totals.allowanceTotalAmount) {
      monetary.ele(UBL_NAMESPACES.cbc, 'AllowanceTotalAmount')
        .att('currencyID', currency)
        .txt(invoiceData.totals.allowanceTotalAmount.toFixed(2));
    }

    if (invoiceData.totals.chargeTotalAmount) {
      monetary.ele(UBL_NAMESPACES.cbc, 'ChargeTotalAmount')
        .att('currencyID', currency)
        .txt(invoiceData.totals.chargeTotalAmount.toFixed(2));
    }

    if (invoiceData.totals.prepaidAmount) {
      monetary.ele(UBL_NAMESPACES.cbc, 'PrepaidAmount')
        .att('currencyID', currency)
        .txt(invoiceData.totals.prepaidAmount.toFixed(2));
    }

    monetary.ele(UBL_NAMESPACES.cbc, 'PayableAmount')
      .att('currencyID', currency)
      .txt(invoiceData.totals.payableAmount.toFixed(2));
  }

  /**
   * Add invoice line
   */
  private addInvoiceLine(
    parent: any,
    lineItem: UAEInvoiceLineItem,
    lineNumber: number,
  ): void {
    const line = parent.ele(UBL_NAMESPACES.cac, 'InvoiceLine');

    line.ele(UBL_NAMESPACES.cbc, 'ID').txt(lineNumber.toString());

    line.ele(UBL_NAMESPACES.cbc, 'InvoicedQuantity')
      .att('unitCode', lineItem.unitCode)
      .txt(lineItem.quantity.toString());

    line.ele(UBL_NAMESPACES.cbc, 'LineExtensionAmount')
      .att('currencyID', 'AED')
      .txt(lineItem.lineExtensionAmount.toFixed(2));

    // Line item tax
    const taxTotal = line.ele(UBL_NAMESPACES.cac, 'TaxTotal');
    taxTotal.ele(UBL_NAMESPACES.cbc, 'TaxAmount')
      .att('currencyID', 'AED')
      .txt(lineItem.taxAmount.toFixed(2));

    // Item
    const item = line.ele(UBL_NAMESPACES.cac, 'Item');
    item.ele(UBL_NAMESPACES.cbc, 'Description').txt(lineItem.description);

    if (lineItem.sellersItemId) {
      const sellersId = item.ele(UBL_NAMESPACES.cac, 'SellersItemIdentification');
      sellersId.ele(UBL_NAMESPACES.cbc, 'ID').txt(lineItem.sellersItemId);
    }

    // Item tax category
    const classifiedTax = item.ele(UBL_NAMESPACES.cac, 'ClassifiedTaxCategory');
    classifiedTax.ele(UBL_NAMESPACES.cbc, 'ID').txt(lineItem.taxCategory);
    classifiedTax.ele(UBL_NAMESPACES.cbc, 'Percent').txt((lineItem.taxRate * 100).toFixed(2));

    const taxScheme = classifiedTax.ele(UBL_NAMESPACES.cac, 'TaxScheme');
    taxScheme.ele(UBL_NAMESPACES.cbc, 'ID').txt('VAT');

    // Price
    const price = line.ele(UBL_NAMESPACES.cac, 'Price');
    price.ele(UBL_NAMESPACES.cbc, 'PriceAmount')
      .att('currencyID', 'AED')
      .txt(lineItem.unitPrice.toFixed(2));
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Calculate hash of XML document (SHA-256)
   */
  private calculateHash(xml: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(xml).digest('hex');
  }
}
