# Compliance Module Dependencies

## Required NPM Packages

The GoBD Compliance Report Service requires the following additional packages:

### Production Dependencies

```bash
npm install archiver
```

### Development Dependencies

```bash
npm install --save-dev @types/archiver
```

## Installation

From the root of the monorepo:

```bash
cd apps/api
npm install archiver
npm install --save-dev @types/archiver
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "archiver": "^6.0.1"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.2"
  }
}
```

## Environment Variables

Add these to your `.env` file:

```bash
# Document Archive Encryption (32 bytes = 64 hex chars)
ARCHIVE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Archive storage directories
ARCHIVE_BASE_DIR=./archives
COMPLIANCE_EXPORT_DIR=./exports/compliance
```

## Generate Encryption Key

To generate a secure encryption key:

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Directory Setup

Create required directories:

```bash
mkdir -p archives
mkdir -p exports/compliance
```

## Verification

To verify the installation:

```typescript
import { GoBDComplianceReportService } from './modules/compliance/services';

// Service should be available via dependency injection
constructor(private readonly complianceReport: GoBDComplianceReportService) {}
```
