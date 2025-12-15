# FORGE Agent Task: Sync OnboardingProgress to Organisation

## Role
You are FORGE, the backend specialist for the Operate project. You write clean, production-ready NestJS code.

## Task Overview
Implement automatic synchronization of onboarding data to the Organisation model when onboarding is completed.

## Current State
The `onboarding.service.ts` already has a method `updateOrganisationBusinessContext` (lines 382-406) that syncs some fields (industry, businessModel, targetCustomerType) during the company_info step. However, there is NO comprehensive sync when onboarding is completed.

## Goal
When `completeOnboarding` is called (lines 251-271), sync ALL relevant onboarding data from OnboardingProgress to the Organisation record.

## Files to Modify
- `apps/api/src/modules/onboarding/onboarding.service.ts`

## Implementation Requirements

### 1. Create a comprehensive sync method

Add a new private method `syncOnboardingDataToOrganisation` that:
- Retrieves the full OnboardingProgress record
- Extracts data from ALL step data fields (companyInfoData, preferencesData, taxData)
- Updates the Organisation record with ALL available fields

### 2. Fields to sync from OnboardingProgress to Organisation

Based on the Organisation schema (checked in schema.prisma lines 74-123):

**From companyInfoData:**
- name (if provided and not already set)
- country
- currency
- industry
- businessModel
- targetCustomerType
- companyType (enum: map string to CompanyType enum)
- vatScheme (enum: map string to VatScheme enum)
- companyRegistrationNumber
- vatNumber
- utrNumber (UK)
- payeReference (UK)
- taxRegistrationNumber (UAE/Saudi)
- commercialRegistration (Saudi)
- tradeLicenseNumber (UAE)

**From preferencesData:**
- timezone
- currency (as fallback if not in companyInfo)
- settings (JSON field - can store additional preferences)

**From taxData (if exists):**
- vatNumber (fallback)
- taxRegistrationNumber (fallback)

### 3. Call the sync method from completeOnboarding

In the `completeOnboarding` method (lines 251-271):
- After marking as complete (line 269)
- Before returning the DTO (line 270)
- Call: `await this.syncOnboardingDataToOrganisation(orgId);`

### 4. Error Handling

- Wrap sync in try-catch to prevent onboarding completion from failing
- Log errors but don't throw (onboarding should complete even if sync fails)
- Use proper TypeScript types (avoid 'any' where possible)

### 5. Code Quality Requirements

- Use optional chaining and nullish coalescing for safety
- Only update fields that have values (don't overwrite with null/undefined)
- Map enum string values correctly (CompanyType, VatScheme)
- Add JSDoc comment explaining the method
- Follow existing code style in the file

## Example Method Signature

```typescript
/**
 * Sync all onboarding data to Organisation record
 * Called when onboarding is completed to ensure Organisation has all collected data
 */
private async syncOnboardingDataToOrganisation(orgId: string): Promise<void> {
  try {
    const progress = await this.repository.findByOrgId(orgId);
    if (!progress) return;

    const companyInfo = progress.companyInfoData as any;
    const preferences = progress.preferencesData as any;
    const taxData = progress.taxData as any;

    if (!companyInfo && !preferences && !taxData) return;

    // Build update object with only defined values
    const updateData: any = {};

    // Sync company info
    if (companyInfo) {
      if (companyInfo.country) updateData.country = companyInfo.country;
      if (companyInfo.currency) updateData.currency = companyInfo.currency;
      // ... add all other fields
    }

    // Sync preferences
    if (preferences) {
      if (preferences.timezone) updateData.timezone = preferences.timezone;
      if (preferences.currency && !updateData.currency) {
        updateData.currency = preferences.currency;
      }
    }

    // Only update if we have data
    if (Object.keys(updateData).length > 0) {
      await this.prisma.organisation.update({
        where: { id: orgId },
        data: updateData,
      });
    }
  } catch (error) {
    // Log but don't throw - onboarding should complete even if sync fails
    console.error(`Failed to sync onboarding data to organisation ${orgId}:`, error);
  }
}
```

## Testing Checklist

After implementation:
1. Verify the service compiles without TypeScript errors
2. Check that existing onboarding flow is not broken
3. Verify sync is called from completeOnboarding
4. Ensure error handling prevents onboarding failure

## Constraints

- DO NOT modify the Organisation schema (it's already correct)
- DO NOT change existing onboarding flow logic
- DO NOT break existing `updateOrganisationBusinessContext` method
- DO synchronize fields that match what's already in the Organisation model
- DO handle missing/null data gracefully

## Success Criteria

✅ New sync method created
✅ Comprehensive field mapping implemented
✅ Called from completeOnboarding
✅ Error handling prevents failures
✅ Code compiles without TypeScript errors
✅ Existing functionality preserved
