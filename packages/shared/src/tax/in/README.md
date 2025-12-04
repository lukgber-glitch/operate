# India GST Configuration

Comprehensive India Goods and Services Tax (GST) configuration for the Operate/CoachOS platform.

## Overview

This module provides complete GST tax configuration for India, including:

- **GST Rate Slabs**: 0%, 5%, 12%, 18%, 28%
- **Tax Components**: CGST, SGST, UTGST, IGST
- **All States & UTs**: 28 states + 8 Union Territories
- **GSTIN Validation**: Complete validation with checksum
- **HSN/SAC Codes**: Support for goods and services codes
- **E-Invoicing**: IRP integration specifications
- **E-Way Bill**: Electronic waybill requirements

## GST Structure

### Intra-State Transactions
- **Components**: CGST + SGST (or UTGST for Union Territories)
- **Rate Split**: Equally divided (e.g., 18% = 9% CGST + 9% SGST)
- **Example**: Delhi to Delhi → CGST 9% + SGST 9% = 18%

### Inter-State Transactions
- **Components**: IGST (Integrated GST)
- **Rate**: Full rate (e.g., 18% IGST)
- **Example**: Delhi to Mumbai → IGST 18%

## Files

### Core Configuration
- `gst-rates.config.ts` (764 lines) - GST rates, categories, rules, and regulations
- `in-states.config.ts` (712 lines) - All 36 states and UTs with GST codes
- `gstin.validator.ts` (494 lines) - GSTIN, PAN, HSN/SAC validators
- `index.ts` (62 lines) - Exports and convenience re-exports

### Database
- `../../database/prisma/seed/india-tax-seed.ts` (431 lines) - Prisma seed data

### Tests
- `tests/india-gst.spec.ts` (411 lines) - Comprehensive unit tests

**Total**: 2,874 lines of code

## Usage

### Import Configuration

```typescript
import {
  INDIA_GST_RATES,
  INDIA_GST_RATE_BREAKDOWN,
  INDIA_STATES,
  INDIA_STATE_LOOKUP,
  GSTINValidator,
  GSTTransactionTypeValidator,
} from '@operate/shared/tax/in';
```

### Validate GSTIN

```typescript
import { GSTINValidator } from '@operate/shared/tax/in';

const result = GSTINValidator.validate('27AAPFU0939F1ZV');

if (result.isValid) {
  console.log('Valid GSTIN');
  console.log('State:', result.details.stateName);
  console.log('PAN:', result.details.pan);
} else {
  console.error('Invalid GSTIN:', result.error);
}
```

### Determine Transaction Type

```typescript
import { GSTTransactionTypeValidator } from '@operate/shared/tax/in';

const supplierGSTIN = '27AAPFU0939F1ZV'; // Maharashtra
const recipientGSTIN = '29BBBFU0939F1ZA'; // Karnataka

const txnType = GSTTransactionTypeValidator.determineTransactionType(
  supplierGSTIN,
  recipientGSTIN
);

console.log('Transaction Type:', txnType.type); // INTER_STATE
console.log('Tax Components:', txnType.taxComponents); // ['IGST']
```

### Calculate GST Components

```typescript
import { GSTTransactionTypeValidator } from '@operate/shared/tax/in';

// For 18% GST on intra-state transaction
const components = GSTTransactionTypeValidator.calculateGSTComponents(
  18,
  'INTRA_STATE'
);

console.log('CGST:', components.cgst); // 9
console.log('SGST:', components.sgst); // 9
```

### Lookup State Information

```typescript
import { INDIA_STATE_LOOKUP } from '@operate/shared/tax/in';

// By code
const state = INDIA_STATE_LOOKUP.byCode('27');
console.log(state.name); // Maharashtra
console.log(state.capital); // Mumbai

// By name
const karnataka = INDIA_STATE_LOOKUP.byName('Karnataka');
console.log(karnataka.code); // 29

// Get all special category states
const specialStates = INDIA_STATE_LOOKUP.getSpecialCategory();
console.log(specialStates.length); // 10
```

### Validate HSN/SAC Codes

```typescript
import { HSNSACValidator } from '@operate/shared/tax/in';

// Validate HSN (goods)
const hsnResult = HSNSACValidator.validateHSN('8471');
console.log('Valid HSN:', hsnResult.isValid); // true

// Validate SAC (services)
const sacResult = HSNSACValidator.validateSAC('995411');
console.log('Valid SAC:', sacResult.isValid); // true

// Check if HSN required based on turnover
const requirement = HSNSACValidator.isHSNRequired(60_000_000); // ₹6 crore
console.log('HSN Required:', requirement.required); // true
console.log('Digits:', requirement.digits); // 6
```

## GST Rate Reference

### 0% (Nil-rated)
- Fresh vegetables, fruits, milk, eggs
- Grains, salt, bread
- Unpacked food items

### 5%
- Edible oils, sugar, tea, coffee
- Medicines and life-saving drugs
- Transport services (economy)
- Footwear under ₹500

### 12%
- Butter, ghee, frozen meat
- Computers, processed food
- Ayurvedic medicines

### 18%
- Hair oil, toothpaste, soap
- IT services, telecom services
- Restaurants with AC
- Capital goods

### 28% (+ Cess)
- Luxury cars, motorcycles
- Air conditioners, refrigerators
- Cigarettes, tobacco products
- Aerated beverages

## Registration Thresholds

### Regular Businesses
- **Goods**: ₹40 lakhs (₹20 lakhs for special category states)
- **Services**: ₹20 lakhs (₹10 lakhs for special category states)

### Composition Scheme
- **Threshold**: ₹1.5 crore annual turnover
- **Rates**: 1% (manufacturers/traders), 5% (restaurants), 6% (services)
- **Restrictions**: No inter-state supplies, no ITC, quarterly filing

## Special Category States

Lower registration thresholds (₹20L goods / ₹10L services):
- Arunachal Pradesh, Assam, Manipur, Meghalaya
- Mizoram, Nagaland, Sikkim, Tripura
- Himachal Pradesh, Uttarakhand

## E-Invoicing

### Requirements
- **Mandatory**: Turnover above ₹10 lakhs (as of April 2025)
- **Format**: JSON (GSTN specifications)
- **System**: Invoice Registration Portal (IRP)
- **Features**: IRN generation, QR code mandatory

### Implementation Phases
1. Oct 2020: ₹500 crore+
2. Jan 2021: ₹100 crore+
3. Apr 2021: ₹50 crore+
4. Oct 2021: ₹20 crore+
5. Apr 2022: ₹10 crore+
6. Oct 2022: ₹5 crore+
7. May 2023: ₹1 crore+
8. Apr 2024: ₹50 lakhs+
9. Apr 2025: ₹10 lakhs+

## E-Way Bill

### Requirements
- **Threshold**: ₹50,000 (goods movement)
- **Validity**: 1 day (up to 100km) to 15 days (1000km+)
- **Parts**: Part A (goods details), Part B (vehicle details)

## GST Returns

### Monthly Returns
- **GSTR-1**: Outward supplies (11th of next month)
- **GSTR-3B**: Summary return with payment (20th of next month)

### Quarterly Returns
- **GSTR-4**: Composition scheme (18th after quarter)

### Annual Returns
- **GSTR-9**: Annual return (31st Dec of next FY)
- **GSTR-9C**: Reconciliation (turnover > ₹5 crore, CA certified)

## Testing

Run tests:
```bash
npm test -- india-gst.spec.ts
```

Test coverage includes:
- GST rate validation
- State/UT configuration
- GSTIN validation and checksum
- PAN validation
- Transaction type determination
- HSN/SAC code validation
- Place of supply rules
- E-invoicing and E-way bill

## Database Seeding

Seed India GST configuration:
```bash
npx ts-node packages/database/prisma/seed/india-tax-seed.ts
```

This will create:
- India country entry
- 28 states + 8 UTs
- GST rates for all states (CGST, SGST/UTGST, IGST)
- Tax configuration
- Country features (e-invoicing, e-way bill, etc.)

## References

- **GST Portal**: https://www.gst.gov.in
- **CBIC**: https://www.cbic.gov.in
- **Legal Basis**: Central Goods and Services Tax Act, 2017
- **E-Invoicing**: Invoice Registration Portal (IRP)
- **E-Way Bill**: https://ewaybillgst.gov.in

## Task Information

- **Task ID**: W29-T4
- **Priority**: P0
- **Effort**: 2d
- **Status**: Completed
- **Files Created**: 6 files (2,874 lines)

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
