# Onboarding Module

Backend API endpoints for managing organization onboarding flow.

## Files Created

### DTOs (`dto/`)
- **complete-step.dto.ts** - DTO for completing onboarding steps with data payload
- **onboarding-progress.dto.ts** - Response DTO with progress details and step statuses
- **update-progress.dto.ts** - DTO for updating progress data
- **index.ts** - Exports all DTOs

### Core Files
- **onboarding.repository.ts** - Database access layer using Prisma
- **onboarding.service.ts** - Business logic for onboarding management
- **onboarding.controller.ts** - REST API endpoints
- **onboarding.module.ts** - NestJS module configuration
- **index.ts** - Module exports

## API Endpoints

All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`).

### `GET /onboarding/progress`
Get current onboarding state for authenticated user's organization.

**Response:**
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "userId": "uuid",
  "currentStep": 2,
  "totalSteps": 6,
  "completionPercentage": 33,
  "isCompleted": false,
  "completedStepsCount": 2,
  "skippedSteps": [],
  "steps": [
    {
      "name": "company_info",
      "status": "COMPLETED",
      "data": { "name": "ACME Corp" }
    },
    {
      "name": "banking",
      "status": "IN_PROGRESS",
      "data": null
    }
  ],
  "startedAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z",
  "completedAt": null
}
```

### `POST /onboarding/step/:step`
Complete a specific onboarding step.

**Parameters:**
- `step` - Step name (company_info, banking, email, tax, accounting, preferences)

**Request Body:**
```json
{
  "data": {
    "name": "ACME Corp",
    "taxId": "DE123456789"
  }
}
```

**Response:** OnboardingProgressDto

### `POST /onboarding/skip/:step`
Skip a specific onboarding step.

**Parameters:**
- `step` - Step name to skip

**Response:** OnboardingProgressDto

### `POST /onboarding/complete`
Mark entire onboarding as complete.

**Response:** OnboardingProgressDto

### `GET /onboarding/status`
Get simplified completion status summary.

**Response:**
```json
{
  "isCompleted": false,
  "completionPercentage": 50,
  "completedSteps": 3,
  "totalSteps": 6,
  "currentStep": 4
}
```

## Onboarding Steps

1. **company_info** - Company information and basic setup
2. **banking** - Banking connection setup (GoCardless, Tink, etc.)
3. **email** - Email integration (Gmail, Outlook)
4. **tax** - Tax credentials and setup
5. **accounting** - Accounting software integration (LexOffice, SevDesk, etc.)
6. **preferences** - User preferences and settings

## Features

### Progress Tracking
- Tracks which steps are completed, in progress, or skipped
- Calculates overall completion percentage
- Maintains current step pointer
- Stores step-specific data

### Step Dependencies
- Automatically advances to next step when current step is completed
- Allows skipping steps while maintaining progress
- Prevents operations on completed onboarding

### Data Storage
- Each step can store arbitrary JSON data
- Provider information tracked for integration steps (banking, email, accounting)
- Skipped steps tracked in array

### Business Logic

**Service Methods:**
- `getProgress()` - Retrieves or creates onboarding progress
- `completeStep()` - Marks step complete and stores data
- `skipStep()` - Skips step and advances to next
- `completeOnboarding()` - Finalizes entire onboarding
- `getStatus()` - Returns summary status

**Repository Methods:**
- Step-specific update methods (updateCompanyInfoStep, updateBankingStep, etc.)
- Generic update and find operations
- Atomic operations for data consistency

## Database Schema

Uses the `OnboardingProgress` Prisma model:

```prisma
model OnboardingProgress {
  id     String @id @default(uuid())
  orgId  String @unique
  userId String

  // Step statuses (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED)
  companyInfoStatus OnboardingStepStatus @default(NOT_STARTED)
  bankingStatus     OnboardingStepStatus @default(NOT_STARTED)
  emailStatus       OnboardingStepStatus @default(NOT_STARTED)
  taxStatus         OnboardingStepStatus @default(NOT_STARTED)
  accountingStatus  OnboardingStepStatus @default(NOT_STARTED)
  preferencesStatus OnboardingStepStatus @default(NOT_STARTED)

  // Step data (JSON)
  companyInfoData   Json?
  bankingData       Json?
  emailData         Json?
  taxData           Json?
  accountingData    Json?
  preferencesData   Json?

  // Providers
  bankingProvider    String?
  emailProvider      String?
  accountingProvider String?

  // Progress
  currentStep    Int      @default(1)
  totalSteps     Int      @default(6)
  isCompleted    Boolean  @default(false)
  completedAt    DateTime?
  skippedSteps   String[] @default([])

  // Timestamps
  startedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Validation

- Step names validated against known steps
- Prevents completing already-completed onboarding
- Automatically creates progress record if doesn't exist
- 404 errors for missing progress records
- 409 errors for conflicting state

## Module Registration

The module is registered in `app.module.ts`:

```typescript
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    // ...
    OnboardingModule,
  ],
})
```

## Usage Example

```typescript
// In another service
import { OnboardingService } from '@/modules/onboarding';

constructor(private onboardingService: OnboardingService) {}

async checkOnboardingStatus(orgId: string) {
  const status = await this.onboardingService.getStatus(orgId);

  if (!status.isCompleted) {
    // Redirect to onboarding
  }
}
```

## Security

- All endpoints protected with `JwtAuthGuard`
- User's `orgId` extracted from JWT token
- Row-level security enforced at Prisma level
- No cross-organization data access

## API Documentation

Swagger/OpenAPI documentation available at `/api/docs` when API is running.

All endpoints include:
- `@ApiTags('Onboarding')`
- `@ApiBearerAuth()`
- `@ApiOperation()` descriptions
- `@ApiResponse()` schemas
- `@ApiParam()` validations
