# Spain Tax Configuration - Quick Reference

## Task: W25-T2 - Spanish Tax Configuration (IVA)

---

## Tax Rates at a Glance

### IVA (Mainland Spain)
| Rate | Percentage | Category | Examples |
|------|------------|----------|----------|
| Standard | 21% | IVA General | Electronics, vehicles, services |
| Reduced | 10% | IVA Reducido | Food, transport, restaurants, books |
| Super-Reduced | 4% | IVA Superreducido | Bread, milk, eggs, medicines |
| Zero | 0% | Exports | Exports, intra-EU supplies |

### IGIC (Canary Islands Only)
| Rate | Percentage | Category | Examples |
|------|------------|----------|----------|
| Special | 15% | IGIC Especial | Luxury goods, premium tobacco/alcohol |
| Increased Reduced | 9.5% | IGIC Incrementado | Tobacco, alcohol |
| General | 7% | IGIC General | Standard goods/services |
| Reduced | 3% | IGIC Reducido | Food, transport, culture |
| Zero | 0% | Sin IGIC | Exports, essentials |

### Recargo de Equivalencia (Small Retailers)
| Surcharge | Base IVA | Total Tax |
|-----------|----------|-----------|
| 5.2% | + 21% | = 26.2% |
| 1.4% | + 10% | = 11.4% |
| 0.5% | + 4% | = 4.5% |

---

## Tax ID Formats

| Type | Format | Example | Usage |
|------|--------|---------|-------|
| **NIF** | 8 digits + letter | 12345678Z | Spanish individuals |
| **NIE** | X/Y/Z + 7 digits + letter | X1234567L | Foreign individuals |
| **CIF** | Letter + 7 digits + control | B12345678 | Companies |
| **VAT** | ES + NIF/CIF | ESB12345678 | EU VAT number |

---

## Filing Deadlines

### Quarterly (Modelo 303)
- **Q1:** April 1-20 (Jan-Mar)
- **Q2:** July 1-20 (Apr-Jun)
- **Q3:** October 1-20 (Jul-Sep)
- **Q4:** January 1-30 (Oct-Dec)

### Annual
- **Modelo 390:** January 1-30 (VAT summary)
- **Modelo 347:** February 1-28 (Operations >€3,005.06)

---

## Key Thresholds

| Threshold | Amount | Purpose |
|-----------|--------|---------|
| **Modelo 347** | €3,005.06 | Annual declaration required |
| **Intra-community** | €35,000 | Simplified reporting threshold |
| **VAT Registration** | €0 | All businesses must register |

---

## Common Tax Regimes

1. **REGIMEN_GENERAL** - Common regime (most businesses)
2. **REGIMEN_SIMPLIFICADO** - Simplified regime (módulos)
3. **RECARGO_EQUIVALENCIA** - Small retailers
4. **RECC** - Cash accounting
5. **IGIC** - Canary Islands

---

## Code Usage

### Import
```typescript
import {
  SPAIN_IVA_RATES,
  SPAIN_IGIC_RATES,
  isValidSpanishNIF,
  isValidSpanishCIF,
  SpainTaxConfig,
} from '@operate/shared';
```

### Get Tax Rate
```typescript
// Standard IVA
const rate = SpainTaxConfig.getIVARate('STANDARD');
// Returns: { rate: 21.0, category: 'STANDARD', type: 'IVA', ... }

// IGIC (Canary Islands)
const igicRate = SpainTaxConfig.getIGICRate('STANDARD');
// Returns: { rate: 7.0, category: 'STANDARD', type: 'IGIC', ... }

// Combined (IVA + RE)
const combined = SpainTaxConfig.getCombinedTaxRate(
  'STANDARD',
  undefined,
  'RECARGO_EQUIVALENCIA'
);
// Returns: { total: 26.2, breakdown: [...] }
```

### Validate Tax ID
```typescript
// NIF
isValidSpanishNIF('12345678Z'); // true/false

// CIF
isValidSpanishCIF('B12345678'); // true/false

// Any tax ID
isValidSpanishTaxId('12345678Z'); // true/false

// VAT number
isValidSpanishVATNumber('ESB12345678'); // true/false
```

### Format Tax ID
```typescript
formatSpanishTaxId('12345678Z');    // '12345678-Z'
formatSpanishTaxId('X1234567L');    // 'X-1234567-L'
formatSpanishTaxId('B12345678');    // 'B-12345678'
formatSpanishVATNumber('B12345678'); // 'ES-B12345678'
```

---

## Special Regions

### Canary Islands
- **Provinces:** Las Palmas, Santa Cruz de Tenerife
- **Tax System:** IGIC (not IVA)
- **Rates:** 0%, 3%, 7%, 9.5%, 15%

### Ceuta & Melilla
- Special tax treatment
- Lower rates apply

---

## Files Created

### Database
- `packages/database/prisma/seeds/spain-tax-config.seed.ts`

### Shared Package
- `packages/shared/src/constants/spain-tax.constants.ts`
- `packages/shared/src/utils/spain-tax.validator.ts`
- `packages/shared/src/utils/__tests__/spain-tax.validator.spec.ts`

### API Module
- `apps/api/src/modules/tax/spain/spain-tax.config.ts`
- `apps/api/src/modules/tax/spain/index.ts`

---

## Database Seed

```bash
npm run db:seed
```

This creates:
- Spain country (ES)
- Tax configuration
- All VAT rates (IVA, IGIC, RE)

---

## Testing

```bash
# Run validator tests
npm test spain-tax.validator.spec.ts
```

---

## Legal References

- **EU VAT Directive 2006/112/EC**
- **Ley 37/1992 del IVA** (Spanish VAT Law)
- **Ley 20/1991 del IGIC** (Canary Islands)

---

## Official Links

- **AEAT:** https://www.agenciatributaria.es
- **FACe Portal:** https://face.gob.es
- **FNMT Certificates:** https://www.sede.fnmt.gob.es/certificados

---

## Task Completion

✅ **All tax rates configured**
✅ **NIF/CIF validation implemented**
✅ **Database seed created**
✅ **Constants and validators**
✅ **API integration ready**
✅ **Unit tests included**

**Status:** COMPLETED | **Priority:** P0 | **Effort:** 1d
