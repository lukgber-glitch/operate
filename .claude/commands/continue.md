# /continue - Resume Operate Session

Read the checkpoint file and continue from where we left off.

## Current Status (Updated: 2025-12-05)

**STATUS**: Production API RESTORED and WORKING

## Live URLs

- **App**: https://operate.guru
- **API Health**: https://operate.guru/api/v1/health
- **Google OAuth**: https://operate.guru/api/v1/auth/google

## Server Details

- **SSH**: `ssh cloudways` (or `ssh -i ~/.ssh/cloudways_key master_ayxzcfhxfe@164.90.202.153`)
- **API Path**: `~/applications/eagqdkxvzv/public_html/apps/api/`
- **PM2 Process**: operate-api

## What's Working

- ✅ API health endpoint
- ✅ Redis connection with ACL authentication
- ✅ Database connection (Neon PostgreSQL)
- ✅ Google OAuth redirect
- ✅ Varnish cache (purged)

## Pending Tasks

1. Test Google OAuth login flow end-to-end in browser
2. Configure Microsoft OAuth (need Azure AD credentials)
3. Test all 10 languages
4. Test new user registration flow
5. Fix Redis ACL permissions for Bull queues (minor)

## Quick Commands

```bash
# Check API status
ssh cloudways "./node_modules/.bin/pm2 list"

# View API logs
ssh cloudways "./node_modules/.bin/pm2 logs operate-api --lines 50"

# Restart API
ssh cloudways "./node_modules/.bin/pm2 restart operate-api --update-env"

# Test health
curl https://operate.guru/api/v1/health
```

## Checkpoint File

Full details in: `C:\Users\grube\op\operate-live\CHECKPOINT_2025-12-05.md`
