# Tax Context Service

The `TaxContextService` provides country-aware tax context from organisation data. It automatically detects the user's country from onboarding/organisation data and provides country-specific tax guidance.

## Features

- **Country Detection**: Automatically retrieves country from organisation data
- **Tax Authority Mapping**: Maps country codes to tax authorities (e.g., DE → ELSTER, UK → HMRC)
- **VAT Registration Status**: Checks if organisation is VAT registered
- **Filing Frequency**: Returns typical VAT filing frequency per country
- **Tax Year Start**: Returns tax year start month per country
- **Multiple Tax IDs**: Supports various country-specific tax identifiers

## Usage

### Basic Setup

1. **Import the service in your module**:

```typescript
import { TaxContextService } from '../shared/tax-context.service';

@Module({
  providers: [YourService, TaxContextService],
})
export class YourModule {}
```

2. **Inject in your service**:

```typescript
import { TaxContextService } from '../shared/tax-context.service';

@Injectable()
export class YourService {
  constructor(private readonly taxContext: TaxContextService) {}
}
```

### Get Tax Context

```typescript
async getOrganisationTaxInfo(orgId: string) {
  const context = await this.taxContext.getTaxContext(orgId);

  console.log(context);
  // {
  //   country: 'DE',
  //   vatNumber: 'DE123456789',
  //   vatScheme: 'STANDARD',
  //   vatRegistered: true,
  //   taxAuthority: 'ELSTER (Finanzamt)',
  //   taxAuthorityUrl: 'https://www.elster.de',
  //   currency: 'EUR',
  //   timezone: 'Europe/Berlin',
  //   companyType: 'LIMITED_COMPANY',
  //   taxRegistrationNumber: null,
  //   utrNumber: null,
  //   payeReference: null,
  //   commercialRegistration: null,
  //   tradeLicenseNumber: null
  // }
}
```

### Check VAT Registration

```typescript
async checkVatStatus(orgId: string) {
  const isRegistered = await this.taxContext.isVatRegistered(orgId);

  if (!isRegistered) {
    throw new BadRequestException('VAT registration required');
  }
}
```

### Get Country-Specific Information

```typescript
async getFilingGuidance(orgId: string) {
  const context = await this.taxContext.getTaxContext(orgId);

  const frequency = this.taxContext.getVatFilingFrequency(context.country);
  const taxYearStart = this.taxContext.getTaxYearStartMonth(context.country);

  return {
    country: context.country,
    taxAuthority: context.taxAuthority,
    taxAuthorityUrl: context.taxAuthorityUrl,
    filingFrequency: frequency,
    taxYearStartMonth: taxYearStart,
  };
}
```

## Supported Countries

### DACH Region
- **DE** (Germany): ELSTER (Finanzamt)
- **AT** (Austria): FinanzOnline
- **CH** (Switzerland): ESTV

### Western Europe
- **FR** (France): DGFiP
- **NL** (Netherlands): Belastingdienst
- **BE** (Belgium): MyMinfin

### Northern Europe
- **UK/GB** (United Kingdom): HMRC
- **IE** (Ireland): Revenue Commissioners
- **SE** (Sweden): Skatteverket
- **DK** (Denmark): Skattestyrelsen

### Southern Europe
- **IT** (Italy): Agenzia delle Entrate
- **ES** (Spain): Agencia Tributaria
- **PT** (Portugal): AT

### North America
- **US**: IRS
- **CA** (Canada): CRA

### Asia-Pacific
- **AU** (Australia): ATO
- **NZ** (New Zealand): Inland Revenue
- **SG** (Singapore): IRAS
- **HK** (Hong Kong): IRD

### Middle East
- **AE** (UAE): FTA
- **SA** (Saudi Arabia): ZATCA

## Tax Context Interface

```typescript
interface TaxContext {
  country: string;                      // ISO 2-letter country code
  vatNumber: string | null;             // VAT registration number
  vatScheme: string | null;             // VAT scheme (STANDARD, FLAT_RATE, etc.)
  vatRegistered: boolean;               // Whether org is VAT registered
  taxAuthority: string | null;          // Tax authority name
  taxAuthorityUrl: string | null;       // Tax authority website
  currency: string;                     // Organisation currency
  timezone: string;                     // Organisation timezone
  companyType: string | null;           // Company type/legal structure
  taxRegistrationNumber: string | null; // General tax ID (for UAE, Saudi, etc.)
  utrNumber: string | null;             // UK UTR number
  payeReference: string | null;         // UK PAYE reference
  commercialRegistration: string | null;// Saudi commercial registration
  tradeLicenseNumber: string | null;    // UAE trade license
}
```

## Example: VAT Service Integration

```typescript
import { Injectable } from '@nestjs/common';
import { TaxContextService } from '../shared/tax-context.service';

@Injectable()
export class VatService {
  constructor(private readonly taxContext: TaxContextService) {}

  async getVatContext(orgId: string) {
    const context = await this.taxContext.getTaxContext(orgId);

    return {
      country: context.country,
      vatRegistered: context.vatRegistered,
      vatNumber: context.vatNumber,
      taxAuthority: context.taxAuthority,
      taxAuthorityUrl: context.taxAuthorityUrl,
      filingFrequency: this.taxContext.getVatFilingFrequency(context.country),
      taxYearStartMonth: this.taxContext.getTaxYearStartMonth(context.country),
    };
  }
}
```

## API Endpoint Example

```typescript
@Get('tax/context')
async getTaxContext(@CurrentUser() user: { orgId: string }) {
  const context = await this.taxContext.getTaxContext(user.orgId);

  return {
    success: true,
    data: context,
  };
}
```

## Error Handling

The service throws an error if the organisation is not found:

```typescript
try {
  const context = await this.taxContext.getTaxContext(orgId);
} catch (error) {
  // Handle error: Organisation not found
}
```

## Adding New Countries

To add support for a new country:

1. Add tax authority name to `getTaxAuthorityForCountry()`
2. Add tax authority URL to `getTaxAuthorityUrlForCountry()`
3. Add filing frequency to `getVatFilingFrequency()`
4. Add tax year start month to `getTaxYearStartMonth()`

## Notes

- Country codes should follow ISO 3166-1 alpha-2 standard
- VAT registration status is determined by presence of `vatNumber`
- Default values are provided when country is not in mapping (typically EU defaults)
- Service can be extended with additional country-specific methods as needed
