# SKR Account Mapping - Quick Reference Guide

## Common Account Numbers

### SKR03 vs SKR04 - Side by Side

| Account Type | SKR03 | SKR04 | Description |
|--------------|-------|-------|-------------|
| **Cash** | 1000 | 1600 | Kasse |
| **Bank** | 1200 | 1800 | Bank |
| **Receivables** | 1400 | 1200 | Forderungen L+L |
| **Payables** | 1600 | 3300 | Verbindlichkeiten L+L |
| **VAT Payable** | 1780 | 1770 | Umsatzsteuer |
| **VAT Payable 19%** | 1781 | 1771 | Umsatzsteuer 19% |
| **VAT Payable 7%** | 1776 | 1776 | Umsatzsteuer 7% |
| **Input VAT** | 1570 | 1570 | Abziehbare Vorsteuer |
| **Revenue** | 8000 | 4000 | Erlöse |
| **Revenue 19%** | 8100 | 4100 | Erlöse 19% USt |
| **Revenue 7%** | 8300 | 4300 | Erlöse 7% USt |
| **Revenue Tax-Free** | 8400 | 4400 | Erlöse steuerfrei |
| **Service Revenue 19%** | 8500 | 4500 | Dienstleistungen 19% USt |
| **COGS** | 4400 | 5400 | Wareneinkauf |
| **Salaries** | 4120 | 6000 | Löhne und Gehälter |
| **Rent** | 4210 | 6210 | Miete |
| **Electricity** | 4240 | 6240 | Strom |
| **Telecommunications** | 4300 | 6300 | Telekommunikation |
| **Vehicle Costs** | 4500 | 6500 | KFZ-Kosten |
| **Fuel** | 4530 | 6530 | Treibstoff |
| **Advertising** | 4600 | 6600 | Werbekosten |
| **Insurance** | 4700 | 6700 | Versicherungen |
| **Legal/Consulting** | 4710 | 6710 | Rechts- und Beratungskosten |
| **Depreciation** | 4760 | 6760 | Abschreibungen |

## Tax Keys (BU-Schlüssel)

### Output Tax (Sales/Revenue)
| Key | VAT Rate | Description |
|-----|----------|-------------|
| 3 | 19% | Standard rate |
| 2 | 7% | Reduced rate |
| 8 | 0% | Tax-free |
| 9 | 0% | Intra-EU supply |
| 10 | 0% | Export |

### Input Tax (Purchases/Expenses)
| Key | VAT Rate | Description |
|-----|----------|-------------|
| 8 | 19% | Standard rate |
| 9 | 7% | Reduced rate |
| 0 | 0% | No VAT |
| 70 | 0% | Intra-EU acquisition |
| 93 | 19% | Reverse charge |
| 94 | 7% | Reverse charge |

## Internal Account Codes

### Quick Mapping Table

| Internal Code | Description | SKR03 | SKR04 |
|---------------|-------------|-------|-------|
| CASH | Cash register | 1000 | 1600 |
| BANK | Bank account | 1200 | 1800 |
| BANK_EUR | Bank EUR | 1240 | 1840 |
| RECEIVABLES | Trade receivables | 1400 | 1200 |
| RECEIVABLES_EU | EU receivables | 1406 | 1205 |
| INVENTORY | Merchandise | 1580 | 3300 |
| PAYABLES | Trade payables | 1600 | 3300 |
| PAYABLES_EU | EU payables | 1610 | 3310 |
| VAT_PAYABLE | VAT payable | 1780 | 1770 |
| VAT_PAYABLE_19 | VAT 19% payable | 1781 | 1771 |
| VAT_PAYABLE_7 | VAT 7% payable | 1776 | 1776 |
| INPUT_VAT | Input VAT | 1570 | 1570 |
| REVENUE | Revenue | 8000 | 4000 |
| REVENUE_19 | Revenue 19% | 8100 | 4100 |
| REVENUE_7 | Revenue 7% | 8300 | 4300 |
| REVENUE_TAX_FREE | Tax-free revenue | 8400 | 4400 |
| REVENUE_EU | EU supply | 8338 | 4338 |
| SERVICE_REVENUE_19 | Service 19% | 8500 | 4500 |
| COGS | Cost of goods | 4400 | 5400 |
| SALARIES | Wages/salaries | 4120 | 6000 |
| RENT | Rent | 4210 | 6210 |
| ELECTRICITY | Electricity | 4240 | 6240 |
| VEHICLE_COSTS | Vehicle costs | 4500 | 6500 |
| FUEL | Fuel | 4530 | 6530 |
| ADVERTISING | Advertising | 4600 | 6600 |
| INSURANCE | Insurance | 4700 | 6700 |

## Code Snippets

### Map Internal Code to SKR Account

```typescript
// SKR03
const account = skrMapping.mapToSKR03('CASH');
// Returns: '1000'

// SKR04
const account = skrMapping.mapToSKR04('CASH');
// Returns: '1600'
```

### Get Tax Key

```typescript
// For sales
const taxKey = skrMapping.getTaxKey(19, 'output');
// Returns: '3'

// For purchases
const taxKey = skrMapping.getTaxKey(19, 'input');
// Returns: '8'
```

### Suggest Account

```typescript
const suggestion = skrMapping.suggestAccount('Miete', SKRType.SKR03);
// Returns: { accountNumber: '4210', accountName: 'Miete', confidence: 0.95 }
```

### Get Account Name

```typescript
const name = skrMapping.getAccountName(SKRType.SKR03, '1000');
// Returns: 'Kasse'
```

## Account Ranges

### SKR03 Structure
```
0000-0999  Reserved
1000-1999  Assets
2000-2999  Liabilities & Equity
3000-3999  Reserved
4000-4999  Expenses
5000-7999  Reserved
8000-8999  Revenue
```

### SKR04 Structure
```
0000-0999  Liabilities & Equity
1000-1999  Assets (Receivables, Cash, Bank)
2000-2999  Assets (continued)
3000-3999  Assets (Inventory, Payables)
4000-4999  Revenue
5000-5999  Expenses
6000-6999  Expenses (continued)
```

## Common Transaction Mappings

### Sales Invoice (19% VAT)
```
Debit:  1400 (SKR03) / 1200 (SKR04) - Receivables
Credit: 8100 (SKR03) / 4100 (SKR04) - Revenue 19%
Tax Key: 3
```

### Purchase Invoice (19% VAT)
```
Debit:  4400 (SKR03) / 5400 (SKR04) - COGS
Credit: 1600 (SKR03) / 3300 (SKR04) - Payables
Tax Key: 8
```

### Salary Payment
```
Debit:  4120 (SKR03) / 6000 (SKR04) - Salaries
Credit: 1200 (SKR03) / 1800 (SKR04) - Bank
```

### Rent Payment
```
Debit:  4210 (SKR03) / 6210 (SKR04) - Rent
Credit: 1200 (SKR03) / 1800 (SKR04) - Bank
```

## Keyword Detection

### Account Suggestion Keywords

| Account Type | Keywords |
|--------------|----------|
| Cash | kasse, bargeld, cash |
| Bank | bank, giro, konto |
| Receivables | forderung, debitor, receivable, kunde |
| Payables | verbindlich, kreditor, payable, lieferant |
| Revenue | erlös, umsatz, revenue, verkauf, einnahme |
| Expenses | aufwand, kosten, expense, ausgabe |
| Salary | lohn, gehalt, salary, personal |
| Rent | miete, rent |
| Vehicle | kfz, auto, fahrzeug, vehicle, treibstoff |
| Advertising | werbung, marketing, advertising |
| Insurance | versicherung, insurance |

## Category Enum Values

```typescript
enum AccountCategory {
  ASSETS = 'assets',
  LIABILITIES = 'liabilities',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSES = 'expenses'
}

enum AccountSubcategory {
  CASH = 'cash',
  BANK = 'bank',
  RECEIVABLES = 'receivables',
  PAYABLES = 'payables',
  INVENTORY = 'inventory',
  PERSONNEL_COSTS = 'personnel_costs',
  OFFICE_COSTS = 'office_costs',
  VEHICLE_COSTS = 'vehicle_costs',
  MARKETING_COSTS = 'marketing_costs',
  SALES_REVENUE = 'sales_revenue',
  SERVICE_REVENUE = 'service_revenue',
  // ... more
}
```

## Common Use Cases

### 1. Export Invoice to DATEV
```typescript
const receivablesAccount = skrMapping.mapToSKR03('RECEIVABLES');
const revenueAccount = skrMapping.mapToSKR03('REVENUE_19');
const taxKey = skrMapping.getTaxKey(19, 'output');
```

### 2. Classify Transaction
```typescript
const suggestion = skrMapping.suggestAccount(
  transaction.description,
  SKRType.SKR03
);
if (suggestion && suggestion.confidence > 0.8) {
  accountNumber = suggestion.accountNumber;
}
```

### 3. Get All Revenue Accounts
```typescript
const accounts = skrMapping.getAccountsByCategory(
  AccountCategory.REVENUE,
  SKRType.SKR03
);
```

### 4. Validate Account Number
```typescript
const accountName = skrMapping.getAccountName(
  SKRType.SKR03,
  accountNumber
);
if (!accountName) {
  throw new Error('Invalid account number');
}
```

## Tips

1. **Always use the mapping service** instead of hardcoded account numbers
2. **Check confidence score** when using account suggestions (> 0.8 recommended)
3. **Use internal codes** for flexibility (easy to change mappings)
4. **Test with both SKR03 and SKR04** if supporting multiple company types
5. **Validate tax keys** before export to ensure DATEV compliance
6. **Log mapping decisions** for audit trail and debugging

## Support

For questions or issues:
1. Check the comprehensive README.md
2. Review INTEGRATION_EXAMPLE.md for code examples
3. Consult DATEV documentation for account number verification
4. Contact tax advisor for account classification questions
