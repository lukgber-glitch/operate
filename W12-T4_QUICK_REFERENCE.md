# W12-T4 E-Invoice PDF Generation - Quick Reference

## What Was Done

Updated invoice PDF generation to support E-Rechnung formats (ZUGFeRD, Factur-X, XRechnung).

## Files Status

| File | Status | Action |
|------|--------|--------|
| `dto/generate-einvoice.dto.ts` | ✅ Created | None - ready |
| `invoices.controller.ts` | ✅ Updated | None - deployed |
| `invoices.module.ts` | ✅ Updated | None - deployed |
| `invoices.service.ts` | ⚠️ Pending | Manual update required |
| `einvoice.additions.ts` | 📝 Reference | Copy methods to service |

## Manual Steps Required

### 1. Update invoices.service.ts

**Location:** `/apps/api/src/modules/finance/invoices/invoices.service.ts`

**Add these imports after line 11:**
```typescript
import {
  EInvoiceFormat,
  ZugferdProfile,
  XRechnungSyntax,
} from './dto/generate-einvoice.dto';
import { ZugferdService } from '../../e-invoice/services/zugferd.service';
import { XRechnungService } from '../../e-invoice/services/xrechnung.service';
import { InvoiceData } from '../../e-invoice/types/zugferd.types';
import { XRechnungSyntax as XRechnungSyntaxType } from '../../e-invoice/types/xrechnung.types';
```

**Update constructor (line ~21):**
```typescript
constructor(
  private repository: InvoicesRepository,
  private zugferdService: ZugferdService,
  private xrechnungService: XRechnungService,
) {}
```

**Add methods before final closing brace:**
- Copy all methods from `einvoice.additions.ts`
- Paste before the last `}` in the file

### 2. Verify Build
```bash
cd /c/Users/grube/op/operate
npm run build
```

### 3. Test
```bash
./apps/api/src/modules/finance/invoices/test-einvoice.sh <TOKEN> <ORG_ID> <INVOICE_ID>
```

## New API Endpoint

```
GET /organisations/:orgId/invoices/:id/generate

Parameters:
  - format: standard | zugferd | facturx | xrechnung
  - zugferdProfile: EN16931 | BASIC | MINIMUM | EXTENDED | ...
  - xrechnungSyntax: UBL | CII

Returns:
  {
    buffer: "base64...",
    contentType: "application/pdf" or "application/xml",
    filename: "invoice-XXX-format.pdf/xml"
  }
```

## Format Examples

```bash
# Standard PDF (default)
GET /invoices/123/generate

# ZUGFeRD PDF with EN16931 profile
GET /invoices/123/generate?format=zugferd&zugferdProfile=EN16931

# XRechnung XML with UBL syntax
GET /invoices/123/generate?format=xrechnung&xrechnungSyntax=UBL
```

## Key Files

- **Implementation Guide:** `W12-T4_EINVOICE_PDF_IMPLEMENTATION.md`
- **Completion Summary:** `W12-T4_COMPLETION_SUMMARY.md`
- **Service Methods:** `einvoice.additions.ts`
- **Test Script:** `test-einvoice.sh`

## TODOs After Deployment

1. Update `mapToInvoiceData()` to fetch seller info from organization settings
2. Add Leitweg-ID field for XRechnung B2G invoices
3. Implement structured address storage
4. Add bank details mapping
5. Create automated tests

## Support

For questions or issues:
- See full documentation in `W12-T4_EINVOICE_PDF_IMPLEMENTATION.md`
- Check `W12-T4_COMPLETION_SUMMARY.md` for detailed analysis
- Review `einvoice.additions.ts` for implementation details

---

**Status:** Ready for deployment (manual service update required)
**Estimated Time:** 30-60 minutes
