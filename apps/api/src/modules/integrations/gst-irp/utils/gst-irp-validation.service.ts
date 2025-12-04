/**
 * GST IRP Validation Service
 *
 * Validates e-invoice data according to GST specifications
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IrpEInvoiceRequest,
  ValidationResult,
  GstInvoiceType,
  SupplyType,
} from '../gst-irp.types';
import {
  VALIDATION_PATTERNS,
  GST_STATE_CODES,
  GST_RATES,
  INVOICE_LIMITS,
  ERROR_MESSAGES,
} from '../gst-irp.constants';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

@Injectable()
export class GstIrpValidationService {
  private readonly logger = new Logger(GstIrpValidationService.name);

  /**
   * Validate complete e-invoice
   */
  validateInvoice(invoice: IrpEInvoiceRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate transaction details
    errors.push(...this.validateTransactionDetails(invoice.tranDtls, invoice));

    // Validate document details
    errors.push(...this.validateDocumentDetails(invoice.docDtls));

    // Validate seller details
    errors.push(...this.validatePartyDetails(invoice.sellerDtls, 'sellerDtls'));

    // Validate buyer details
    errors.push(...this.validatePartyDetails(invoice.buyerDtls, 'buyerDtls'));

    // Validate items
    errors.push(...this.validateItemList(invoice.itemList));

    // Validate value details
    errors.push(...this.validateValueDetails(invoice.valDtls, invoice.itemList));

    // Validate export details if export invoice
    if (
      invoice.tranDtls.supTyp === SupplyType.EXPWP ||
      invoice.tranDtls.supTyp === SupplyType.EXPWOP
    ) {
      if (!invoice.expDtls) {
        errors.push({
          field: 'expDtls',
          message: 'Export details required for export invoices',
          code: 'MISSING_EXPORT_DETAILS',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate transaction details
   */
  private validateTransactionDetails(
    tranDtls: IrpEInvoiceRequest['tranDtls'],
    invoice: IrpEInvoiceRequest,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (tranDtls.taxSch !== 'GST') {
      errors.push({
        field: 'tranDtls.taxSch',
        message: 'Tax scheme must be GST',
        code: 'INVALID_TAX_SCHEME',
      });
    }

    if (!Object.values(SupplyType).includes(tranDtls.supTyp)) {
      errors.push({
        field: 'tranDtls.supTyp',
        message: 'Invalid supply type',
        code: 'INVALID_SUPPLY_TYPE',
      });
    }

    // Validate IGST on intra-state
    if (tranDtls.igstOnIntra === 'Y') {
      const sellerState = invoice.sellerDtls.gstin.substring(0, 2);
      const buyerState = invoice.buyerDtls.gstin.substring(0, 2);
      if (sellerState !== buyerState) {
        errors.push({
          field: 'tranDtls.igstOnIntra',
          message: 'IGST on intra cannot be Y for inter-state supply',
          code: 'INVALID_IGST_INTRA',
        });
      }
    }

    return errors;
  }

  /**
   * Validate document details
   */
  private validateDocumentDetails(docDtls: IrpEInvoiceRequest['docDtls']): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Object.values(GstInvoiceType).includes(docDtls.typ)) {
      errors.push({
        field: 'docDtls.typ',
        message: 'Invalid document type',
        code: 'INVALID_DOC_TYPE',
      });
    }

    if (!VALIDATION_PATTERNS.DOCUMENT_NUMBER.test(docDtls.no)) {
      errors.push({
        field: 'docDtls.no',
        message: ERROR_MESSAGES.INVALID_DOCUMENT_NUMBER,
        code: 'INVALID_DOC_NUMBER',
      });
    }

    // Validate date format (DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(docDtls.dt)) {
      errors.push({
        field: 'docDtls.dt',
        message: ERROR_MESSAGES.INVALID_DATE_FORMAT,
        code: 'INVALID_DATE_FORMAT',
      });
    } else {
      // Validate date is valid
      const [day, month, year] = docDtls.dt.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (
        date.getDate() !== day ||
        date.getMonth() !== month - 1 ||
        date.getFullYear() !== year
      ) {
        errors.push({
          field: 'docDtls.dt',
          message: 'Invalid date',
          code: 'INVALID_DATE',
        });
      }
    }

    return errors;
  }

  /**
   * Validate party details (seller/buyer)
   */
  private validatePartyDetails(
    party: IrpEInvoiceRequest['sellerDtls'],
    fieldPrefix: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate GSTIN
    if (!this.validateGstin(party.gstin)) {
      errors.push({
        field: `${fieldPrefix}.gstin`,
        message: ERROR_MESSAGES.INVALID_GSTIN,
        code: 'INVALID_GSTIN',
      });
    }

    // Validate legal name
    if (!party.legalName || party.legalName.length === 0) {
      errors.push({
        field: `${fieldPrefix}.legalName`,
        message: 'Legal name is required',
        code: 'MISSING_LEGAL_NAME',
      });
    }

    // Validate address
    if (!party.address) {
      errors.push({
        field: `${fieldPrefix}.address`,
        message: 'Address is required',
        code: 'MISSING_ADDRESS',
      });
    } else {
      // Validate pincode
      if (!VALIDATION_PATTERNS.PINCODE.test(party.address.pincode)) {
        errors.push({
          field: `${fieldPrefix}.address.pincode`,
          message: 'Invalid pincode format',
          code: 'INVALID_PINCODE',
        });
      }

      // Validate state code
      if (!Object.keys(GST_STATE_CODES).includes(party.address.stateCode)) {
        errors.push({
          field: `${fieldPrefix}.address.stateCode`,
          message: 'Invalid state code',
          code: 'INVALID_STATE_CODE',
        });
      }

      // Validate state code matches GSTIN
      const gstinState = party.gstin.substring(0, 2);
      if (gstinState !== party.address.stateCode) {
        errors.push({
          field: `${fieldPrefix}.address.stateCode`,
          message: 'State code must match GSTIN state code',
          code: 'STATE_CODE_MISMATCH',
        });
      }
    }

    // Validate contact details if provided
    if (party.contact) {
      if (party.contact.email && !VALIDATION_PATTERNS.EMAIL.test(party.contact.email)) {
        errors.push({
          field: `${fieldPrefix}.contact.email`,
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
        });
      }

      if (party.contact.phone && !VALIDATION_PATTERNS.PHONE.test(party.contact.phone)) {
        errors.push({
          field: `${fieldPrefix}.contact.phone`,
          message: 'Invalid phone format',
          code: 'INVALID_PHONE',
        });
      }
    }

    return errors;
  }

  /**
   * Validate item list
   */
  private validateItemList(items: IrpEInvoiceRequest['itemList']): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!items || items.length === 0) {
      errors.push({
        field: 'itemList',
        message: 'At least one item is required',
        code: 'EMPTY_ITEM_LIST',
      });
      return errors;
    }

    if (items.length > INVOICE_LIMITS.MAX_ITEMS) {
      errors.push({
        field: 'itemList',
        message: `Maximum ${INVOICE_LIMITS.MAX_ITEMS} items allowed`,
        code: 'TOO_MANY_ITEMS',
      });
    }

    items.forEach((item, index) => {
      const prefix = `itemList[${index}]`;

      // Validate HSN code
      if (!VALIDATION_PATTERNS.HSN_CODE.test(item.hsnCode)) {
        errors.push({
          field: `${prefix}.hsnCode`,
          message: ERROR_MESSAGES.INVALID_HSN_CODE,
          code: 'INVALID_HSN_CODE',
        });
      }

      // Validate GST rate
      if (!GST_RATES.includes(item.gstRate)) {
        errors.push({
          field: `${prefix}.gstRate`,
          message: 'Invalid GST rate',
          code: 'INVALID_GST_RATE',
        });
      }

      // Validate quantities
      if (item.quantity <= 0) {
        errors.push({
          field: `${prefix}.quantity`,
          message: 'Quantity must be greater than 0',
          code: 'INVALID_QUANTITY',
        });
      }

      // Validate amounts
      if (item.totItemValue <= 0) {
        errors.push({
          field: `${prefix}.totItemValue`,
          message: 'Total item value must be greater than 0',
          code: 'INVALID_AMOUNT',
        });
      }

      // Validate calculation
      const calculatedTax =
        (item.igstAmount || 0) +
        (item.cgstAmount || 0) +
        (item.sgstAmount || 0) +
        (item.cessAmount || 0);
      const expectedTotal = item.assAmount + calculatedTax;
      const tolerance = 0.01; // Allow 1 paisa tolerance for rounding

      if (Math.abs(expectedTotal - item.totItemValue) > tolerance) {
        errors.push({
          field: `${prefix}.totItemValue`,
          message: 'Item value calculation mismatch',
          code: 'CALCULATION_ERROR',
        });
      }
    });

    return errors;
  }

  /**
   * Validate value details
   */
  private validateValueDetails(
    valDtls: IrpEInvoiceRequest['valDtls'],
    items: IrpEInvoiceRequest['itemList'],
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate total invoice value
    if (
      valDtls.totInvVal < INVOICE_LIMITS.MIN_VALUE ||
      valDtls.totInvVal > INVOICE_LIMITS.MAX_VALUE
    ) {
      errors.push({
        field: 'valDtls.totInvVal',
        message: `Invoice value must be between ${INVOICE_LIMITS.MIN_VALUE} and ${INVOICE_LIMITS.MAX_VALUE}`,
        code: 'INVALID_INVOICE_VALUE',
      });
    }

    // Validate sum of items matches total
    const itemsTotal = items.reduce((sum, item) => sum + item.totItemValue, 0);
    const calculatedTotal =
      itemsTotal + (valDtls.otherCharge || 0) + (valDtls.roundOff || 0) - (valDtls.discount || 0);
    const tolerance = 0.01;

    if (Math.abs(calculatedTotal - valDtls.totInvVal) > tolerance) {
      errors.push({
        field: 'valDtls.totInvVal',
        message: 'Total invoice value does not match sum of items',
        code: 'TOTAL_MISMATCH',
      });
    }

    // Validate assessable value
    const itemsAssVal = items.reduce((sum, item) => sum + item.assAmount, 0);
    if (Math.abs(itemsAssVal - valDtls.assVal) > tolerance) {
      errors.push({
        field: 'valDtls.assVal',
        message: 'Assessable value does not match sum of items',
        code: 'ASSVAL_MISMATCH',
      });
    }

    return errors;
  }

  /**
   * Validate GSTIN format and checksum
   */
  validateGstin(gstin: string): boolean {
    if (!VALIDATION_PATTERNS.GSTIN.test(gstin)) {
      return false;
    }

    // Validate state code
    const stateCode = gstin.substring(0, 2);
    if (!Object.keys(GST_STATE_CODES).includes(stateCode)) {
      return false;
    }

    // Validate PAN in GSTIN
    const pan = gstin.substring(2, 12);
    if (!VALIDATION_PATTERNS.PAN.test(pan)) {
      return false;
    }

    // TODO: Implement checksum validation
    // The 15th character is a checksum calculated using specific algorithm

    return true;
  }

  /**
   * Validate IRN format
   */
  validateIrn(irn: string): boolean {
    return VALIDATION_PATTERNS.IRN.test(irn);
  }

  /**
   * Validate date format and range
   */
  validateDate(dateString: string): boolean {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return false;
    }

    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    // Check if date is valid
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return false;
    }

    // Check if date is not in future
    if (date > new Date()) {
      return false;
    }

    return true;
  }
}
