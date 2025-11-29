# Country Context - Quick Reference

## Overview

The country context system provides multi-country support for tax, VAT, HR, and compliance features across Germany, Austria, and Switzerland.

## Database Models

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Country` | Main country entity | code, name, currency, locale, timezone |
| `Region` | Sub-jurisdictions | code, name (Bundesländer, Kantone) |
| `VatRate` | VAT/tax rates | rate, validFrom, validTo |
| `DeductionCategory` | Tax deductions | code, maxAmount, legalBasis |
| `GovernmentApi` | External APIs | name, baseUrl, authType |
| `CountryFeature` | Feature flags | feature, enabled, config |
| `EmploymentType` | Employment types | code, name, description |

### Integration Models

| Model | Purpose | Relationship |
|-------|---------|--------------|
| `OrganisationCountry` | Org ↔ Country | Many-to-many |
| `TaxCredential` | Encrypted credentials | Org → Country |
| `TaxAuthority` | Tax offices | Country → Authority |

## Quick Start

### 1. Import Types

```typescript
import {
  Country,
  Region,
  VatRate,
  DeductionCategory,
  CountryWithRelations,
  VatRateQuery,
} from '@operate/database';
```

### 2. Query Countries

```typescript
// Get all active countries
const countries = await prisma.country.findMany({
  where: { isActive: true },
  include: {
    regions: true,
    vatRates: true,
  },
});

// Get country by code
const germany = await prisma.country.findUnique({
  where: { code: 'DE' },
  include: {
    regions: true,
    vatRates: {
      where: {
        validTo: null, // Current rates only
      },
    },
    deductionCategories: {
      where: { isActive: true },
    },
  },
});
```

### 3. Get VAT Rates

```typescript
// Current VAT rates for Germany
const vatRates = await prisma.vatRate.findMany({
  where: {
    country: { code: 'DE' },
    validFrom: { lte: new Date() },
    OR: [
      { validTo: null },
      { validTo: { gte: new Date() } },
    ],
  },
  include: {
    country: {
      select: { code: true, name: true },
    },
  },
});

// Result:
// [
//   { name: 'Standard', rate: 19.00, country: { code: 'DE', name: 'Germany' } },
//   { name: 'Reduced', rate: 7.00, country: { code: 'DE', name: 'Germany' } },
//   { name: 'Zero', rate: 0.00, country: { code: 'DE', name: 'Germany' } }
// ]
```

### 4. Get Deduction Categories

```typescript
// All active deduction categories for Austria
const deductions = await prisma.deductionCategory.findMany({
  where: {
    country: { code: 'AT' },
    isActive: true,
  },
  include: {
    country: {
      select: { code: true, name: true },
    },
  },
});
```

### 5. Link Organisation to Country

```typescript
// Enable multi-country support for an organisation
await prisma.organisationCountry.create({
  data: {
    orgId: organisation.id,
    countryId: country.id,
    isActive: true,
  },
});

// Get all countries for an organisation
const orgCountries = await prisma.organisationCountry.findMany({
  where: {
    orgId: organisation.id,
    isActive: true,
  },
  include: {
    country: {
      include: {
        regions: true,
        vatRates: {
          where: { validTo: null },
        },
      },
    },
  },
});
```

## Seed Data Summary

### Germany (DE)
- **16 Regions**: Baden-Württemberg, Bayern, Berlin, etc.
- **VAT Rates**: 19% (standard), 7% (reduced), 0% (zero)
- **Deductions**: 6 categories (Travel, Home Office, Professional Development, etc.)
- **APIs**: ELSTER, VIES
- **Employment**: Full-time, Part-time, Mini-Job, Midi-Job, Freelancer, Intern

### Austria (AT)
- **9 Regions**: Burgenland, Kärnten, Wien, etc.
- **VAT Rates**: 20% (standard), 10% (reduced), 13% (super-reduced), 0% (zero)
- **Deductions**: 5 categories
- **APIs**: FinanzOnline, VIES
- **Employment**: Full-time, Part-time, Freelancer, Intern, Marginal

### Switzerland (CH)
- **26 Regions**: Aargau, Bern, Zürich, etc.
- **VAT Rates**: 7.7% (standard), 2.5% (reduced), 3.7% (special), 0% (zero)
- **Deductions**: 5 categories
- **APIs**: UID Register
- **Employment**: Full-time, Part-time, Freelancer, Intern, Apprentice

## Common Patterns

### Calculate VAT

```typescript
async function calculateVAT(
  countryCode: string,
  amount: number,
  rateType: 'Standard' | 'Reduced' | 'Zero'
) {
  const vatRate = await prisma.vatRate.findFirst({
    where: {
      country: { code: countryCode },
      name: rateType,
      validFrom: { lte: new Date() },
      OR: [
        { validTo: null },
        { validTo: { gte: new Date() } },
      ],
    },
  });

  if (!vatRate) {
    throw new Error(`VAT rate not found for ${countryCode} - ${rateType}`);
  }

  const vatAmount = (amount * Number(vatRate.rate)) / 100;
  const totalAmount = amount + vatAmount;

  return {
    netAmount: amount,
    vatRate: Number(vatRate.rate),
    vatAmount,
    totalAmount,
  };
}

// Usage
const result = await calculateVAT('DE', 100, 'Standard');
// { netAmount: 100, vatRate: 19, vatAmount: 19, totalAmount: 119 }
```

### Validate Deduction

```typescript
async function validateDeduction(
  countryCode: string,
  categoryCode: string,
  amount: number
) {
  const category = await prisma.deductionCategory.findUnique({
    where: {
      countryId_code: {
        countryId: (await prisma.country.findUnique({
          where: { code: countryCode },
        }))!.id,
        code: categoryCode,
      },
    },
  });

  if (!category || !category.isActive) {
    return { valid: false, reason: 'Category not found or inactive' };
  }

  if (category.maxAmount && amount > Number(category.maxAmount)) {
    return {
      valid: false,
      reason: `Amount exceeds maximum of ${category.maxAmount}`,
    };
  }

  return {
    valid: true,
    category: category.name,
    requiresProof: category.requiresProof,
    legalBasis: category.legalBasis,
  };
}

// Usage
const validation = await validateDeduction('DE', 'HOME_OFFICE', 1500);
// { valid: false, reason: 'Amount exceeds maximum of 1260' }
```

### Get Country Features

```typescript
async function getCountryFeatures(countryCode: string) {
  const features = await prisma.countryFeature.findMany({
    where: {
      country: { code: countryCode },
      enabled: true,
    },
    select: {
      feature: true,
      config: true,
    },
  });

  return features.reduce((acc, f) => {
    acc[f.feature] = f.config || true;
    return acc;
  }, {} as Record<string, any>);
}

// Usage
const features = await getCountryFeatures('DE');
// {
//   tax_filing: true,
//   vat_validation: true,
//   social_security: true,
//   payroll: true
// }
```

## Running Migrations & Seeds

```bash
# Navigate to database package
cd packages/database

# Run migration
npx prisma migrate dev

# Run full seed (countries + core data)
npm run db:seed

# Run countries seed only
npx ts-node src/seeds/countries.seed.ts

# Generate Prisma client
npx prisma generate

# View data in Prisma Studio
npx prisma studio
```

## Files Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema with 10 country models |
| `prisma/migrations/20251129000000_country_context/migration.sql` | Migration SQL |
| `prisma/seed.ts` | Main seed file (includes country seeding) |
| `src/seeds/countries.seed.ts` | Country-specific seed data |
| `src/types/country.types.ts` | TypeScript type definitions |
| `OP-020_COUNTRY_CONTEXT_IMPLEMENTATION.md` | Full implementation report |

## API Endpoint Examples (To Be Implemented)

```typescript
// GET /api/v1/countries
// GET /api/v1/countries/:code
// GET /api/v1/countries/:code/regions
// GET /api/v1/countries/:code/vat-rates
// GET /api/v1/countries/:code/deduction-categories
// GET /api/v1/countries/:code/employment-types
// GET /api/v1/countries/:code/features
```

## Next Steps for Development

1. **Backend (FORGE)**: Create `CountryService` and REST endpoints
2. **Frontend (PRISM)**: Build country selection and region components
3. **Integration (BRIDGE)**: Connect to ELSTER, FinanzOnline APIs
4. **Testing (VERIFY)**: Write integration tests for country queries

## Support

For questions or issues:
- Review: `OP-020_COUNTRY_CONTEXT_IMPLEMENTATION.md`
- Check: Prisma schema comments
- Test: Use Prisma Studio to explore data

---

**Last Updated:** 2025-11-29
**Agent:** VAULT (Database Agent)
