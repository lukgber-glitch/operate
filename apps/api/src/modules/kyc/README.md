# KYC Verification Module

Comprehensive Know Your Customer (KYC) verification system for Operate/CoachOS.

## Overview

The KYC module provides a unified verification system that orchestrates identity verification across multiple providers (Persona, internal) with automated decision-making, manual review workflows, and comprehensive reporting.

## Features

- **Multi-Level Verification**
  - Basic: Government ID + Selfie
  - Enhanced: Basic + Address + Database checks
  - Full: Enhanced + Sanctions + PEP checks

- **Multi-Provider Support**
  - Persona (primary provider)
  - Internal verification (future)
  - Extensible for additional providers

- **Automated Decision Engine**
  - Risk-based scoring (0-100)
  - Rule-based automation
  - Auto-approve low-risk verifications
  - Auto-escalate high-risk cases

- **Manual Review Workflow**
  - Review queue management
  - Decision history tracking
  - Audit trail for compliance

- **Country-Specific Requirements**
  - Configurable per country/customer type
  - Document type specifications
  - Compliance-friendly

- **Re-Verification Scheduling**
  - Annual expiry (configurable)
  - Expiration warnings
  - Automated re-verification triggers

- **Comprehensive Reporting**
  - Statistics dashboard
  - Trend analysis
  - Risk distribution
  - Performance metrics

## Architecture

```
kyc/
├── kyc.module.ts              # NestJS module
├── kyc.service.ts             # Main facade service
├── kyc.controller.ts          # REST API endpoints
├── services/
│   ├── kyc-verification.service.ts   # Verification orchestration
│   ├── kyc-decision.service.ts       # Decision engine
│   ├── kyc-workflow.service.ts       # Workflow management
│   └── kyc-reporting.service.ts      # Analytics & reporting
├── dto/
│   ├── start-verification.dto.ts
│   ├── verification-status.dto.ts
│   ├── kyc-decision.dto.ts
│   └── kyc-report.dto.ts
└── types/
    └── kyc.types.ts           # TypeScript types
```

## Database Schema

### KycVerification
Main verification records with status, risk scores, and provider references.

### KycDecision
Audit trail of all decisions (automated and manual) made on verifications.

### KycRequirement
Country and customer-type specific requirements.

## Usage

### Starting a Verification

```typescript
POST /kyc/start
{
  "userId": "user-123",
  "organisationId": "org-456",
  "level": "enhanced",
  "provider": "persona"
}
```

### Getting Status

```typescript
GET /kyc/status/:userId
```

### Making a Decision

```typescript
POST /kyc/decision
{
  "verificationId": "verification-789",
  "decision": "approve",
  "reason": "All checks passed"
}
```

### Getting Statistics

```typescript
GET /kyc/reports/statistics?organisationId=org-456
```

## Risk Scoring

- **0-25 (Low)**: Auto-approve eligible
- **25-50 (Medium)**: Manual review recommended
- **50-75 (High)**: Manual review required
- **75-100 (Critical)**: Auto-reject or escalate

## Workflow States

1. `not_started` - Verification not initiated
2. `pending` - User completing verification
3. `in_review` - Pending manual review
4. `approved` - Verification approved
5. `rejected` - Verification rejected
6. `expired` - Verification expired (needs renewal)

## Decision Types

- `approve` - Approve verification
- `reject` - Reject verification
- `request_info` - Request additional information
- `escalate` - Escalate for higher-level review

## Integration with Persona

The module integrates with Persona (W23-T1) for identity verification:

1. Creates Persona inquiry when verification starts
2. Receives webhook events from Persona
3. Syncs verification results
4. Maps Persona status to KYC status
5. Calculates risk scores from verification checks

## Automation Rules

The system includes built-in automation rules:

```typescript
{
  name: 'Auto-approve low risk',
  condition: { riskScore: { max: 25 }, allChecksPassed: true },
  action: { decision: 'approve' }
}

{
  name: 'Auto-reject critical risk',
  condition: { riskScore: { min: 75 } },
  action: { decision: 'reject' }
}

{
  name: 'Escalate high risk',
  condition: { riskScore: { min: 50, max: 75 } },
  action: { decision: 'escalate', assignToReviewer: true }
}
```

## Country Requirements

Example requirements for Germany (DE):

```typescript
{
  countryCode: 'DE',
  customerType: 'individual',
  requirementType: 'government_id',
  isRequired: true,
  acceptedDocs: ['passport', 'drivers_license', 'national_id']
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kyc/start` | Start verification |
| GET | `/kyc/status/:userId` | Get status |
| GET | `/kyc/requirements/:country/:type` | Get requirements |
| POST | `/kyc/decision` | Make decision |
| GET | `/kyc/pending-review` | Get review queue |
| GET | `/kyc/reports/statistics` | Get statistics |
| GET | `/kyc/reports/trend` | Get trend data |
| GET | `/kyc/reports/risk-distribution` | Get risk distribution |
| GET | `/kyc/decisions/:verificationId` | Get decision history |
| GET | `/kyc/health` | Health check |

## Environment Variables

```bash
# Persona Configuration (from PersonaModule)
PERSONA_API_KEY=your_api_key
PERSONA_WEBHOOK_SECRET=your_webhook_secret
PERSONA_ENVIRONMENT=sandbox  # or production

# Persona Template IDs
PERSONA_TEMPLATE_BASIC=itmpl_basic_id
PERSONA_TEMPLATE_ENHANCED=itmpl_enhanced_id
PERSONA_TEMPLATE_FULL=itmpl_full_id
```

## Compliance

The module is designed with compliance in mind:

- Complete audit trail of all decisions
- Configurable retention policies
- GDPR-friendly data handling
- Webhook event logging
- Manual override capability
- Decision reasoning required

## Future Enhancements

- [ ] Additional verification providers
- [ ] Machine learning risk models
- [ ] Biometric verification
- [ ] Video interview capability
- [ ] Document OCR and validation
- [ ] Real-time fraud detection
- [ ] Geographic risk analysis
- [ ] Velocity checks

## Testing

```bash
# Unit tests
npm run test kyc

# Integration tests
npm run test:e2e kyc

# Coverage
npm run test:cov kyc
```

## Dependencies

- **PersonaModule**: Identity verification provider
- **DatabaseModule**: Prisma database access
- **ConfigModule**: Environment configuration
- **NestJS**: Framework core

## Related Modules

- `persona` - Persona integration (W23-T1)
- `aml` - AML screening integration
- `gdpr` - Data privacy compliance
- `comply-advantage` - Compliance screening

## Support

For issues or questions:
- Check the code documentation
- Review Persona integration docs
- See CLAUDE.md for project overview
