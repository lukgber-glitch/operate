# Mobile Sprint Task Assignments
## Sprint M1: App Store Readiness

**Created**: 2024-12-07
**Status**: IN_PROGRESS
**Priority**: CRITICAL - 3.5GB codebase blocking all progress

---

## Execution Order (STRICT SEQUENCING)

```
WAVE 1 (Parallel) - Cleanup + Analysis
├── M1-01: FLUX - Codebase size analysis & cleanup
├── M1-02: SENTINEL - Security audit for mobile gaps
└── M1-03: VERIFY - Dead code detection

WAVE 2 (After Wave 1) - Security Implementation
├── M1-04: SENTINEL - SSL pinning implementation
├── M1-05: SENTINEL - Biometric auth integration
└── M1-06: SENTINEL - Secure storage setup

WAVE 3 (After Wave 2) - Mobile Setup
├── M1-07: BRIDGE - Capacitor initialization
├── M1-08: BRIDGE - Native plugin configuration
└── M1-09: PRISM - PWA optimization

WAVE 4 (After Wave 3) - Compliance
├── M1-10: FORGE - Privacy manifest creation
├── M1-11: PRISM - AI consent flow UI
└── M1-12: FORGE - Data safety documentation
```

---

## WAVE 1: Cleanup & Analysis (LAUNCH NOW)

### M1-01: Codebase Size Analysis & Cleanup
**Agent**: FLUX (DevOps)
**Priority**: P0 - BLOCKING
**Status**: READY

**Objective**: Reduce codebase from 3.5GB to <500MB

**Tasks**:
1. Analyze disk usage breakdown (node_modules, .next, etc.)
2. Identify and remove unnecessary files
3. Update .gitignore to exclude build artifacts
4. Clean node_modules and reinstall with pnpm
5. Remove duplicate dependencies
6. Compress/optimize large assets
7. Verify git history isn't bloated

**Success Criteria**:
- [ ] Total size < 500MB
- [ ] node_modules not tracked in git
- [ ] .next cache excluded
- [ ] No duplicate dependencies
- [ ] .gitignore properly configured

**Files to Examine**:
- `package.json` (root and all apps)
- `.gitignore`
- `pnpm-workspace.yaml`

---

### M1-02: Mobile Security Gap Audit
**Agent**: SENTINEL (Security)
**Priority**: P0
**Status**: READY

**Objective**: Identify all security gaps for mobile deployment

**Tasks**:
1. Audit current authentication flow for mobile compatibility
2. Check API endpoints for mobile security headers
3. Identify certificate pinning requirements
4. Assess biometric auth integration points
5. Review secure storage needs (tokens, sensitive data)
6. Check for hardcoded secrets/API keys
7. Assess RASP requirements

**Success Criteria**:
- [ ] Complete gap analysis document
- [ ] Prioritized fix list
- [ ] Implementation specs for each gap

**Files to Examine**:
- `apps/api/src/modules/auth/`
- `apps/api/src/common/guards/`
- `apps/web/src/lib/api/`
- All `.env` references

---

### M1-03: Dead Code Detection
**Agent**: VERIFY (QA)
**Priority**: P1
**Status**: READY

**Objective**: Find and catalog unused code for removal

**Tasks**:
1. Run TypeScript compiler with noUnusedLocals
2. Identify unused exports
3. Find unused React components
4. Detect orphaned files (not imported anywhere)
5. Check for duplicate functionality
6. Identify unused dependencies in package.json

**Success Criteria**:
- [ ] List of unused files
- [ ] List of unused exports
- [ ] List of unused dependencies
- [ ] Estimated size savings

**Tools**: TypeScript, eslint, depcheck

---

## WAVE 2: Security Implementation (After Wave 1)

### M1-04: SSL Certificate Pinning
**Agent**: SENTINEL
**Priority**: P0 - CRITICAL
**Depends On**: M1-02

**Objective**: Implement certificate pinning for mobile API calls

**Tasks**:
1. Generate certificate pins for API domain
2. Create pinning configuration for Capacitor
3. Implement pin validation in API client
4. Add pin rotation mechanism
5. Create fallback for pin failures
6. Test against MITM scenarios

**Files to Create/Modify**:
- `apps/web/src/lib/api/ssl-pinning.ts`
- `apps/web/capacitor.config.ts`

---

### M1-05: Biometric Authentication
**Agent**: SENTINEL
**Priority**: P0 - CRITICAL
**Depends On**: M1-02

**Objective**: Add Face ID/Touch ID/Fingerprint support

**Tasks**:
1. Install @capacitor-community/biometric-auth
2. Create biometric auth service
3. Integrate with login flow
4. Add biometric lock for sensitive operations
5. Handle fallback to PIN/password
6. Store biometric preferences securely

**Files to Create**:
- `apps/web/src/lib/auth/biometric.service.ts`
- `apps/web/src/components/auth/BiometricPrompt.tsx`

---

### M1-06: Secure Mobile Storage
**Agent**: SENTINEL
**Priority**: P0 - CRITICAL
**Depends On**: M1-02

**Objective**: Implement iOS Keychain / Android Keystore integration

**Tasks**:
1. Install @capacitor-community/secure-storage
2. Create secure storage service
3. Migrate token storage from localStorage
4. Encrypt sensitive user data
5. Implement secure data wipe on logout
6. Handle storage errors gracefully

**Files to Create**:
- `apps/web/src/lib/storage/secure-storage.service.ts`

---

## WAVE 3: Mobile Build Setup (After Wave 2)

### M1-07: Capacitor Initialization
**Agent**: BRIDGE (Integrations)
**Priority**: P1
**Depends On**: M1-01, M1-04, M1-05, M1-06

**Objective**: Set up Capacitor for iOS and Android builds

**Tasks**:
1. Install @capacitor/core and @capacitor/cli
2. Initialize Capacitor configuration
3. Add iOS platform
4. Add Android platform
5. Configure app icons and splash screens
6. Set up build scripts in package.json

**Files to Create**:
- `apps/web/capacitor.config.ts`
- `apps/web/ios/` (generated)
- `apps/web/android/` (generated)

---

### M1-08: Native Plugin Configuration
**Agent**: BRIDGE
**Priority**: P1
**Depends On**: M1-07

**Objective**: Configure all required native plugins

**Tasks**:
1. Configure push notifications
2. Set up deep linking
3. Configure camera/document scanning
4. Set up native sharing
5. Configure haptic feedback
6. Test all plugins on simulators

**Plugins**:
- @capacitor/push-notifications
- @capacitor/app (deep links)
- @capacitor/camera
- @capacitor/share
- @capacitor/haptics

---

### M1-09: PWA Optimization
**Agent**: PRISM (Frontend)
**Priority**: P1
**Depends On**: M1-01

**Objective**: Optimize PWA for app store submission

**Tasks**:
1. Audit service worker caching strategy
2. Optimize offline functionality
3. Update web app manifest
4. Configure app shortcuts
5. Test installation flow
6. Verify Lighthouse PWA score >90

**Files to Modify**:
- `apps/web/public/manifest.json`
- `apps/web/next.config.js` (PWA config)

---

## WAVE 4: Compliance Documentation (After Wave 3)

### M1-10: Privacy Manifest Creation
**Agent**: FORGE (Backend)
**Priority**: P1
**Depends On**: M1-02

**Objective**: Create iOS Privacy Manifest (mandatory)

**Tasks**:
1. Catalog all data collection points
2. Document API usage (tracking, analytics)
3. Create PrivacyInfo.xcprivacy file
4. Document third-party SDK data usage
5. Prepare App Store privacy labels

**Files to Create**:
- `apps/web/ios/App/PrivacyInfo.xcprivacy`
- `docs/PRIVACY_MANIFEST.md`

---

### M1-11: AI Consent Flow UI
**Agent**: PRISM
**Priority**: P0 - REQUIRED FOR APPROVAL
**Depends On**: M1-07

**Objective**: Create AI data sharing disclosure and consent flow

**Tasks**:
1. Design consent dialog UI
2. Implement consent state management
3. Add consent check before AI calls
4. Create consent management in settings
5. Log consent events for compliance
6. Handle consent withdrawal

**Files to Create**:
- `apps/web/src/components/consent/AIConsentDialog.tsx`
- `apps/web/src/hooks/useAIConsent.ts`
- `apps/web/src/app/settings/ai-consent/page.tsx`

---

### M1-12: Data Safety Documentation
**Agent**: FORGE
**Priority**: P1
**Depends On**: M1-02, M1-10

**Objective**: Prepare Google Play Data Safety Section

**Tasks**:
1. Complete data collection questionnaire
2. Document data sharing practices
3. Specify data retention periods
4. Document security practices
5. Create data deletion procedure
6. Prepare policy documents

**Deliverables**:
- `docs/DATA_SAFETY_QUESTIONNAIRE.md`
- `docs/DATA_DELETION_PROCEDURE.md`

---

## Agent Assignment Summary

| Agent | Tasks | Priority |
|-------|-------|----------|
| FLUX | M1-01 | P0 - BLOCKING |
| SENTINEL | M1-02, M1-04, M1-05, M1-06 | P0 |
| VERIFY | M1-03 | P1 |
| BRIDGE | M1-07, M1-08 | P1 |
| PRISM | M1-09, M1-11 | P1, P0 |
| FORGE | M1-10, M1-12 | P1 |

---

## Success Metrics

- [ ] Codebase size < 500MB
- [ ] All P0 security gaps closed
- [ ] Capacitor builds successfully
- [ ] iOS simulator runs
- [ ] Android emulator runs
- [ ] PWA Lighthouse score > 90
- [ ] Privacy manifest complete
- [ ] AI consent flow working
