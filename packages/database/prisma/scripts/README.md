# Database Scripts

This directory contains utility scripts for database maintenance and user management.

## Available Scripts

### fix-test-user.ts

Fixes the test user account (`luk.gber@gmail.com`) by:
- Unlocking the account (clearing all sessions)
- Marking onboarding as complete
- Updating last login time

**Usage:**
```bash
npx tsx packages/database/prisma/scripts/fix-test-user.ts
```

**What it does:**
1. Finds the user by email
2. Deletes all active sessions (which unlocks the account)
3. Creates or updates onboarding progress to mark as complete
4. Updates the last login timestamp
5. Provides detailed output of all changes

### verify-test-user.ts

Verifies the test user account status and displays detailed information.

**Usage:**
```bash
npx tsx packages/database/prisma/scripts/verify-test-user.ts
```

**What it shows:**
- User information (ID, email, name, locale)
- Account status (sessions, lock status)
- Onboarding status (current step, completed steps)
- Organization memberships

## Running Scripts

All scripts should be run from the project root:

```bash
cd /path/to/operate-fresh
npx tsx packages/database/prisma/scripts/<script-name>.ts
```

## Requirements

- Node.js 18+
- tsx (installed via npx)
- Valid DATABASE_URL in environment

## Notes

- Scripts connect to the database specified in `DATABASE_URL` environment variable
- All scripts include error handling and detailed logging
- Scripts automatically disconnect from the database when complete
