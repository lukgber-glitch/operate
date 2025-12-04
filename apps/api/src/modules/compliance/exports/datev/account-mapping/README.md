# SKR Account Mapping Service

Comprehensive mapping service for German standard chart of accounts (Kontenrahmen) SKR03 and SKR04.

## Overview

This module provides:
- Complete SKR03 and SKR04 account definitions
- Mapping between internal account codes and German standard accounts
- Tax key (BU-Schlüssel) mapping for German VAT rates
- Intelligent account suggestion based on transaction descriptions
- Account categorization and classification

## SKR Types

### SKR03 - Industrial Companies
- **Range**: 0000-9999
- **Structure**:
  - 0-1: Assets (Aktiva)
  - 2-3: Liabilities & Equity (Passiva)
  - 4: Expenses (Aufwendungen)
  - 8-9: Revenue (Erlöse)
- **Use case**: Manufacturing, trading companies

### SKR04 - Service Providers
- **Range**: 0000-9999
- **Structure**:
  - 0-1: Liabilities & Equity (Passiva)
  - 2-3: Assets (Aktiva)
  - 4: Revenue (Erlöse)
  - 5: Expenses (Aufwendungen)
- **Use case**: Service companies, consultants

## Key Accounts

### SKR03 Common Accounts
```
1000 - Kasse (Cash)
1200 - Bank
1400 - Forderungen (Receivables)
1600 - Verbindlichkeiten (Payables)
1780 - Umsatzsteuer (VAT Payable)
4000-4999 - Aufwendungen (Expenses)
8000-8999 - Erlöse (Revenue)
```

### SKR04 Common Accounts
```
1600 - Kasse (Cash)
1800 - Bank
1200 - Forderungen (Receivables)
3300 - Verbindlichkeiten (Payables)
1770 - Umsatzsteuer (VAT Payable)
5000-5999 - Aufwendungen (Expenses)
4000-4999 - Erlöse (Revenue)
```

## Tax Keys (BU-Schlüssel)

German VAT rates mapped to DATEV tax keys:

### Output Tax (Sales)
- **Key 3**: 19% Umsatzsteuer (Standard rate)
- **Key 2**: 7% Umsatzsteuer (Reduced rate)
- **Key 8**: Steuerfrei (Tax-free)
- **Key 9**: Innergemeinschaftliche Lieferung (Intra-EU supply)
- **Key 10**: Ausfuhrlieferung (Export)

### Input Tax (Purchases)
- **Key 8**: 19% Vorsteuer (Standard rate input)
- **Key 9**: 7% Vorsteuer (Reduced rate input)
- **Key 70**: Innergemeinschaftlicher Erwerb (Intra-EU acquisition)
- **Key 93**: Reverse Charge 19%
- **Key 94**: Reverse Charge 7%

## Usage

### Import the Service

```typescript
import { SKRMappingService } from './account-mapping';
```

### Map Internal Code to SKR Account

```typescript
// Map to SKR03
const skr03Account = skrMappingService.mapToSKR03('CASH');
// Returns: '1000'

// Map to SKR04
const skr04Account = skrMappingService.mapToSKR04('CASH');
// Returns: '1600'
```

### Get Account Name

```typescript
const accountName = skrMappingService.getAccountName(
  SKRType.SKR03,
  '1000'
);
// Returns: 'Kasse'
```

### Get Tax Key

```typescript
// For sales with 19% VAT
const taxKey = skrMappingService.getTaxKey(19, 'output');
// Returns: '3'

// For purchases with 19% VAT
const inputTaxKey = skrMappingService.getTaxKey(19, 'input');
// Returns: '8'
```

### Suggest Account from Description

```typescript
const suggestion = skrMappingService.suggestAccount(
  'Miete für Büroräume',
  SKRType.SKR03
);
// Returns:
// {
//   accountNumber: '4210',
//   accountName: 'Miete',
//   confidence: 0.95,
//   reason: 'Rent-related keywords detected'
// }
```

### Get Accounts by Category

```typescript
const revenueAccounts = skrMappingService.getAccountsByCategory(
  AccountCategory.REVENUE,
  SKRType.SKR03
);
// Returns: ['8000', '8100', '8300', '8400', ...]
```

### Get Default Account for Transaction Category

```typescript
const defaultAccount = skrMappingService.getDefaultAccountForCategory(
  'sales',
  SKRType.SKR03
);
// Returns: '8100'
```

## Account Categories

The mapping service supports the following account categories:

- **ASSETS**: Cash, bank, receivables, inventory, fixed assets
- **LIABILITIES**: Payables, debt, tax liabilities
- **EQUITY**: Capital, reserves, retained earnings
- **REVENUE**: Sales revenue, service revenue, other income
- **EXPENSES**: COGS, personnel, office, vehicle, marketing, other expenses

## Internal Account Codes

Standard internal account codes mapped to SKR accounts:

### Assets
- `CASH` → 1000 (SKR03) / 1600 (SKR04)
- `BANK` → 1200 (SKR03) / 1800 (SKR04)
- `RECEIVABLES` → 1400 (SKR03) / 1200 (SKR04)
- `INVENTORY` → 1580 (SKR03) / 3300 (SKR04)

### Liabilities
- `PAYABLES` → 1600 (SKR03) / 3300 (SKR04)
- `VAT_PAYABLE` → 1780 (SKR03) / 1770 (SKR04)
- `VAT_PAYABLE_19` → 1781 (SKR03) / 1771 (SKR04)
- `VAT_PAYABLE_7` → 1776 (SKR03) / 1776 (SKR04)

### Revenue
- `REVENUE` → 8000 (SKR03) / 4000 (SKR04)
- `REVENUE_19` → 8100 (SKR03) / 4100 (SKR04)
- `REVENUE_7` → 8300 (SKR03) / 4300 (SKR04)
- `REVENUE_TAX_FREE` → 8400 (SKR03) / 4400 (SKR04)
- `REVENUE_EU` → 8338 (SKR03) / 4338 (SKR04)
- `SERVICE_REVENUE_19` → 8500 (SKR03) / 4500 (SKR04)

### Expenses
- `COGS` → 4400 (SKR03) / 5400 (SKR04)
- `SALARIES` → 4120 (SKR03) / 6000 (SKR04)
- `RENT` → 4210 (SKR03) / 6210 (SKR04)
- `ELECTRICITY` → 4240 (SKR03) / 6240 (SKR04)
- `VEHICLE_COSTS` → 4500 (SKR03) / 6500 (SKR04)
- `ADVERTISING` → 4600 (SKR03) / 6600 (SKR04)
- `INSURANCE` → 4700 (SKR03) / 6700 (SKR04)

## Integration with DATEV Export

The mapping service integrates seamlessly with the DATEV export service:

```typescript
import { SKRMappingService, SKRType } from './account-mapping';
import { DatevExportService } from './datev-export.service';

// In your export service
private determineAccountNumber(tx: Transaction, config: DatevConfig): string {
  const skrType = config.companyConfig.skrType;

  // Use mapping service to get correct account
  const accountCode = this.classifyTransaction(tx);

  if (skrType === SKRType.SKR03) {
    return this.skrMappingService.mapToSKR03(accountCode) || '1000';
  } else {
    return this.skrMappingService.mapToSKR04(accountCode) || '1600';
  }
}

private determineTaxKey(vatRate: number): string {
  return this.skrMappingService.getTaxKey(vatRate, 'output');
}
```

## Files

- **skr-mapping.service.ts** - Main mapping service with all business logic
- **skr03-accounts.ts** - Complete SKR03 account definitions
- **skr04-accounts.ts** - Complete SKR04 account definitions
- **tax-key-mapping.ts** - German VAT tax key mappings
- **interfaces/skr-account.interface.ts** - TypeScript interfaces and enums

## Testing

Example test cases:

```typescript
describe('SKRMappingService', () => {
  it('should map CASH to correct SKR03 account', () => {
    expect(service.mapToSKR03('CASH')).toBe('1000');
  });

  it('should map CASH to correct SKR04 account', () => {
    expect(service.mapToSKR04('CASH')).toBe('1600');
  });

  it('should get correct tax key for 19% VAT', () => {
    expect(service.getTaxKey(19, 'output')).toBe('3');
  });

  it('should suggest rent account for rent description', () => {
    const suggestion = service.suggestAccount('Miete', SKRType.SKR03);
    expect(suggestion?.accountNumber).toBe('4210');
    expect(suggestion?.confidence).toBeGreaterThan(0.9);
  });
});
```

## References

- [DATEV Format Specification](https://developer.datev.de/)
- [SKR03 Documentation](https://www.datev.de/web/de/datev-shop/material/skr03/)
- [SKR04 Documentation](https://www.datev.de/web/de/datev-shop/material/skr04/)
- [German Tax Keys](https://www.datev.de/web/de/datev-shop/material/bu-schluessel/)

## Notes

- This implementation covers the most common accounts in SKR03/SKR04
- Additional accounts can be easily added to the account lists
- The suggestion algorithm uses simple keyword matching and can be enhanced with ML
- Always validate account mappings with your tax advisor
- Tax keys are subject to change based on German tax law updates
