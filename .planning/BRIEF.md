# Operate Cleanup & Redeploy

**One-liner**: Take down live site, clean up codebase with security standards, and redeploy the polished local state.

## Problem

The current live deployment at https://operate.guru/ may contain outdated code, debug artifacts, or security issues accumulated during rapid development. Before continuing development, we need to:
1. Safely take down the live site
2. Preserve critical config files (.env, secrets)
3. Create a clean, audited codebase
4. Redeploy with confidence

## Success Criteria

How we know it worked:

- [ ] Live site is down (Cloudways app stopped/removed)
- [ ] All critical files (.env, configs) preserved locally
- [ ] Duplicate created for cleanup work
- [ ] Security audit completed (no exposed secrets, proper .gitignore)
- [ ] Code cleaned (no debug code, unused files, proper formatting)
- [ ] GitHub updated with clean codebase
- [ ] https://operate.guru/ serves the clean local state
- [ ] All functionality works post-deployment

## Constraints

- **Cloudways API**: Must use API/CLI for all Cloudways operations
- **Zero data loss**: All .env files, secrets, and configs must be preserved
- **Security first**: No secrets in git, no debug code, no exposed endpoints
- **Existing functionality**: Must not break any working features

## Out of Scope

- New features (this is cleanup only)
- Database migrations (schema changes)
- UI/UX changes
- Performance optimization (unless security-related)
- Third-party integration changes
