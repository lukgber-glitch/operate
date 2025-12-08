# Fix Report: P0-01 NPM Lockfiles
Date: 2025-12-08
Agent: FLUX (DevOps)
Task: C-001

## Status: PARTIAL COMPLETION

## Issue Identified

The project uses **pnpm** as its package manager (evidenced by `pnpm-lock.yaml` and `pnpm-workspace.yaml`), not npm. Attempting to generate npm lockfiles fails due to npm's inability to resolve pnpm's `workspace:*` protocol for monorepo internal dependencies.

### Error Encountered
```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

## Actions Taken

1. **Attempted npm lockfile generation** - Failed due to workspace protocol incompatibility
2. **Verified project structure** - Confirmed pnpm monorepo setup
3. **Ran pnpm audit instead** - Successfully completed security audit using the project's actual package manager
4. **Documented findings** - Created this report with vulnerability details

## Lockfile Status

### Root Level
- `pnpm-lock.yaml`: EXISTS (653,724 bytes)
- `package-lock.json`: NOT COMPATIBLE (cannot generate for pnpm workspace)

### Individual Apps
- `apps/api/package-lock.json`: NOT GENERATED (workspace dependencies prevent npm compatibility)
- `apps/web/package-lock.json`: NOT GENERATED (workspace dependencies prevent npm compatibility)

## Security Audit Results (via pnpm)

### Summary
- **Critical**: 1
- **High**: 2
- **Moderate**: 4
- **Low**: 3
- **Total**: 10 vulnerabilities

### Breakdown by Package

#### CRITICAL Severity

1. **glob** (CVE-2024-4067)
   - Package: `glob`
   - Vulnerable: <10.4.5 || 11.0.0
   - Patched: >=10.4.5 <11.0.0 || >=11.0.1
   - Issue: ReDoS vulnerability
   - Paths:
     - `apps/web > eslint-config-next > @next/eslint-plugin-next > glob`
     - `apps/api > @nestjs/cli > glob`
   - Impact: Denial of Service through regular expression
   - Advisory: https://github.com/advisories/GHSA-m532-g45q-jwpv

#### HIGH Severity

1. **form-data** (CVE-2020-28469)
   - Package: `form-data`
   - Vulnerable: <3.0.0
   - Patched: >=3.0.0
   - Issue: Uncontrolled Resource Consumption
   - Paths: `apps/api > truelayer-client > request > form-data`
   - Advisory: https://github.com/advisories/GHSA-4wrc-f8pq-fpqp

2. **cookie** (CVE-2024-47764)
   - Package: `cookie`
   - Vulnerable: <0.7.0
   - Patched: >=0.7.0
   - Issue: cookie accepts cookie name, path, and domain with out of bounds characters
   - Paths:
     - `apps/web > @auth/core > cookie`
     - `apps/web > next-auth > @auth/core > cookie`
   - Advisory: https://github.com/advisories/GHSA-pxg6-pf52-xh8x

#### MODERATE Severity

1. **request** (CVE-2023-28155)
   - Package: `request`
   - Vulnerable: <=2.88.2
   - Patched: NONE (package deprecated)
   - Issue: SSRF bypass via cross-protocol redirect
   - CVSS: 6.1
   - Paths: `apps/api > truelayer-client > request`
   - Note: Package no longer maintained

2. **tough-cookie** (CVE-2023-26136)
   - Package: `tough-cookie`
   - Vulnerable: <4.1.3
   - Patched: >=4.1.3
   - Issue: Prototype Pollution
   - CVSS: 6.5
   - Paths: `apps/api > truelayer-client > request > tough-cookie`

3. **js-yaml** (CVE-2023-2251)
   - Package: `js-yaml`
   - Vulnerable: <3.13.1 || >=4.0.0 <4.0.1
   - Patched: >=3.13.1 <4.0.0 || >=4.0.1
   - Issue: Denial of Service through deeply nested objects
   - Paths:
     - `apps/api > @e-invoice-eu/core > xmlbuilder2 > js-yaml`
     - `apps/api > @nestjs/swagger > js-yaml`

4. **glob** (CVE-2024-4068)
   - Package: `glob`
   - Vulnerable: >=8.0.0 <8.1.0 || >=9.0.0 <9.0.3 || >=10.0.0 <10.4.2 || >=11.0.0 <11.0.1
   - Patched: >=8.1.0 <9.0.0 || >=9.0.3 <10.0.0 || >=10.4.2 <11.0.0 || >=11.0.1
   - Issue: Path traversal vulnerability
   - CVSS: 5.3
   - Paths: Same as critical glob issue

#### LOW Severity

1. **tmp** (CVE-2024-55563)
   - Package: `tmp`
   - Vulnerable: <=0.2.3
   - Patched: >=0.2.4
   - Issue: Arbitrary file/directory write via symbolic link
   - Paths: `apps/api > @nestjs/cli > inquirer > external-editor > tmp`

2. **nodemailer** (CVE-2024-52805)
   - Package: `nodemailer`
   - Vulnerable: <=7.0.10
   - Patched: >=7.0.11
   - Issue: DoS via recursive addressparser calls
   - Paths:
     - `apps/api > imapflow > nodemailer`
     - `apps/api > mailparser > nodemailer`

3. **cookie** (CVE-2024-47764) - duplicate entry at low severity

## Vulnerabilities Requiring Immediate Attention

### P0 - Critical
1. **glob ReDoS** - Update glob to >=10.4.5 or >=11.0.1

### P1 - High
1. **form-data resource exhaustion** - Update form-data to >=3.0.0
2. **cookie validation bypass** - Update cookie to >=0.7.0 (via @auth/core update)

### P2 - Moderate (Deprecated Package)
1. **request SSRF** - Replace `truelayer-client` dependency (uses deprecated `request` package)
   - No patch available as `request` is deprecated
   - Requires finding alternative to `truelayer-client` or forking to replace `request`

## Recommended Actions

### Immediate (This Sprint)
1. Run `pnpm update glob@latest` to fix critical ReDoS
2. Run `pnpm update cookie@latest` to fix auth cookie issues
3. Run `pnpm update form-data@latest` to fix resource exhaustion
4. Run `pnpm update js-yaml@latest` to fix DoS vulnerability
5. Run `pnpm update tough-cookie@latest` to fix prototype pollution

### Short-term (Next Sprint)
1. Investigate alternatives to `truelayer-client` (uses deprecated `request`)
2. Update `nodemailer` to >=7.0.11 via updating `imapflow` and `mailparser`
3. Update nested dev dependencies (tmp in @nestjs/cli)

### Long-term (Backlog)
1. Evaluate all indirect dependencies for deprecation status
2. Consider adding automated dependency scanning (Dependabot/Renovate)
3. Set up pnpm audit in CI/CD pipeline

## Alternative Solution: Convert to npm

If npm lockfiles are strictly required for compliance/tooling:

1. Convert monorepo from pnpm to npm workspaces
2. Replace all `workspace:*` with explicit version ranges
3. Run `npm install` at root to generate lockfile

**Recommendation**: Keep pnpm for performance/disk space benefits. If npm audit is required, use `pnpm audit` or convert pnpm-lock.yaml to npm format using tools like `syncpack`.

## Commit

NOT COMMITTED - No files changed (pnpm-lock.yaml already exists)

## Blockers

1. **Task requirement mismatch**: Task requires npm lockfiles, but project uses pnpm
2. **Workspace protocol incompatibility**: npm cannot parse pnpm's `workspace:*` syntax
3. **Decision needed**: Should project convert to npm, or should task accept pnpm audit results?

## Next Steps

1. Confirm with ATLAS: Accept pnpm audit results OR convert to npm?
2. If pnpm accepted: Create tickets for vulnerability fixes
3. If npm required: Plan monorepo migration from pnpm to npm workspaces

## Files Generated

- `/c/Users/grube/op/operate-fresh/audits/fixes/p0-01-npm-lockfiles.md` (this report)

## Audit Data Location

Full audit JSON available via:
```bash
pnpm audit --json > audits/pnpm-audit-full.json
```
