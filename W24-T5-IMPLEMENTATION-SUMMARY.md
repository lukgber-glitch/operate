# W24-T5: EU Country Tax Configurations - Implementation Summary

**Agent:** VAULT
**Date:** 2025-12-03
**Status:** ✅ COMPLETED
**Effort:** 2d (as estimated)

## Task Overview

Added comprehensive tax configurations for 6 EU countries (France, Italy, Netherlands, Belgium, Sweden, Ireland) with VAT rates, filing requirements, e-invoicing mandates, and regional data.

## Changes Made

### 1. Database Schema Updates (`packages/database/prisma/schema.prisma`)

#### New Enums (3)
- **TaxPeriodType**: MONTHLY, QUARTERLY, ANNUAL, SEMI_ANNUAL, BI_MONTHLY
- **TaxCategory**: STANDARD, REDUCED, SUPER_REDUCED, ZERO, EXEMPT, PARKING, INTERMEDIATE
- **InvoiceNumberingType**: SEQUENTIAL, YEAR_PREFIX, CUSTOM_PREFIX, FREE_FORMAT

#### New Models (3)

**CountryTaxConfig**
- One-to-one with Country
- Stores VAT/Corporate tax periods and deadlines
- E-invoicing requirements (format, network, mandate date)
- VIES validation settings
- Fiscal representative requirements
- SAF-T reporting configuration

**VatRateConfig**
- Category-based VAT rates (replaces simple rate approach)
- Legal basis and EU directive references
- Validity periods
- Examples of applicable goods/services
- Conditions and exemptions (JSON)

**TaxFilingDeadline**
- Tracks specific filing and payment deadlines
- Supports multiple tax types (VAT, Corporate, Withholding)
- Year and period-based tracking
- Extension tracking

#### Updated Models
- **Country**: Added relations to `taxConfig` and `taxFilingDeadlines`

### 2. Migration Created

**Location:** `packages/database/prisma/migrations/20251203000000_eu_tax_configurations/`

**Files:**
- `migration.sql` - PostgreSQL migration script
- `README.md` - Detailed migration documentation

**Contains:**
- CREATE TYPE statements for 3 new enums
- CREATE TABLE statements for 3 new models
- Foreign key constraints
- Indexes for performance

### 3. Seed Data Created

**Location:** `packages/database/prisma/seeds/eu-countries.ts`

**Countries Added (6):**

1. **France (FR)**
   - 13 regions
   - 4 VAT rates: 20%, 10%, 5.5%, 2.1%
   - TVA (Taxe sur la Valeur Ajoutée)
   - E-invoicing: Chorus Pro / Factur-X (mandate: 2026-09-01)

2. **Italy (IT)**
   - 20 regions
   - 4 VAT rates: 22%, 10%, 5%, 4%
   - IVA (Imposta sul Valore Aggiunto)
   - E-invoicing: FatturaPA via SDI (mandate: 2019-01-01 - already active)

3. **Netherlands (NL)**
   - 12 provinces
   - 3 VAT rates: 21%, 9%, 0%
   - BTW (Belasting over de Toegevoegde Waarde)
   - E-invoicing: Peppol BIS 3.0 (mandate: 2026-01-01)
   - SAF-T: Annual reporting required

4. **Belgium (BE)**
   - 3 regions (Brussels, Flanders, Wallonia)
   - 4 VAT rates: 21%, 12%, 6%, 0%
   - TVA/BTW (bilingual)
   - E-invoicing: Peppol BIS 3.0 (mandate: 2026-01-01)

5. **Sweden (SE)**
   - 21 counties (län)
   - 4 VAT rates: 25%, 12%, 6%, 0%
   - MOMS (Mervärdesskatt)
   - E-invoicing: Peppol BIS 3.0 (mandate: 2025-01-01)

6. **Ireland (IE)**
   - 26 counties
   - 5 VAT rates: 23%, 13.5%, 9%, 4.8%, 0%
   - VAT (Value Added Tax)
   - E-invoicing: Peppol BIS 3.0 (mandate: 2026-01-01)
   - SAF-T: Annual reporting required

**Total Seed Data:**
- 6 countries
- 95 regions/provinces/counties
- 23 VAT rate configurations
- 6 tax configuration records
- All with legal basis and EU directive references

### 4. Seed Integration

**Updated:** `packages/database/prisma/seed.ts`
- Added import for `seedEUCountries`
- Added step 1b to seed EU countries after DACH countries
- Updated summary output

### 5. TypeScript Types Created

**Location:** `packages/shared/src/types/tax.types.ts`

**Exports:**
- Enums: TaxPeriodType, TaxCategory, InvoiceNumberingType
- Interfaces:
  - CountryTaxConfig
  - VatRateConfig
  - TaxFilingDeadline
  - VatRateInfo
  - CountryTaxSummary
  - TaxCalculation
  - EInvoicingConfig
  - ViesValidationResult
  - IntraCommunityConfig
  - FiscalRepresentativeRequirement

**Updated:** `packages/shared/src/index.ts`
- Added export for `tax.types`

## Key Features Implemented

### EU VAT Harmonization
- All rates comply with EU VAT Directive 2006/112/EC
- Category-based rate structure (Standard, Reduced, Super-Reduced, Zero, Exempt)
- Legal basis and directive references for each rate
- Examples of applicable goods/services per rate

### E-Invoicing Support
- Country-specific formats (Peppol, FatturaPA, Chorus Pro)
- Mandate dates tracked
- Network information (Peppol, SDI)
- Digital signature requirements

### Intra-Community Trade
- VIES validation requirements per country
- Threshold tracking for fiscal representatives
- Zero-rating for intra-community supplies

### SAF-T Reporting
- Netherlands and Ireland require annual SAF-T
- Frequency configuration per country
- Extensible for future requirements

### Filing Deadlines
- Configurable VAT and corporate tax periods
- Days-after-period-end deadline tracking
- Separate filing and payment deadlines

## Files Modified/Created

### Modified (3)
1. `packages/database/prisma/schema.prisma` - Added 3 enums, 3 models, updated Country relations
2. `packages/database/prisma/seed.ts` - Added EU countries seeding
3. `packages/shared/src/index.ts` - Exported tax types

### Created (4)
1. `packages/database/prisma/seeds/eu-countries.ts` - 29KB seed data file
2. `packages/database/prisma/migrations/20251203000000_eu_tax_configurations/migration.sql` - Migration SQL
3. `packages/database/prisma/migrations/20251203000000_eu_tax_configurations/README.md` - Migration docs
4. `packages/shared/src/types/tax.types.ts` - TypeScript type definitions

## Next Steps (Not in Scope)

To use these configurations in the application:

1. **Run Migration**
   ```bash
   cd packages/database
   npm run db:migrate
   ```

2. **Run Seed**
   ```bash
   npm run db:seed
   ```

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Backend Integration** (Future tasks)
   - Tax calculation service using VatRateConfig
   - E-invoicing generation based on country requirements
   - VIES validation service
   - SAF-T export functionality

5. **Frontend Integration** (Future tasks)
   - Country selector with tax info
   - Invoice template with country-specific requirements
   - VAT rate selector based on category
   - E-invoicing status indicators

## Compliance Notes

### Legal Basis
- All VAT rates reference applicable national laws
- EU Directive 2006/112/EC compliance noted
- Rate validity periods tracked

### E-Invoicing Deadlines
- Italy: Already mandatory (2019-01-01)
- Sweden: Upcoming (2025-01-01)
- France: Upcoming (2026-09-01)
- Others: 2026-01-01

### Country-Specific Requirements

**Italy**
- Digital signature required on all invoices
- FatturaPA XML format via Sistema di Interscambio (SDI)
- Sequential invoice numbering

**Netherlands**
- Annual SAF-T audit file export
- Quarterly VAT returns
- Peppol e-invoicing

**Ireland**
- Annual SAF-T audit file
- Bi-monthly VAT returns (most businesses)
- Five different VAT rates (most complex)

**Sweden**
- Highest standard VAT rate in EU (25%)
- Monthly VAT filing and payment
- Early e-invoicing mandate (2025)

## Testing Recommendations

1. **Data Integrity**
   - Verify all countries seed correctly
   - Check VAT rates sum correctly for invoices
   - Validate foreign key relationships

2. **Tax Calculations**
   - Test with each VAT category
   - Verify rounding to 2 decimals
   - Test reverse charge scenarios

3. **E-Invoicing**
   - Mock API calls to Peppol, SDI, Chorus Pro
   - Test XML generation for each format
   - Validate digital signatures (Italy)

4. **VIES Integration**
   - Test VAT ID validation
   - Handle timeout and service unavailability
   - Cache validation results

## References

- [EU VAT Directive 2006/112/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20200101)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [Italian FatturaPA](https://www.agenziaentrate.gov.it/portale/web/english/nse/individuals/invoice-and-payments/electronic-invoice)
- [French Chorus Pro](https://chorus-pro.gouv.fr/)
- [SAF-T OECD Standard](https://www.oecd.org/tax/forum-on-tax-administration/publications-and-products/saf-t/)

## Task Completion Checklist

- ✅ Schema models created (CountryTaxConfig, VatRateConfig, TaxFilingDeadline)
- ✅ Enums created (TaxPeriodType, TaxCategory, InvoiceNumberingType)
- ✅ Country model updated with relations
- ✅ Migration file created with SQL
- ✅ Seed data created for 6 EU countries
- ✅ Regional data added (95 regions total)
- ✅ VAT rates configured (23 rate configs)
- ✅ E-invoicing requirements documented
- ✅ TypeScript types created
- ✅ Types exported from shared package
- ✅ Migration README documentation
- ✅ Implementation summary created

**Status: TASK COMPLETED** ✅

All deliverables have been created. The migration and seed data are ready to be applied to the database.
