# SV-Meldung Integration Module

German Social Security Reporting Integration for Operate/CoachOS.

## Overview

This module implements the German **Sozialversicherungsmeldungen** (SV-Meldung) integration, enabling automated social security reporting in compliance with DEÜV (Datenaustausch der Rentenversicherung) standards.

## Features

### Core Functionality

- **Anmeldung (Registration)**: Register new employees with social security
- **Abmeldung (Deregistration)**: Notify social security of employment termination
- **Änderung (Changes)**: Report employment changes (salary, contribution groups, carrier changes)
- **DEÜV Message Generation**: Create compliant DEÜV format messages
- **Validation**: Comprehensive validation of German identifiers and business rules
- **Caching**: Redis-based caching of submissions for tracking and audit

### DEÜV Support

Implements DEÜV message format version 8.1:
- **VOSZ**: Header records
- **DSME**: Core registration/notification records
- **DSKK**: Health insurance carrier records
- **DSRV**: Pension insurance records (placeholder)
- **NCSZ**: Footer records

## Installation

The module is already integrated into the NestJS application structure. No additional installation required.

## Configuration

Set the following environment variables:

```env
# SV-Meldung Configuration
SV_ABSENDER=YOUR_SENDER_ID
SV_BETRIEBSNUMMER=12345678
COMPANY_NAME=Your Company GmbH
SV_TEST_MODE=true

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## API Endpoints

### 1. Create Anmeldung (Employee Registration)

```http
POST /integrations/sv-meldung/anmeldung
Content-Type: application/json
Authorization: Bearer <token>

{
  "employeeId": "emp_123456",
  "betriebsnummer": "12345678",
  "versicherungsnummer": "12345678A901",
  "nachname": "Müller",
  "vorname": "Hans",
  "geburtsdatum": "1990-01-15",
  "geschlecht": "M",
  "staatsangehoerigkeit": "DEU",
  "anschrift": {
    "strasse": "Hauptstrasse",
    "hausnummer": "10",
    "plz": "10115",
    "ort": "Berlin"
  },
  "beschaeftigungBeginn": "2024-01-01",
  "beitragsgruppen": {
    "kv": "1",
    "rv": "1",
    "av": "1",
    "pv": "1"
  },
  "entgelt": 3500,
  "personengruppe": "101",
  "krankenkasseIk": "108018347",
  "krankenkasseName": "AOK"
}
```

### 2. Create Abmeldung (Employee Deregistration)

```http
POST /integrations/sv-meldung/abmeldung
Content-Type: application/json

{
  "employeeId": "emp_123456",
  "betriebsnummer": "12345678",
  "versicherungsnummer": "12345678A901",
  "nachname": "Müller",
  "vorname": "Hans",
  "geburtsdatum": "1990-01-15",
  "beschaeftigungEnde": "2024-12-31"
}
```

### 3. Create Änderung (Change Notification)

```http
POST /integrations/sv-meldung/aenderung
Content-Type: application/json

{
  "employeeId": "emp_123456",
  "betriebsnummer": "12345678",
  "versicherungsnummer": "12345678A901",
  "nachname": "Müller",
  "vorname": "Hans",
  "geburtsdatum": "1990-01-15",
  "aenderungsdatum": "2024-06-01",
  "aenderungType": "ENTGELT",
  "neuesEntgelt": 4000
}
```

### 4. Preview DEÜV Message

```http
POST /integrations/sv-meldung/preview/anmeldung
Content-Type: application/json

{
  // Same payload as Anmeldung
}
```

### 5. Get Submission Status

```http
GET /integrations/sv-meldung/submission/{submissionId}
```

### 6. Get Employee Submissions

```http
GET /integrations/sv-meldung/employee/{employeeId}/submissions
```

## German Identifiers & Validation

### Betriebsnummer (Employer ID)
- **Format**: 8 digits with checksum
- **Example**: `12345678`
- **Validation**: Checksum algorithm, test numbers (99xxxxxx)

### Versicherungsnummer (Insurance Number)
- **Format**: BBTTMMJJFNNN (12 characters)
  - BB: Bereichsnummer (02-99)
  - TTMMJJ: Birth date
  - F: First letter of birth name (excl. I, O, Q)
  - NNN: Serial number + checksum
- **Example**: `12345678A901`

### IK - Institutionskennzeichen (Carrier ID)
- **Format**: 9 digits with checksum
- **Example**: `108018347` (AOK)

### Beitragsgruppen (Contribution Groups)
- **KV** (Krankenversicherung): 0-6
- **RV** (Rentenversicherung): 0-9
- **AV** (Arbeitslosenversicherung): 0-2
- **PV** (Pflegeversicherung): 0-2

### Personengruppe (Person Group)
- **Range**: 101-190
- **Common values**:
  - 101: Voll versicherungspflichtig (fully insured)
  - 109: Geringfügig Beschäftigte (Minijob)
  - 110: Auszubildende (trainees)

## Health Insurance Carriers

Supported carriers (predefined):

| Carrier | IK | VKNR |
|---------|----------|------|
| AOK | 108018347 | 0100 |
| Techniker Krankenkasse | 108310400 | 8301 |
| BARMER | 108416214 | 8416 |
| DAK | 108312448 | 8312 |
| KKH | 108590422 | 8590 |

## DEÜV Message Structure

Example DEÜV message (simplified):

```
VOSZ8.1 TEST-ABSENDER  151120241030T
DSME12345678123456789A901MUELLER                      HANS                          15011990MDEU...
DSKK12345678108018347AOK - DIE GESUNDHEITSKASSE                     0100
NCSZ00000002
```

## Business Rules

### Minijob (Geringfügig Beschäftigte)
- Personengruppe: 109
- Entgelt: ≤ 538 EUR/month (2024)
- KV: typically 5 or 6

### Contribution Ceilings (BBG) 2024
- **Pension Insurance**: 7,550 EUR/month (West)
- **Health Insurance**: 5,175 EUR/month

### Abgabegrund (Reason Codes)
- **10**: Employment start
- **13**: Minijob start
- **30**: Employment end
- **34**: Minijob end
- **40**: Interruption
- **50**: General change
- **51**: Contribution group change
- **52**: Salary change

## Usage Examples

### TypeScript/NestJS

```typescript
import { SvMeldungService } from './sv-meldung.service';
import { SvAnmeldungDto } from './dto/sv-anmeldung.dto';

@Injectable()
export class HrService {
  constructor(private svMeldungService: SvMeldungService) {}

  async registerEmployee(employee: Employee) {
    const anmeldung: SvAnmeldungDto = {
      employeeId: employee.id,
      betriebsnummer: '12345678',
      versicherungsnummer: employee.socialSecurityNumber,
      nachname: employee.lastName,
      vorname: employee.firstName,
      geburtsdatum: employee.dateOfBirth,
      geschlecht: employee.gender,
      staatsangehoerigkeit: 'DEU',
      anschrift: employee.address,
      beschaeftigungBeginn: employee.startDate,
      beitragsgruppen: {
        kv: '1', rv: '1', av: '1', pv: '1'
      },
      entgelt: employee.monthlySalary,
      personengruppe: '101',
      krankenkasseIk: employee.healthCarrier.ik,
    };

    const response = await this.svMeldungService.createAnmeldung(anmeldung);
    console.log('Submission ID:', response.submissionId);
    console.log('Status:', response.status);
  }
}
```

## Testing

Run unit tests:

```bash
npm test sv-meldung.service.spec.ts
```

Test coverage includes:
- Anmeldung creation and validation
- Abmeldung creation
- Änderung creation
- DEÜV message generation
- Identifier validation
- Submission tracking

## Error Handling

The module throws descriptive errors for:
- Invalid Betriebsnummer format or checksum
- Invalid Versicherungsnummer format
- Invalid IK checksum
- Invalid Beitragsgruppen values
- Invalid Personengruppe range
- Missing required fields

Example error response:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Betriebsnummer must be exactly 8 digits",
    "Invalid Versicherungsnummer checksum"
  ]
}
```

## Compliance & Security

- **Data Encryption**: Personal data encrypted at rest (via Redis)
- **Audit Trail**: All submissions logged (without PII)
- **Validation**: Comprehensive German ID validation
- **DEÜV Standard**: Compliant with DEÜV v8.1
- **GoBD**: Archival for 10 years (configurable)

## Roadmap

- [ ] Electronic submission via carrier APIs
- [ ] DSRV (pension) record support
- [ ] Batch processing for multiple employees
- [ ] Real carrier response parsing
- [ ] ELSTER integration (if applicable)
- [ ] Web interface for manual submissions
- [ ] PDF export of submissions

## References

- [DEÜV Specification](https://www.gkv-datenaustausch.de/)
- [Deutsche Rentenversicherung](https://www.deutsche-rentenversicherung.de/)
- [GKV-Spitzenverband](https://www.gkv-spitzenverband.de/)

## Support

For issues or questions, contact the Operate/CoachOS development team.

## License

Proprietary - Operate/CoachOS
