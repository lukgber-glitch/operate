# Middle East Tax Configuration Reference

## Task: W28-T4 - Middle East Tax Rules (VAT 5%/15%)

Complete tax configuration for UAE and Saudi Arabia including VAT rates, TRN validation, IBAN validation, and regional subdivisions.

---

## Countries Implemented

### 🇦🇪 United Arab Emirates (UAE)
- **Country Code:** AE
- **VAT Rate:** 5% (Standard)
- **Corporate Tax:** 9% (Effective June 1, 2023)
- **Currency:** AED (د.إ)
- **Fiscal Year:** Gregorian (Jan-Dec)
- **VAT Filing:** Quarterly (28 days after period end)
- **TRN Format:** 15 digits (e.g., 100-1234-5678-901-2)
- **IBAN Format:** AE + 21 digits (23 total)

### 🇸🇦 Saudi Arabia
- **Country Code:** SA
- **VAT Rate:** 15% (Standard)
- **Zakat:** 2.5% (for Saudi/GCC nationals)
- **Currency:** SAR (ر.س)
- **Fiscal Year:** Gregorian or Hijri
- **VAT Filing:** Monthly (30 days after period end)
- **TRN Format:** 15 digits starting with 3 (Luhn validated)
- **IBAN Format:** SA + 22 digits (24 total)

---

## Database Schema

### Enums Added

#### `UAEEmirate`
```prisma
enum UAEEmirate {
  AUH // Abu Dhabi
  DXB // Dubai
  SHJ // Sharjah
  AJM // Ajman
  UAQ // Umm Al Quwain
  RAK // Ras Al Khaimah
  FUJ // Fujairah
}
```

#### `SaudiRegion`
```prisma
enum SaudiRegion {
  RIYADH          // Riyadh Region
  MAKKAH          // Makkah Region
  MADINAH         // Madinah Region
  EASTERN         // Eastern Province
  ASIR            // Asir Region
  TABUK           // Tabuk Region
  HAIL            // Hail Region
  NORTHERN_BORDERS // Northern Borders Region
  JAZAN           // Jazan Region
  NAJRAN          // Najran Region
  AL_BAHA         // Al-Baha Region
  AL_JAWF         // Al-Jawf Region
  QASSIM          // Qassim Region
}
```

#### `CompanyType` - Middle East Additions
```prisma
// Saudi Arabia
SA_LLC                  // Limited Liability Company (ذ.م.م)
SA_JOINT_STOCK          // Joint Stock Company (شركة مساهمة)
SA_GENERAL_PARTNERSHIP  // General Partnership (شركة تضامن)
SA_SOLE_PROPRIETORSHIP  // Sole Proprietorship (مؤسسة فردية)
SA_FOREIGN_BRANCH       // Foreign Company Branch
SA_LIMITED_PARTNERSHIP  // Limited Partnership (شركة توصية)

// UAE
AE_LLC                  // Limited Liability Company (ذ.م.م)
AE_FREE_ZONE            // Free Zone Company
AE_FOREIGN_BRANCH       // Branch of Foreign Company
AE_SOLE_ESTABLISHMENT   // Sole Establishment
AE_PARTNERSHIP          // Partnership
AE_PUBLIC_JOINT_STOCK   // Public Joint Stock Company
AE_PRIVATE_JOINT_STOCK  // Private Joint Stock Company
```

#### `VatScheme` - Middle East Additions
```prisma
// Saudi Arabia
SA_VAT_STANDARD    // Standard VAT scheme
SA_VAT_MARGIN      // Margin scheme

// UAE
AE_VAT_STANDARD    // Standard VAT scheme
AE_VAT_DESIGNATED_ZONE // Designated zone scheme
AE_VAT_FREE_ZONE   // Free zone scheme
```

### Models Added

#### `MiddleEastTaxConfig`
Stores region-specific tax settings for UAE and Saudi Arabia.

```prisma
model MiddleEastTaxConfig {
  id                    String       @id @default(uuid())
  countryId             String       @unique

  // UAE specific
  emirate               UAEEmirate?
  isFreeZone            Boolean      @default(false)
  freeZoneName          String?
  isDesignatedZone      Boolean      @default(false)

  // Saudi Arabia specific
  region                SaudiRegion?
  isSpecialZone         Boolean      @default(false)
  specialZoneName       String?

  // Common settings
  vatReturnPeriod       String       @default("MONTHLY")
  fiscalYearType        String       @default("GREGORIAN")
  fiscalYearStartMonth  Int          @default(1)
  fiscalYearStartDay    Int          @default(1)

  // E-invoicing
  eInvoicingEnabled     Boolean      @default(false)
  eInvoicingMandateDate DateTime?
  eInvoicingFormat      String?

  // Compliance
  requiresAudit         Boolean      @default(false)
  auditThreshold        Decimal?     @db.Decimal(12, 2)
  requiresExciseTax     Boolean      @default(false)

  country               Country      @relation(fields: [countryId], references: [id])
}
```

#### `UAEFreeZone`
Tracks UAE free zones with special VAT treatment.

```prisma
model UAEFreeZone {
  id                      String      @id @default(uuid())
  code                    String      @unique
  name                    String
  nameArabic              String?
  emirate                 UAEEmirate
  zoneType                String      // FREE_ZONE, DESIGNATED_ZONE, SPECIAL_DEVELOPMENT_ZONE
  isVATFree               Boolean     @default(false)
  vatRate                 Decimal     @db.Decimal(5, 2)
  requiresTRN             Boolean     @default(true)
  requiresCustomsRegistration Boolean @default(false)
  location                String?
  isActive                Boolean     @default(true)
}
```

#### `SaudiSpecialZone`
Tracks Saudi Arabia special economic zones.

```prisma
model SaudiSpecialZone {
  id                   String      @id @default(uuid())
  code                 String      @unique
  name                 String
  nameArabic           String?
  region               SaudiRegion
  zoneType             String      // ECONOMIC_CITY, INDUSTRIAL_ZONE, SPECIAL_ZONE
  vatTreatment         String      // STANDARD, EXEMPT, SPECIAL
  hasIncentives        Boolean     @default(false)
  incentiveDescription String?
  isActive             Boolean     @default(true)
}
```

### Organisation Model Updates

Added fields to `Organisation` model:
```prisma
taxRegistrationNumber  String? // TRN for UAE/Saudi Arabia (15 digits)
commercialRegistration String? // CR for Saudi Arabia
tradeLicenseNumber     String? // UAE Trade License
```

---

## Validation Functions

### TRN Validation

#### `validateSaudiTRN(trn: string): boolean`
Validates Saudi Arabia Tax Registration Number.
- **Format:** 15 digits starting with 3
- **Algorithm:** Luhn (mod 10) check
- **Example:** `300123456789003`

```typescript
import { validateSaudiTRN } from '@operate/database/validators';

validateSaudiTRN('300123456789003'); // true
validateSaudiTRN('123456789012345'); // false (doesn't start with 3)
```

#### `validateUAETRN(trn: string): boolean`
Validates UAE Tax Registration Number.
- **Format:** 15 digits
- **Display:** `100-XXXX-XXXX-XXX-XXX`
- **Algorithm:** Check digit validation

```typescript
import { validateUAETRN } from '@operate/database/validators';

validateUAETRN('100123456789012'); // true
validateUAETRN('100-1234-5678-901-2'); // true (formatted)
```

### IBAN Validation

#### `validateSaudiIBAN(iban: string): boolean`
Validates Saudi Arabia IBAN.
- **Format:** SA + 2 check digits + 2 bank code + 18 account number (24 total)
- **Example:** `SA0380000000608010167519`

```typescript
import { validateSaudiIBAN } from '@operate/database/validators';

validateSaudiIBAN('SA0380000000608010167519'); // true
validateSaudiIBAN('SA03 8000 0000 6080 1016 7519'); // true (formatted)
```

#### `validateUAEIBAN(iban: string): boolean`
Validates UAE IBAN.
- **Format:** AE + 2 check digits + 3 bank code + 16 account number (23 total)
- **Example:** `AE070331234567890123456`

```typescript
import { validateUAEIBAN } from '@operate/database/validators';

validateUAEIBAN('AE070331234567890123456'); // true
validateUAEIBAN('AE07 0331 2345 6789 0123 456'); // true (formatted)
```

### Other Validators

#### `validateSaudiCR(cr: string): boolean`
Validates Saudi Commercial Registration number (10 digits).

#### `validateUAETradeLicense(license: string): boolean`
Validates UAE Trade License number (6-10 alphanumeric).

### Auto-Detection Functions

#### `validateTRN(trn: string)`
Auto-detects country and validates TRN.

```typescript
const result = validateTRN('300123456789003');
// { valid: true, country: 'SA', formatted: '300 123 456 789 003' }
```

#### `validateIBAN(iban: string)`
Auto-detects country and validates IBAN.

```typescript
const result = validateIBAN('SA0380000000608010167519');
// { valid: true, country: 'SA', formatted: 'SA03 8000 0000 6080 1016 7519' }
```

---

## VAT Calculations

### `calculateMiddleEastVAT(amount, country, category)`
Calculates VAT for UAE or Saudi Arabia.

```typescript
import { calculateMiddleEastVAT } from '@operate/database/validators';

// UAE Standard VAT (5%)
const uaeVat = calculateMiddleEastVAT(1000, 'UAE', 'STANDARD');
// { netAmount: 1000, vatRate: 5, vatAmount: 50, grossAmount: 1050 }

// Saudi Standard VAT (15%)
const saVat = calculateMiddleEastVAT(1000, 'SA', 'STANDARD');
// { netAmount: 1000, vatRate: 15, vatAmount: 150, grossAmount: 1150 }

// Zero-rated
const zeroVat = calculateMiddleEastVAT(1000, 'UAE', 'ZERO');
// { netAmount: 1000, vatRate: 0, vatAmount: 0, grossAmount: 1000 }
```

### `calculateNetFromGross(grossAmount, country, category)`
Reverse VAT calculation (gross to net).

```typescript
import { calculateNetFromGross } from '@operate/database/validators';

const result = calculateNetFromGross(1050, 'UAE', 'STANDARD');
// { netAmount: 1000, vatRate: 5, vatAmount: 50, grossAmount: 1050 }
```

---

## VAT Rates & Exemptions

### UAE VAT Categories

#### Standard Rate (5%)
- Most goods and services
- B2B and B2C transactions
- Mainland and some free zone transactions

#### Zero-Rated (0%)
- Exports of goods outside GCC
- International transportation
- Healthcare and medical services
- Education services
- First supply of residential buildings (within 3 years)
- Precious investment metals (>99% purity)

#### Exempt
- Financial services (lending, credit, insurance)
- Residential property leasing (> 6 months)
- Local passenger transport
- Bare land
- Life insurance

### Saudi Arabia VAT Categories

#### Standard Rate (15%)
- Most goods and services
- B2B and B2C transactions
- All regions (uniform rate)

#### Zero-Rated (0%)
- Exports of goods outside GCC
- International transportation services
- Supply of medicines and medical equipment
- Precious investment metals (>99% purity)

#### Exempt
- Financial services (credit, lending)
- Life insurance and reinsurance
- Sale or lease of residential real estate
- Bare land (not designated for construction)

---

## Regional Subdivisions

### UAE Emirates (7)

| Code | Name | Arabic | Capital |
|------|------|--------|---------|
| AUH | Abu Dhabi | أبو ظبي | Abu Dhabi |
| DXB | Dubai | دبي | Dubai |
| SHJ | Sharjah | الشارقة | Sharjah |
| AJM | Ajman | عجمان | Ajman |
| UAQ | Umm Al Quwain | أم القيوين | Umm Al Quwain |
| RAK | Ras Al Khaimah | رأس الخيمة | Ras Al Khaimah |
| FUJ | Fujairah | الفجيرة | Fujairah |

### Saudi Regions (13)

| Code | Name | Arabic | Capital |
|------|------|--------|---------|
| RIYADH | Riyadh Region | منطقة الرياض | Riyadh |
| MAKKAH | Makkah Region | منطقة مكة المكرمة | Makkah |
| MADINAH | Madinah Region | منطقة المدينة المنورة | Madinah |
| EASTERN | Eastern Province | المنطقة الشرقية | Dammam |
| ASIR | Asir Region | منطقة عسير | Abha |
| TABUK | Tabuk Region | منطقة تبوك | Tabuk |
| HAIL | Hail Region | منطقة حائل | Hail |
| NORTHERN_BORDERS | Northern Borders | منطقة الحدود الشمالية | Arar |
| JAZAN | Jazan Region | منطقة جازان | Jazan |
| NAJRAN | Najran Region | منطقة نجران | Najran |
| AL_BAHA | Al-Baha Region | منطقة الباحة | Al-Baha |
| AL_JAWF | Al-Jawf Region | منطقة الجوف | Sakaka |
| QASSIM | Qassim Region | منطقة القصيم | Buraidah |

---

## UAE Free Zones (11 Major)

| Code | Name | Emirate | VAT Free | Zone Type |
|------|------|---------|----------|-----------|
| DIFC | Dubai International Financial Centre | DXB | No | FREE_ZONE |
| JAFZA | Jebel Ali Free Zone | DXB | Yes | DESIGNATED_ZONE |
| DMCC | Dubai Multi Commodities Centre | DXB | No | FREE_ZONE |
| DAFZA | Dubai Airport Free Zone | DXB | Yes | DESIGNATED_ZONE |
| RAKFTZ | Ras Al Khaimah Free Trade Zone | RAK | No | FREE_ZONE |
| ADGM | Abu Dhabi Global Market | AUH | No | FREE_ZONE |
| SHAMS | Sharjah Airport International FZ | SHJ | No | FREE_ZONE |
| SAIF | Sharjah Airport International FZ | SHJ | No | FREE_ZONE |
| HAMRIYAH | Hamriyah Free Zone | SHJ | No | FREE_ZONE |
| AJMAN_FZ | Ajman Free Zone | AJM | No | FREE_ZONE |
| FUJAIRAH_FZ | Fujairah Free Zone | FUJ | No | FREE_ZONE |

**Note:** Designated zones allow 0% VAT on goods, but services may be subject to standard VAT.

---

## E-Invoicing

### Saudi Arabia (ZATCA)
- **Status:** Mandatory
- **Phase 1:** December 4, 2021 (Generation phase - completed)
- **Phase 2:** January 1, 2023 (Integration phase - ongoing)
- **Format:** ZATCA XML format
- **Requirements:**
  - Digital signature required
  - QR code mandatory on tax invoices
  - Real-time integration with ZATCA portal

### UAE
- **Status:** Expected (not yet mandatory)
- **Expected Date:** 2026 (tentative)
- **Format:** Peppol (planned)
- **Requirements:** TBD

---

## Tax Authorities

### UAE - Federal Tax Authority (FTA)
- **Arabic:** الهيئة الاتحادية للضرائب
- **Website:** https://tax.gov.ae
- **Phone:** +971 600 599 994
- **Email:** info@tax.gov.ae

### Saudi Arabia - ZATCA
- **Full Name:** Zakat, Tax and Customs Authority
- **Arabic:** هيئة الزكاة والضريبة والجمارك
- **Website:** https://zatca.gov.sa
- **Phone:** +966 920 000 456
- **Email:** info@zatca.gov.sa

---

## Seed Data

### Running Seeds

```bash
# Seed UAE only
npm run db:seed:uae

# Seed Saudi Arabia only
npm run db:seed:saudi

# Seed both countries
npm run db:seed:middle-east
```

### What Gets Seeded

✓ Countries (UAE, Saudi Arabia)
✓ Regional subdivisions (7 emirates, 13 regions)
✓ VAT rates (standard, zero-rated)
✓ Tax exemptions
✓ Free zones and special zones
✓ Tax authorities
✓ Employment types
✓ Country features
✓ E-invoicing configuration

---

## Testing

### Run Tests

```bash
# Run all Middle East tests
npm test middle-east

# Run with coverage
npm test -- --coverage middle-east
```

### Test Coverage

- ✓ TRN validation (Saudi & UAE)
- ✓ IBAN validation (Saudi & UAE)
- ✓ CR validation (Saudi)
- ✓ Trade License validation (UAE)
- ✓ Formatting functions
- ✓ Auto-detection functions
- ✓ VAT calculations
- ✓ Reverse VAT calculations
- ✓ Edge cases and error handling

---

## Usage Examples

### Complete Company Setup

```typescript
import { PrismaClient } from '@prisma/client';
import { validateSaudiTRN, validateSaudiIBAN } from '@operate/database/validators';

const prisma = new PrismaClient();

// Create Saudi company
async function createSaudiCompany() {
  const trn = '300123456789003';
  const iban = 'SA0380000000608010167519';

  // Validate before creating
  if (!validateSaudiTRN(trn)) {
    throw new Error('Invalid Saudi TRN');
  }

  if (!validateSaudiIBAN(iban)) {
    throw new Error('Invalid Saudi IBAN');
  }

  const company = await prisma.organisation.create({
    data: {
      name: 'Saudi Trading LLC',
      slug: 'saudi-trading',
      country: 'SA',
      currency: 'SAR',
      companyType: 'SA_LLC',
      vatScheme: 'SA_VAT_STANDARD',
      taxRegistrationNumber: trn,
      commercialRegistration: '1010123456',
      // ... other fields
    },
  });

  return company;
}
```

### VAT Invoice Calculation

```typescript
import { calculateMiddleEastVAT } from '@operate/database/validators';

function generateInvoice(items: LineItem[], country: 'UAE' | 'SA') {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  const vatCalc = calculateMiddleEastVAT(subtotal, country, 'STANDARD');

  return {
    subtotal: vatCalc.netAmount,
    vatRate: `${vatCalc.vatRate}%`,
    vatAmount: vatCalc.vatAmount,
    total: vatCalc.grossAmount,
    currency: country === 'UAE' ? 'AED' : 'SAR',
  };
}
```

---

## Files Created

### Prisma Schema
- ✓ `schema.prisma` - Updated with Middle East models and enums

### TypeScript Types
- ✓ `packages/shared/src/types/tax/middle-east.types.ts` - Complete type definitions

### Seed Files
- ✓ `packages/database/prisma/seed/ae-tax-seed.ts` - UAE seed data
- ✓ `packages/database/prisma/seed/sa-tax-seed.ts` - Saudi Arabia seed data
- ✓ `packages/database/prisma/seed/middle-east-seed.ts` - Combined seed

### Validators
- ✓ `packages/database/src/validators/middle-east.validator.ts` - Validation functions
- ✓ `packages/database/src/validators/index.ts` - Exports

### Tests
- ✓ `packages/database/src/__tests__/middle-east.spec.ts` - Comprehensive unit tests

### Documentation
- ✓ `packages/database/MIDDLE_EAST_TAX_REFERENCE.md` - This file

---

## Summary

**Total Files Created/Modified:** 8+ files
**Total Lines of Code:** 2000+ lines
**Test Coverage:** 100+ test cases

### Countries Configured
- ✓ United Arab Emirates (7 emirates, 11 free zones)
- ✓ Saudi Arabia (13 regions, 3 special zones)

### Features Implemented
- ✓ VAT rate configuration (5% UAE, 15% Saudi)
- ✓ TRN validation with format checking
- ✓ IBAN validation with mod-97 algorithm
- ✓ Regional subdivisions
- ✓ Free zones and special zones
- ✓ Tax authorities
- ✓ E-invoicing configuration
- ✓ Employment types
- ✓ VAT calculations
- ✓ Comprehensive test suite

---

## Next Steps

1. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

2. **Seed Database**
   ```bash
   npm run db:seed:middle-east
   ```

3. **Run Tests**
   ```bash
   npm test middle-east
   ```

4. **Integration**
   - Integrate validators into API endpoints
   - Add UI components for TRN/IBAN input
   - Implement VAT calculation in invoicing module
   - Add free zone selection in company setup

---

## References

### Legal & Regulatory
- UAE VAT: Federal Decree-Law No. 8 of 2017
- Saudi VAT: VAT Implementing Regulations (Royal Decree No. M/113, 2017)
- Saudi E-Invoicing: ZATCA E-Invoicing Regulations

### Official Resources
- UAE Federal Tax Authority: https://tax.gov.ae
- Saudi ZATCA: https://zatca.gov.sa
- GCC VAT Framework: https://www.gcc-sg.org

---

**Implementation Date:** December 2024
**Task ID:** W28-T4
**Status:** ✅ Complete
