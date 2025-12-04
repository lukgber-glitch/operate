# Migration: EU Tax Configurations

**Task:** W24-T5 - Add EU country tax configurations
**Date:** 2025-12-03
**Author:** VAULT Agent

## Overview

This migration adds comprehensive tax configuration support for 6 EU countries:
- France (FR)
- Italy (IT)
- Netherlands (NL)
- Belgium (BE)
- Sweden (SE)
- Ireland (IE)

## Schema Changes

### New Enums

1. **TaxPeriodType**
   - MONTHLY
   - QUARTERLY
   - ANNUAL
   - SEMI_ANNUAL
   - BI_MONTHLY

2. **TaxCategory** (EU harmonized VAT categories)
   - STANDARD
   - REDUCED
   - SUPER_REDUCED
   - ZERO
   - EXEMPT
   - PARKING
   - INTERMEDIATE

3. **InvoiceNumberingType**
   - SEQUENTIAL
   - YEAR_PREFIX
   - CUSTOM_PREFIX
   - FREE_FORMAT

### New Models

1. **CountryTaxConfig**
   - One per country
   - Stores tax filing periods, deadlines, e-invoicing requirements
   - Fields for VIES validation, fiscal representative requirements, SAF-T reporting

2. **VatRateConfig**
   - Multiple per country (one per VAT category/rate)
   - Replaces simple VatRate model with category-based approach
   - Includes legal basis, EU directive references, examples

3. **TaxFilingDeadline**
   - Tracks specific filing and payment deadlines
   - Supports multiple tax types (VAT, Corporate, Withholding)
   - Year and period-based tracking

### Relations Added to Country Model

- `taxConfig: CountryTaxConfig?` (one-to-one)
- `taxFilingDeadlines: TaxFilingDeadline[]` (one-to-many)

## Data Migration

Run the seed to populate tax configurations:

```bash
npm run db:seed
```

This will create:
- 6 new countries (FR, IT, NL, BE, SE, IE)
- Tax configurations for each country
- VAT rates with categories (15-20 rates per country)
- Regional data (regions/provinces/counties)

## Tax Rate Details

### France (FR)
- Standard: 20%
- Reduced: 10%, 5.5%
- Super-Reduced: 2.1%

### Italy (IT)
- Standard: 22%
- Reduced: 10%, 5%
- Super-Reduced: 4%

### Netherlands (NL)
- Standard: 21%
- Reduced: 9%
- Zero: 0%

### Belgium (BE)
- Standard: 21%
- Intermediate: 12%
- Reduced: 6%
- Zero: 0%

### Sweden (SE)
- Standard: 25%
- Reduced: 12%, 6%
- Zero: 0%

### Ireland (IE)
- Standard: 23%
- Reduced: 13.5%, 9%, 4.8%
- Zero: 0%

## E-Invoicing Requirements

| Country | Required | Mandate Date | Format | Network |
|---------|----------|--------------|--------|---------|
| FR | Yes | 2026-09-01 | Chorus Pro / Factur-X | Chorus Pro |
| IT | Yes | 2019-01-01 | FatturaPA | SDI |
| NL | Yes | 2026-01-01 | Peppol BIS 3.0 | Peppol |
| BE | Yes | 2026-01-01 | Peppol BIS 3.0 | Peppol |
| SE | Yes | 2025-01-01 | Peppol BIS 3.0 | Peppol |
| IE | Yes | 2026-01-01 | Peppol BIS 3.0 | Peppol |

## SAF-T Requirements

- Netherlands: Annual SAF-T required
- Ireland: Annual SAF-T required
- Other countries: Not required (yet)

## Notes

- All VAT rates comply with EU VAT Directive 2006/112/EC
- E-invoicing dates reflect current EU mandates (as of 2025)
- Tax configurations can be extended for other EU countries
- VIES validation is required for all intra-community supplies

## Rollback

To rollback this migration:

```bash
npm run db:migrate:rollback
```

This will:
- Drop the three new tables
- Drop the three new enums
- Remove relations from Country model
