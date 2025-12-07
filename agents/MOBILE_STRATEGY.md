# Mobile App Store Strategy
## Operate - Full Deployment Plan

**Created**: 2024-12-07
**Status**: APPROVED - Ready for Implementation

---

## Strategic Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform priority | Google Play first | Faster review, cheaper, D-U-N-S required |
| App versions | Single app | Maintenance efficiency |
| Language handling | In-app switching | Better UX, simpler distribution |
| Deployment method | PWA + Capacitor | 8-15MB final size |
| Market focus | DACH first | Existing German compliance |

---

## Phase 1: Codebase Cleanup (CRITICAL)

**Current Size**: 3.5GB (UNACCEPTABLE)
**Target Size**: < 500MB

### Cleanup Tasks
1. Remove node_modules from git tracking
2. Clear .next build cache
3. Remove duplicate/unused dependencies
4. Audit and remove dead code
5. Compress assets
6. Remove test artifacts

---

## Phase 2: Security Hardening

### Critical Gaps (Must Fix)
1. SSL/Certificate Pinning - Mobile API security
2. Biometric Authentication - Face ID/Touch ID/Fingerprint
3. Secure Mobile Storage - iOS Keychain, Android Keystore
4. RASP (Runtime Application Self-Protection)

### Already Implemented (Keep)
- OAuth httpOnly cookies
- SHA-256 hashed refresh tokens
- TenantGuard multi-tenancy
- HMAC-SHA256 webhook verification
- GoBD-compliant audit logs
- MFA support
- PSD2 banking integrations

---

## Phase 3: Compliance Documentation

### iOS Requirements
- Privacy Manifest (mandatory)
- AI Data Sharing Disclosure (Nov 2025)
- Financial App compliance docs
- App Store Connect metadata

### Google Play Requirements
- D-U-N-S Number (30+ days - START NOW)
- Organization Account setup
- Financial Features Declaration
- Data Safety Section
- Play Console metadata

---

## Phase 4: Mobile Build Setup

### Capacitor Integration
- Initialize Capacitor in web app
- Configure iOS project
- Configure Android project
- Native plugin setup (biometrics, secure storage)
- Build pipeline setup

### PWA Optimization
- Service worker refinement
- Offline capability audit
- Push notification setup
- App manifest optimization

---

## Phase 5: Store Submission

### Google Play (First)
- Internal testing track
- Closed beta release
- Open beta release
- Production release

### iOS App Store (Second)
- TestFlight setup
- Internal testing
- External beta
- App Store release

---

## Budget Estimates

| Category | Low | High |
|----------|-----|------|
| Codebase cleanup | $5K | $10K |
| Security fixes | $80K | $135K |
| Compliance | $90K | $180K |
| Store fees | $124 | $124 |
| Testing | $20K | $40K |
| **Total** | **$195K** | **$365K** |

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Cleanup | 1 week | None |
| Phase 2: Security | 3-4 weeks | Phase 1 |
| Phase 3: Compliance | 2 weeks | Phase 2 |
| Phase 4: Mobile Build | 2 weeks | Phase 1 |
| Phase 5: Submission | 2-4 weeks | All above |

**Total**: 10-13 weeks to production

---

## Success Metrics

- [ ] Codebase < 500MB
- [ ] All security gaps closed
- [ ] Privacy manifests created
- [ ] D-U-N-S number obtained
- [ ] Google Play approved
- [ ] iOS App Store approved
- [ ] <15MB app size
- [ ] 4.0+ store rating target
