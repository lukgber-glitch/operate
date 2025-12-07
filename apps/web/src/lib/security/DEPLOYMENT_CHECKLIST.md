# SSL Certificate Pinning - Deployment Checklist

Use this checklist when preparing to deploy SSL certificate pinning to production.

---

## Pre-Deployment

### 1. Certificate Pin Generation

- [ ] Verify operate.guru SSL certificate is installed
- [ ] Run pin generation script:
  ```bash
  ./scripts/generate-ssl-pins.sh operate.guru
  ```
- [ ] Copy generated pin to clipboard
- [ ] Verify pin format (44 characters, ends with `=`)
- [ ] Document certificate expiry date: `_______________`

### 2. Code Configuration

- [ ] Open `apps/web/src/lib/security/ssl-pinning.ts`
- [ ] Replace placeholder pins with real pins
- [ ] Ensure 2 pins are configured (current + backup)
- [ ] Verify no placeholder values remain
- [ ] Run validation:
  ```typescript
  import { runDevelopmentChecks } from '@/lib/security';
  runDevelopmentChecks();
  ```

### 3. Dependencies

- [ ] Install Capacitor HTTP plugin:
  ```bash
  npm install @capacitor/http
  ```
- [ ] Sync with native projects:
  ```bash
  npx cap sync
  ```
- [ ] Verify plugin in `package.json`
- [ ] Check both iOS and Android sync successful

### 4. Testing

#### Unit Tests
- [ ] Run SSL pinning tests:
  ```bash
  npm test -- ssl-pinning.test.ts
  ```
- [ ] All tests passing
- [ ] No validation errors in output

#### iOS Testing
- [ ] Build app for iOS:
  ```bash
  npm run build
  npx cap copy ios
  npx cap open ios
  ```
- [ ] Deploy to iOS device (not simulator)
- [ ] Verify pinning logs in console:
  ```
  [SSL Pinning] Initializing...
  [Pinned Fetch] Using certificate pinning
  ```
- [ ] Test API requests succeed
- [ ] Verify network traffic uses HTTPS

#### Android Testing
- [ ] Build app for Android:
  ```bash
  npm run build
  npx cap copy android
  npx cap open android
  ```
- [ ] Deploy to Android device
- [ ] Check Logcat for pinning messages
- [ ] Test API requests succeed
- [ ] Verify network traffic uses HTTPS

#### Web Testing
- [ ] Build web version:
  ```bash
  npm run build
  ```
- [ ] Test in Chrome DevTools
- [ ] Verify pinning disabled (web platform)
- [ ] Confirm API requests work
- [ ] Check console for platform detection:
  ```
  [SSL Pinning] DISABLED
    platform: 'web'
  ```

### 5. Security Validation

- [ ] Test with wrong pin (simulate MITM):
  - Temporarily change pin in code
  - Verify API requests fail
  - Restore correct pin
  - Verify requests succeed again
- [ ] Verify certificate chain on server:
  ```bash
  openssl s_client -connect operate.guru:443 -showcerts
  ```
- [ ] Check certificate expiry:
  ```bash
  openssl s_client -connect operate.guru:443 | openssl x509 -noout -dates
  ```
- [ ] Document expiry: `_______________`

---

## Deployment

### 6. Code Review

- [ ] Create pull request with changes
- [ ] Security team review
- [ ] Include in PR description:
  - Certificate expiry date
  - Pin generation process
  - Testing results
  - Rollback plan
- [ ] PR approved and merged

### 7. Staging Deployment

- [ ] Deploy to staging environment
- [ ] Test on staging iOS app
- [ ] Test on staging Android app
- [ ] Verify pinning logs
- [ ] Run full regression tests
- [ ] Monitor for 24 hours
- [ ] No pinning failures detected

### 8. Production Deployment

- [ ] Schedule deployment window
- [ ] Notify team of deployment
- [ ] Create rollback branch
- [ ] Deploy to production:
  ```bash
  git checkout main
  git pull
  npm run build
  # Follow deployment process
  ```
- [ ] Verify deployment successful
- [ ] Monitor error logs for pinning failures

### 9. Post-Deployment Validation

- [ ] Test production iOS app
- [ ] Test production Android app
- [ ] Test production web app
- [ ] Verify API requests succeed
- [ ] Check error monitoring dashboard
- [ ] No increase in failed requests
- [ ] Monitor for 1 hour

---

## Monitoring

### 10. Initial Monitoring (First 24 Hours)

- [ ] Check error logs every 2 hours
- [ ] Monitor pinning failure rate
- [ ] Track user update adoption
- [ ] Verify certificate validation success
- [ ] No false positives detected
- [ ] Response time within SLA

### 11. Ongoing Monitoring

- [ ] Set up alerts for pinning failures
- [ ] Configure dashboard for metrics:
  - Pin validation success rate
  - Failed requests by platform
  - Certificate expiry countdown
  - User version distribution
- [ ] Weekly review of metrics
- [ ] Document any issues

---

## Certificate Rotation Preparation

### 12. Rotation Planning (T-30 Days)

- [ ] Certificate expires in 30 days
- [ ] Obtain new certificate from provider
- [ ] Generate pin for new certificate:
  ```bash
  ./scripts/generate-ssl-pins.sh operate.guru
  ```
- [ ] Update configuration with backup pin:
  ```typescript
  'operate.guru': [
    'CURRENT_PIN',  // Current cert
    'NEW_PIN',      // New cert for rotation
  ]
  ```
- [ ] Create rotation ticket/task
- [ ] Schedule deployment: `_______________`

### 13. Pre-Rotation App Update (T-14 Days)

- [ ] Deploy app with both pins
- [ ] Monitor user update rate
- [ ] Target: 90% adoption within 7 days
- [ ] Send update notification if needed

### 14. Certificate Renewal (T-Day)

- [ ] Verify app update rate > 90%
- [ ] Renew certificate on server
- [ ] Verify new certificate active:
  ```bash
  openssl s_client -connect operate.guru:443 | openssl x509 -noout -dates
  ```
- [ ] Monitor pinning validation
- [ ] Verify no increase in failures
- [ ] Old app versions may break (expected)

### 15. Post-Rotation Cleanup (T+7 Days)

- [ ] Generate pin for next rotation
- [ ] Update configuration:
  ```typescript
  'operate.guru': [
    'NEW_PIN',      // Current cert
    'FUTURE_PIN',   // Next rotation
  ]
  ```
- [ ] Deploy app update
- [ ] Remove old pin from codebase
- [ ] Document new expiry date

---

## Emergency Procedures

### 16. Emergency Rollback

If pinning breaks production:

- [ ] Disable pinning immediately:
  ```bash
  # Set environment variable
  NEXT_PUBLIC_DISABLE_SSL_PINNING=true
  ```
- [ ] Deploy hotfix within 15 minutes
- [ ] Notify users via status page
- [ ] Investigate root cause
- [ ] Document incident
- [ ] Plan corrective action

### 17. Certificate Compromise

If certificate is compromised:

- [ ] Revoke certificate immediately
- [ ] Issue emergency certificate
- [ ] Generate new pins
- [ ] Deploy emergency app update
- [ ] Force update or disable old versions
- [ ] Monitor for MITM attempts
- [ ] Security incident report
- [ ] Notify affected users if needed

---

## Documentation

### 18. Update Documentation

- [ ] Update README.md with:
  - Current certificate expiry
  - Pin generation date
  - Deployment date
  - Known issues
- [ ] Update QUICK_START.md if needed
- [ ] Document lessons learned
- [ ] Update runbook

### 19. Team Knowledge Transfer

- [ ] Train team on pin generation
- [ ] Review rotation process
- [ ] Demonstrate emergency rollback
- [ ] Share monitoring dashboard
- [ ] Schedule rotation drill

---

## Sign-Off

### Deployment Approval

- [ ] **Developer**: Implementation verified
  - Name: `_______________`
  - Date: `_______________`
  - Signature: `_______________`

- [ ] **QA**: Testing completed
  - Name: `_______________`
  - Date: `_______________`
  - Signature: `_______________`

- [ ] **Security**: Validated configuration
  - Name: `_______________`
  - Date: `_______________`
  - Signature: `_______________`

- [ ] **DevOps**: Deployment ready
  - Name: `_______________`
  - Date: `_______________`
  - Signature: `_______________`

### Production Validation

- [ ] **Production deployed**: `_______________` (date/time)
- [ ] **Validated by**: `_______________` (name)
- [ ] **Issues found**: ☐ None  ☐ Minor  ☐ Major
- [ ] **Status**: ☐ Success  ☐ Rollback Required

---

## Certificate Expiry Reminder

Set calendar reminders:

- [ ] **T-30 days**: Generate backup pin
- [ ] **T-14 days**: Deploy app with backup pin
- [ ] **T-7 days**: Verify update adoption
- [ ] **T-day**: Renew certificate
- [ ] **T+7 days**: Clean up old pin

**Current certificate expires**: `_______________`

**Next reminder date**: `_______________`

---

## Notes

Space for deployment notes, issues, or observations:

```
_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
```

---

## Completion

**Deployment completed**: ☐ Yes  ☐ No  ☐ Partial

**Overall status**: ☐ Success  ☐ Success with issues  ☐ Failed

**Rollback performed**: ☐ Yes  ☐ No

**Date completed**: `_______________`

**Completed by**: `_______________`

---

**Version**: 1.0
**Last updated**: 2025-12-07
**Owner**: SENTINEL (Security Agent)
