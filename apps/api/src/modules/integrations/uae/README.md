# UAE E-invoicing Integration

Federal Tax Authority (FTA) e-invoicing integration for UAE VAT compliance.

## Overview

This module provides complete integration with the UAE Federal Tax Authority (FTA) for electronic invoicing and VAT reporting. It supports:

- **UBL 2.1 XML invoice generation** (Peppol BIS 3.0 compliant)
- **FTA API submission** with OAuth2 authentication
- **VAT calculation** (5% standard rate)
- **TRN validation** (Tax Registration Number)
- **Invoice status tracking**
- **Tourist VAT refund** calculations
- **Reverse charge mechanism**
- **Multi-currency support**

## Features

### Invoice Types
- Standard Invoice (380)
- Credit Note (381)
- Debit Note (383)
- Tax Invoice (388)
- Self-billed Invoice (389)

### VAT Rates
- **Standard Rate**: 5%
- **Zero-rated**: 0% (exports, international transport)
- **Exempt**: Financial services, local transport
- **Out of scope**: Non-UAE supplies

### Compliance
- UBL 2.1 XML format
- Peppol BIS 3.0 standard
- FTA Mandatory Accredited Format (MAF)
- 5-year invoice retention
- GCC compliance

## Installation

```bash
npm install xmlbuilder2 @nestjs/axios
```

## Configuration

Add to your `.env` file:

```env
# UAE FTA Configuration
UAE_FTA_ENVIRONMENT=sandbox # or production
UAE_FTA_CLIENT_ID=your_client_id
UAE_FTA_CLIENT_SECRET=your_client_secret
UAE_FTA_TRN=100XXXXXXXXXXXX
UAE_FTA_COMPANY_NAME=Your Company LLC

# Optional
UAE_FTA_ENABLE_RETRY=true
UAE_FTA_MAX_RETRIES=3
UAE_FTA_TIMEOUT=30000
```

## Usage

### Import Module

```typescript
import { UAEModule } from './modules/integrations/uae';

@Module({
  imports: [UAEModule],
})
export class AppModule {}
```

### Submit Invoice

```typescript
import { UAEService } from './modules/integrations/uae';

@Injectable()
export class InvoiceService {
  constructor(private readonly uaeService: UAEService) {}

  async submitInvoice() {
    const invoiceData: UAEInvoiceData = {
      invoiceNumber: 'INV-2024-001',
      invoiceType: UAEInvoiceType.INVOICE,
      issueDate: new Date(),
      dueDate: new Date('2024-02-15'),
      supplier: {
        trn: '100123456789012',
        legalName: 'My Company LLC',
        address: {
          streetName: 'Sheikh Zayed Road',
          cityName: 'Dubai',
          emirate: 'Dubai',
          country: 'AE',
        },
        vatRegistered: true,
      },
      customer: {
        legalName: 'Customer LLC',
        address: {
          streetName: 'Al Maktoum Road',
          cityName: 'Dubai',
          emirate: 'Dubai',
          country: 'AE',
        },
        vatRegistered: false,
      },
      lineItems: [
        {
          id: '1',
          description: 'Professional Services',
          quantity: 10,
          unitCode: 'C62',
          unitPrice: 100,
          lineExtensionAmount: 1000,
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxAmount: 50,
        },
      ],
      totals: {
        currency: 'AED',
        lineExtensionAmount: 1000,
        taxExclusiveAmount: 1000,
        taxBreakdown: [
          {
            taxCategory: UAEVATRateCode.STANDARD,
            taxRate: 0.05,
            taxableAmount: 1000,
            taxAmount: 50,
          },
        ],
        taxTotalAmount: 50,
        taxInclusiveAmount: 1050,
        payableAmount: 1050,
      },
    };

    const result = await this.uaeService.submitInvoice(invoiceData);

    if (result.success) {
      console.log('Invoice submitted:', result.submissionId);
    } else {
      console.error('Validation errors:', result.validationErrors);
    }
  }
}
```

### Validate TRN

```typescript
const validation = await uaeService.validateTRN('100123456789012', true);

if (validation.valid && validation.registered) {
  console.log('TRN is valid and registered');
  console.log('Company:', validation.companyName);
}
```

### Calculate VAT

```typescript
const vatCalculation = uaeService.calculateVAT(invoiceData);

console.log('Tax Exclusive:', vatCalculation.taxExclusiveAmount);
console.log('VAT Amount:', vatCalculation.taxTotalAmount);
console.log('Tax Inclusive:', vatCalculation.taxInclusiveAmount);
```

### Calculate Tourist Refund

```typescript
const refund = uaeService.calculateTouristRefund(300, 15);

if (refund) {
  console.log('Net Refund:', refund.netRefund);
  console.log('Processing Fee:', refund.processingFee);
}
```

### Get Invoice Status

```typescript
const status = await uaeService.getInvoiceStatus(submissionId);

console.log('Status:', status.status);
console.log('Clearance:', status.clearanceStatus);
```

## API Reference

### UAEService

Main service orchestrating UAE operations.

#### Methods

- `submitInvoice(invoiceData, options?)`: Submit invoice to FTA
- `validateInvoice(invoiceData)`: Validate without submitting
- `getInvoiceStatus(submissionId)`: Get submission status
- `cancelInvoice(submissionId, reason)`: Cancel invoice
- `validateTRN(trn, checkWithFTA?)`: Validate TRN
- `calculateVAT(invoiceData)`: Calculate VAT
- `submitBatch(invoices, options?)`: Submit batch of invoices
- `calculateVATReturn(startDate, endDate, filingPeriod, invoices)`: Calculate VAT return
- `generateInvoicePreview(invoiceData)`: Generate XML preview
- `formatTRN(trn)`: Format TRN with dashes
- `calculateTouristRefund(amount, vat)`: Calculate tourist refund
- `calculateReverseChargeVAT(amount)`: Calculate reverse charge
- `getRateLimitStatus()`: Get rate limit status

### UAEInvoiceService

UBL 2.1 XML invoice generation.

#### Methods

- `generateInvoiceXML(invoiceData)`: Generate UBL XML

### UAETaxService

VAT calculation and tax logic.

#### Methods

- `calculateVAT(lineItems, currency, allowances?, charges?)`: Calculate VAT
- `calculateLineItemTax(amount, category, rate)`: Calculate line tax
- `getVATRate(category)`: Get VAT rate for category
- `isZeroRated(category)`: Check if zero-rated
- `isExempt(category)`: Check if exempt
- `isReverseCharge(scenario)`: Check reverse charge
- `calculateTouristRefund(amount, vat)`: Tourist refund
- `calculateReverseChargeVAT(amount)`: Reverse charge VAT
- `calculateInputVAT(purchases)`: Input VAT
- `calculateOutputVAT(sales)`: Output VAT
- `calculateNetVAT(outputVAT, inputVAT)`: Net VAT
- `convertTaxInclusiveToExclusive(amount, rate)`: Convert amounts
- `convertTaxExclusiveToInclusive(amount, rate)`: Convert amounts
- `calculateProportionalVAT(total, taxablePercent, rate)`: Mixed supplies

### UAEValidationService

Data validation and business rules.

#### Methods

- `validateTRN(trn)`: Validate TRN format
- `formatTRN(trn)`: Format TRN
- `validateEmiratesID(id)`: Validate Emirates ID
- `validateInvoiceData(invoice)`: Validate invoice
- `validateVATReturnPeriod(start, end, period)`: Validate period
- `isWithinRetentionPeriod(date)`: Check retention

### UAEFTAClientService

FTA API communication.

#### Methods

- `submitInvoice(document, options?)`: Submit to FTA
- `getInvoiceStatus(submissionId)`: Get status
- `cancelInvoice(submissionId, reason)`: Cancel
- `validateTRNWithFTA(trn)`: Validate with FTA
- `getRateLimitStatus()`: Rate limit info

## TRN Format

UAE Tax Registration Number (TRN):
- **Format**: 100-XXXX-XXXX-XXX-XXX
- **Length**: 15 digits
- **Prefix**: Always starts with "100"
- **Example**: 100-1234-5678-901-2

## VAT Filing

### Filing Periods
- **Quarterly**: Standard (taxable supplies/expenses < AED 150M)
- **Monthly**: Large businesses (> AED 150M)

### Filing Deadline
- 28 days after period end

### VAT Return Boxes
1. Output VAT (sales)
2. Input VAT (purchases)
3. Net VAT (Box 1 - Box 2)

## Error Codes

### Authentication (AUTH_XXX)
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions

### Validation (VAL_XXX)
- `VAL_001`: Invalid TRN format
- `VAL_002`: Invalid invoice format
- `VAL_003`: Invalid VAT calculation
- `VAL_004`: Missing required fields
- `VAL_005`: Invalid date format
- `VAL_006`: Invalid currency code
- `VAL_007`: Invalid amount

### Submission (SUB_XXX)
- `SUB_001`: Invoice already submitted
- `SUB_002`: Duplicate invoice number
- `SUB_003`: Invoice submission failed
- `SUB_004`: Rate limit exceeded

### Business Rules (BUS_XXX)
- `BUS_001`: TRN not registered
- `BUS_002`: TRN suspended
- `BUS_003`: Invalid supplier TRN
- `BUS_004`: Invalid buyer TRN
- `BUS_005`: VAT registration required

## Rate Limiting

FTA enforces the following limits:
- **100 requests/minute**
- **5,000 requests/hour**
- **50,000 requests/day**
- **10 concurrent requests**

The client automatically handles rate limiting with:
- Request queuing
- Automatic retries
- Exponential backoff

## Testing

```bash
# Run unit tests
npm run test uae

# Run with coverage
npm run test:cov uae
```

## Examples

See `__tests__/` directory for comprehensive examples.

## References

- [UAE FTA Portal](https://tax.gov.ae/)
- [UAE VAT Guide](https://www.mof.gov.ae/en/StrategicPartnerships/Pages/VAT.aspx)
- [UBL 2.1 Specification](https://docs.peppol.eu/poacc/billing/3.0/)
- [Peppol BIS 3.0](https://docs.peppol.eu/)

## Support

For FTA-specific issues:
- FTA Helpline: 600 599 994
- Email: vat@tax.gov.ae

## License

Copyright © 2024 Operate/CoachOS. All rights reserved.
