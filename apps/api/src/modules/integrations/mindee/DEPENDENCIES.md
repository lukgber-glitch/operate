# Dependencies Required for Mindee Integration

## Installation Required

The Mindee module requires the `form-data` package for multipart file uploads to the API.

### Install Command

```bash
# From the root of the monorepo
pnpm add form-data --filter @operate/api

# Or from apps/api directory
cd apps/api
pnpm add form-data
```

## Already Installed

The following dependencies are already present in `apps/api/package.json`:

- ✅ `axios` (^1.6.5) - HTTP client for API requests
- ✅ `@types/multer` (^1.4.13) - TypeScript types for file uploads
- ✅ `@nestjs/platform-express` (^10.3.0) - Express platform for NestJS

## Verification

After installing, verify the dependency:

```bash
cd apps/api
grep "form-data" package.json
```

Expected output:
```
"form-data": "^4.0.0"
```

## Alternative

If `form-data` cannot be installed for any reason, the service can use the built-in `FormData` from Node.js 18+ or modify the implementation to use a different approach for multipart uploads.
