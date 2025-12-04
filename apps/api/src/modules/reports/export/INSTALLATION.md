# Export Service Installation Guide

## Step 1: Install Dependencies

```bash
cd apps/api
pnpm add exceljs
```

This will add ExcelJS (v4.4.0) for Excel generation. The following dependencies are already installed:
- `pdfkit` ^0.15.0 - PDF generation
- `@types/pdfkit` ^0.13.4 - TypeScript types
- `archiver` ^7.0.1 - ZIP creation
- `@types/archiver` ^7.0.0 - TypeScript types

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Export Service Configuration
UPLOADS_DIR=./uploads/exports
MAX_FILE_SIZE_MB=100
DEFAULT_FILE_TTL_SECONDS=86400
```

## Step 3: Create Uploads Directory

```bash
mkdir -p uploads/exports
```

This directory will store temporarily exported files.

## Step 4: Import Module

In your `reports.module.ts` or main app module, import the ExportModule:

```typescript
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    // ... other imports
    ExportModule,
  ],
})
export class ReportsModule {}
```

## Step 5: Build and Test

```bash
# Build the application
pnpm run build

# Run tests (when implemented)
pnpm test export

# Start development server
pnpm run dev
```

## Step 6: Verify API Endpoints

The following endpoints should be available:

```bash
# Test PDF generation
curl -X POST http://localhost:3000/api/reports/export/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportData": {
      "organizationInfo": { "name": "Test Company" },
      "reportTitle": "Test Report",
      "summary": { "totalRevenue": 100000 }
    },
    "template": "pl_statement"
  }'

# Test Excel generation
curl -X POST http://localhost:3000/api/reports/export/excel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportData": {
      "organizationInfo": { "name": "Test Company" },
      "reportTitle": "Test Report",
      "summary": { "totalRevenue": 100000 }
    },
    "template": "financial_statement"
  }'

# List templates
curl http://localhost:3000/api/reports/export/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 7: Setup File Cleanup (Optional)

For production environments, you may want to set up a cron job to clean up expired files:

```bash
# Add to crontab
0 * * * * find /path/to/uploads/exports -type f -mtime +1 -delete
```

Or use the built-in TTL-based cleanup (already implemented).

## Step 8: Configure Storage Backend (Optional)

For production, you may want to use cloud storage instead of local filesystem:

1. Install storage SDK (S3, MinIO, etc.)
2. Update `export.service.ts` `uploadToStorage()` method
3. Update `getDownloadUrl()` to return signed URLs

Example for S3:

```typescript
import { S3 } from 'aws-sdk';

async uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  const s3 = new S3();
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: `exports/${filename}`,
    Body: buffer,
  }).promise();

  return filename;
}
```

## Troubleshooting

### Issue: "Cannot find module 'exceljs'"
**Solution**: Run `pnpm add exceljs` in the `apps/api` directory.

### Issue: "ENOENT: no such file or directory"
**Solution**: Create the uploads directory: `mkdir -p uploads/exports`

### Issue: "File size too large"
**Solution**: Increase `MAX_FILE_SIZE_MB` in environment variables or implement file compression.

### Issue: "Permission denied when creating files"
**Solution**: Ensure the application has write permissions to the uploads directory:
```bash
chmod 755 uploads/exports
```

### Issue: "PDF/Excel generation fails"
**Solution**: Check logs for specific errors. Ensure all required data fields are provided in `reportData`.

## Performance Optimization

### For Large Reports

1. **Enable compression**: Set `compress: true` in export options
2. **Use batch export**: Export multiple reports at once to ZIP
3. **Limit data**: Use pagination for large datasets
4. **Enable streaming**: Already implemented for downloads

### Memory Management

The service uses streaming for file downloads to minimize memory usage:
- PDFs are buffered in memory during generation
- Excel files are written directly to disk
- Downloads use Node.js streams

### Caching

Consider implementing caching for frequently generated reports:

```typescript
// Example cache key
const cacheKey = `export:${template}:${dateRange}:${organizationId}`;

// Check cache before generating
const cached = await redis.get(cacheKey);
if (cached) return cached;

// Generate and cache
const report = await generatePdf(...);
await redis.setex(cacheKey, 3600, report); // 1 hour TTL
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Use role-based access control
3. **File Access**: Download URLs expire after 1 hour
4. **Input Validation**: All inputs are validated using class-validator
5. **File Cleanup**: Files are auto-deleted after 24 hours
6. **Sheet Protection**: Excel sheets can be password-protected

## Monitoring

Add monitoring for:
- Export request volume
- File generation time
- File sizes
- Storage usage
- Error rates
- Cleanup operations

Example using Prometheus:

```typescript
import { Counter, Histogram } from 'prom-client';

const exportCounter = new Counter({
  name: 'exports_total',
  help: 'Total number of exports',
  labelNames: ['format', 'template', 'status'],
});

const exportDuration = new Histogram({
  name: 'export_duration_seconds',
  help: 'Export generation duration',
  labelNames: ['format', 'template'],
});
```

## Support

For issues or questions:
1. Check the README.md for usage examples
2. Review API documentation in Swagger
3. Check application logs for errors
4. Contact the development team

## Next Steps

1. Write unit tests for service methods
2. Write integration tests for API endpoints
3. Implement email delivery (optional)
4. Add chart embedding support (optional)
5. Implement digital signatures (optional)
6. Add custom template management UI (optional)
