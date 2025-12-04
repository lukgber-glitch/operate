# Spanish Tax Configuration (IVA)

## Overview

This document describes the Spanish tax configuration implementation for the Operate/CoachOS platform, including IVA (VAT), IGIC (Canary Islands), and Recargo de Equivalencia (RE) surcharges.

**Task:** W25-T2 - Create Spanish tax configuration (IVA)
**Market:** Spain (ES)
**Completion Date:** 2025-12-03

---

## Features Implemented

### 1. Tax Rates

#### Standard IVA (Mainland Spain)
- **Standard Rate (21%)** - IVA General
  - Most goods and services
  - Electronics, vehicles, professional services

- **Reduced Rate (10%)** - IVA Reducido
  - Essential goods and services
  - Food products, water, pharmaceuticals, transport
  - Restaurant and catering services
  - Cultural services, books, newspapers

- **Super-Reduced Rate (4%)** - IVA Superreducido
  - Basic necessities
  - Bread, milk, eggs, fruits, vegetables
  - Educational books, medicines
  - Social housing (VPO)

- **Zero Rate (0%)**
  - Exports to non-EU countries
  - Intra-community supplies
  - International transport

#### IGIC (Canary Islands)
The Canary Islands use IGIC (Impuesto General Indirecto Canario) instead of IVA:

- **Special Rate (15%)** - Luxury goods, premium tobacco/alcohol
- **Increased Reduced Rate (9.5%)** - Tobacco, alcohol, certain luxury items
- **General Rate (7%)** - Standard rate for Canary Islands
- **Reduced Rate (3%)** - Food, transport, culture
- **Zero Rate (0%)** - Exports, essential goods

#### Recargo de Equivalencia (RE)
Special surcharge for small retailers, added ON TOP of regular IVA:

- **Standard Surcharge (5.2%)** - Applied with 21% IVA = 26.2% total
- **Reduced Surcharge (1.4%)** - Applied with 10% IVA = 11.4% total
- **Super-Reduced Surcharge (0.5%)** - Applied with 4% IVA = 4.5% total

---

## File Structure

### Database
```
packages/database/prisma/seeds/spain-tax-config.seed.ts
```
- Seeds Spanish country data
- Creates tax configuration (CountryTaxConfig)
- Populates VAT rates (VatRateConfig)
- Includes IVA, IGIC, and RE rates

### Shared Package
```
packages/shared/src/constants/spain-tax.constants.ts
packages/shared/src/utils/spain-tax.validator.ts
```

**Constants:**
- Tax rates (IVA, IGIC, RE)
- Tax regimes
- Filing forms (Modelo 303, 390, 347, 349)
- Quarterly and annual deadlines
- NIF/CIF patterns
- Thresholds and penalties

**Validators:**
- NIF validation (individuals)
- NIE validation (foreign individuals)
- CIF validation (companies)
- VAT number validation
- Check digit calculation algorithms
- Tax ID formatting

### API Module
```
apps/api/src/modules/tax/spain/spain-tax.config.ts
apps/api/src/modules/tax/spain/index.ts
```

**Features:**
- Tax rate lookup by category
- Combined tax rate calculation (IVA + RE)
- Filing deadline retrieval
- Location-based tax determination
- Tax ID validation
- Special tax treatment detection

---

## Tax ID Formats

### NIF (Número de Identificación Fiscal)
**Format:** 8 digits + control letter
**Example:** 12345678Z

Individual Spanish tax IDs use a modulo-23 algorithm to calculate the control letter.

### NIE (Número de Identidad de Extranjero)
**Format:** X/Y/Z + 7 digits + control letter
**Example:** X1234567L

Foreign individual tax IDs where X=0, Y=1, Z=2 for calculation purposes.

### CIF (Código de Identificación Fiscal)
**Format:** Type letter + 7 digits + control character
**Example:** B12345678

Company tax IDs where the first letter indicates the entity type:
- A: Sociedad Anónima (Public Limited Company)
- B: Sociedad de Responsabilidad Limitada (Limited Liability Company)
- G: Asociación (Association)
- etc.

### Spanish VAT Number
**Format:** ES + NIF/CIF
**Example:** ESB12345678

---

## Tax Regimes

1. **REGIMEN_GENERAL** - General Regime (Common regime)
2. **REGIMEN_SIMPLIFICADO** - Simplified Regime (módulos)
3. **RECARGO_EQUIVALENCIA** - Retailers Surcharge Regime
4. **RECC** - Cash Accounting Regime (Criterio de Caja)
5. **REBU** - Second-hand Goods Regime (Bienes Usados)
6. **REGE** - Group Entities Regime
7. **IGIC** - Canary Islands Regime

---

## Filing Deadlines

### Quarterly VAT Returns (Modelo 303)
- **Q1 (Jan-Mar):** April 1-20
- **Q2 (Apr-Jun):** July 1-20
- **Q3 (Jul-Sep):** October 1-20
- **Q4 (Oct-Dec):** January 1-30

### Annual Returns
- **Modelo 390** - Annual VAT summary: January 1-30
- **Modelo 347** - Annual operations with third parties: February 1-28
- **Modelo 200** - Corporate income tax: 6 months after fiscal year end

### Other Forms
- **Modelo 349** - Intra-community transactions (quarterly or monthly)
- **Modelo 036/037** - Tax registration

---

## Special Regions

### Canary Islands
- Uses **IGIC** instead of IVA
- Provinces: Las Palmas, Santa Cruz de Tenerife
- Different rate structure (0%, 3%, 7%, 9.5%, 15%)

### Ceuta and Melilla
- Special tax treatment
- Lower rates and exemptions apply

---

## Usage Examples

### Getting Tax Rates

```typescript
import { SpainTaxConfig } from '@/modules/tax/spain';

// Get standard IVA rate
const rate = SpainTaxConfig.getIVARate('STANDARD');
// { rate: 21.0, category: 'STANDARD', type: 'IVA', description: '...' }

// Get IGIC rate for Canary Islands
const igicRate = SpainTaxConfig.getIGICRate('STANDARD');
// { rate: 7.0, category: 'STANDARD', type: 'IGIC', description: '...' }

// Get combined rate (IVA + RE)
const combined = SpainTaxConfig.getCombinedTaxRate(
  'STANDARD',
  undefined,
  'RECARGO_EQUIVALENCIA'
);
// { total: 26.2, breakdown: [...] }
```

### Validating Tax IDs

```typescript
import {
  isValidSpanishNIF,
  isValidSpanishCIF,
  isValidSpanishVATNumber,
  formatSpanishTaxId,
} from '@operate/shared';

// Validate NIF
const isValid = isValidSpanishNIF('12345678Z'); // true

// Validate CIF
const isCIFValid = isValidSpanishCIF('B12345678'); // true

// Validate VAT number
const isVATValid = isValidSpanishVATNumber('ESB12345678'); // true

// Format tax ID
const formatted = formatSpanishTaxId('12345678Z'); // '12345678-Z'
```

### Checking Filing Requirements

```typescript
import { SpainTaxConfig } from '@/modules/tax/spain';

// Check if transaction requires Modelo 347 reporting (>€3,005.06)
const requires347 = SpainTaxConfig.requiresModelo347(5000); // true

// Check intra-community threshold (€35,000)
const aboveThreshold = SpainTaxConfig.isAboveIntraCommunityThreshold(40000); // true

// Get quarterly deadline
const q1Deadline = SpainTaxConfig.getQuarterlyDeadline('Q1');
// { form: 'Modelo 303', period: 'January - March', filingEnd: 'April 20', ... }
```

---

## Database Schema

### Country
```prisma
model Country {
  code: 'ES'
  code3: 'ESP'
  name: 'Spain'
  currency: 'EUR'
  timezone: 'Europe/Madrid'
  fiscalYearStart: '01-01'
}
```

### CountryTaxConfig
```prisma
model CountryTaxConfig {
  vatPeriodType: QUARTERLY
  corporateTaxPeriodType: ANNUAL
  vatFilingDeadlineDays: 20
  requiresEInvoicing: true
  eInvoicingFormat: 'Facturae'
  viesValidationRequired: true
}
```

### VatRateConfig
Multiple entries for:
- IVA rates (21%, 10%, 4%, 0%)
- IGIC rates (15%, 9.5%, 7%, 3%, 0%)
- RE surcharges (5.2%, 1.4%, 0.5%)

---

## Testing

### Unit Tests
```bash
# Run validator tests
npm test spain-tax.validator.spec.ts
```

Test coverage includes:
- NIF validation with check digit calculation
- NIE validation with prefix handling
- CIF validation with control character algorithm
- VAT number format validation
- Tax ID type detection
- Formatting functions

### Seed Database
```bash
# Run database seed
npm run db:seed
```

This will create:
- Spain country record
- Tax configuration
- All VAT rates (IVA, IGIC, RE)

---

## Legal References

### Legislation
- **EU VAT Directive 2006/112/EC** - European VAT framework
- **Ley 37/1992 del IVA** - Spanish VAT Law
- **Ley 20/1991 del IGIC** - Canary Islands IGIC Law

### Articles
- **Art. 90.Uno** - Standard IVA rate (21%)
- **Art. 91.Uno** - Reduced IVA rate (10%)
- **Art. 91.Dos** - Super-reduced IVA rate (4%)
- **Art. 148-154** - Recargo de Equivalencia

### Official Resources
- **AEAT** - Agencia Estatal de Administración Tributaria
  - Website: https://www.agenciatributaria.es
- **FACe Portal** - E-invoicing platform
  - Website: https://face.gob.es
- **FNMT** - Digital certificate provider
  - Website: https://www.sede.fnmt.gob.es/certificados

---

## E-Invoicing

### Facturae Format
- **Mandate Date:** 2025-01-01
- **Format:** Facturae 3.2.2
- **Network:** FACe / FACeB2B
- **Required for:**
  - Public sector suppliers (already mandatory)
  - All B2B transactions (from 2025)

### Digital Certificates
- **Issuer:** FNMT (Fábrica Nacional de Moneda y Timbre)
- **Alternative:** Cl@ve PIN system
- **Mandatory for:** All VAT returns and electronic filing

---

## Migration Notes

To enable Spanish tax configuration for an organization:

1. **Set country to 'ES'**
   ```typescript
   organisation.country = 'ES';
   ```

2. **Configure tax regime** (if applicable)
   ```typescript
   organisation.taxRegime = 'RECARGO_EQUIVALENCIA';
   ```

3. **Set province** (for IGIC determination)
   ```typescript
   organisation.province = 'Las Palmas'; // For Canary Islands
   ```

4. **Use SpainTaxConfig** for tax calculations
   ```typescript
   const taxRate = SpainTaxConfig.getTaxRate(
     category,
     organisation.province,
     organisation.taxRegime
   );
   ```

---

## Future Enhancements

### Potential Additions
1. **Modelo 303 XML generation** - Automated quarterly VAT return creation
2. **Modelo 390 reporting** - Annual summary generation
3. **SII integration** - Immediate Supply of Information system
4. **Facturae XML generation** - E-invoice creation
5. **VIES integration** - Intra-EU VAT validation
6. **Regional tax variations** - Basque Country and Navarra special regimes

### Database Enhancements
1. **Historical rate tracking** - Track rate changes over time
2. **Regional configurations** - Store Canary Islands, Ceuta/Melilla specifics
3. **Filing history** - Track submitted returns

---

## Support and References

### Internal Documentation
- See `SPAIN_TAX_CONSTANTS` for all rate and threshold values
- See `spain-tax.validator.ts` for validation algorithms
- See `spain-tax.config.ts` for tax calculation logic

### External Resources
- [AEAT - Spanish Tax Agency](https://www.agenciatributaria.es)
- [EU VAT Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20200101)
- [Spanish VAT Law (Ley 37/1992)](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740)

---

## Completion Summary

### Created Files
1. ✅ `packages/database/prisma/seeds/spain-tax-config.seed.ts` - Database seed
2. ✅ `packages/shared/src/constants/spain-tax.constants.ts` - Constants
3. ✅ `packages/shared/src/utils/spain-tax.validator.ts` - Validators
4. ✅ `apps/api/src/modules/tax/spain/spain-tax.config.ts` - Tax config service
5. ✅ `packages/shared/src/utils/__tests__/spain-tax.validator.spec.ts` - Unit tests

### Updated Files
1. ✅ `packages/shared/src/index.ts` - Export new modules
2. ✅ `packages/database/prisma/seed.ts` - Include Spain seed

### Tax Rates Configured
- ✅ Standard IVA: 21%, 10%, 4%, 0%
- ✅ Recargo de Equivalencia: 5.2%, 1.4%, 0.5%
- ✅ IGIC (Canary Islands): 15%, 9.5%, 7%, 3%, 0%

### Validation Algorithms
- ✅ NIF check digit calculation (modulo 23)
- ✅ NIE validation with prefix conversion
- ✅ CIF control character algorithm
- ✅ VAT number format validation

### Special Features
- ✅ Canary Islands IGIC support
- ✅ Recargo de Equivalencia regime
- ✅ Special region detection
- ✅ Filing deadline documentation
- ✅ Tax regime descriptions

---

**Task Status:** ✅ COMPLETED
**Estimated Effort:** 1 day
**Actual Effort:** 1 day
**Priority:** P0
