# E-Invoice Components

Components for handling E-Invoice format selection and download in the Operate/CoachOS platform.

## Components

### EInvoiceFormatSelector

A comprehensive format selector for invoice downloads, supporting Standard PDF, ZUGFeRD, and XRechnung formats.

#### Features

- Format selection with visual icons
- Conditional sub-options based on selected format
- ZUGFeRD profile selection (MINIMUM, BASIC, EN16931, EXTENDED)
- XRechnung syntax selection (UBL, CII)
- Descriptive help text for each option
- Smooth animations for conditional fields

#### Usage

```tsx
import { EInvoiceFormatSelector } from '@/components/e-invoice';
import { useState } from 'react';

function MyComponent() {
  const [format, setFormat] = useState<EInvoiceFormat>('standard');
  const [options, setOptions] = useState<EInvoiceOptions>();

  const handleFormatChange = (
    newFormat: EInvoiceFormat,
    newOptions?: EInvoiceOptions
  ) => {
    setFormat(newFormat);
    setOptions(newOptions);
  };

  return (
    <EInvoiceFormatSelector
      value={format}
      onChange={handleFormatChange}
      showDescription={true}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `EInvoiceFormat` | required | Currently selected format |
| `onChange` | `(format: EInvoiceFormat, options?: EInvoiceOptions) => void` | required | Callback when format or options change |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable all inputs |
| `showDescription` | `boolean` | `true` | Show descriptive text for options |

#### Types

```typescript
type EInvoiceFormat = 'standard' | 'zugferd' | 'xrechnung';
type ZugferdProfile = 'MINIMUM' | 'BASIC' | 'EN16931' | 'EXTENDED';
type XRechnungSyntax = 'UBL' | 'CII';

interface EInvoiceOptions {
  zugferdProfile?: ZugferdProfile;
  xrechnungSyntax?: XRechnungSyntax;
}
```

## API Integration

The component is designed to work with the backend API endpoint:

```
GET /organisations/{orgId}/invoices/{id}/generate?format={format}&{additionalParams}
```

### Query Parameters

- `format`: `standard` | `zugferd` | `xrechnung`
- `zugferdProfile` (when format=zugferd): `MINIMUM` | `BASIC` | `EN16931` | `EXTENDED`
- `xrechnungSyntax` (when format=xrechnung): `UBL` | `CII`

### Response Format

```json
{
  "buffer": "base64-encoded-file-content",
  "contentType": "application/pdf | application/xml",
  "filename": "INV-2024-001.pdf | INV-2024-001.xml"
}
```

## Format Details

### Standard PDF
Traditional PDF invoice without embedded electronic data. Compatible with all systems.

### ZUGFeRD
Hybrid format combining PDF for human readability with embedded XML for machine processing.

**Profiles:**
- **MINIMUM**: Basic invoice data only
- **BASIC**: Standard business invoices
- **EN16931**: EU standard (recommended for compliance)
- **EXTENDED**: Full feature set with additional data

### XRechnung
Pure XML format for fully automated processing, required for German public sector.

**Syntax Options:**
- **UBL**: Universal Business Language (default, widely supported)
- **CII**: Cross Industry Invoice (alternative standard)

## Examples

### Download Dialog Integration

```tsx
<Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Download Invoice</DialogTitle>
      <DialogDescription>
        Select the format for your invoice download.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <EInvoiceFormatSelector
        value={invoiceFormat}
        onChange={handleFormatChange}
      />
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleDownload}>Download</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Building API Request

```typescript
const handleDownload = async () => {
  const queryParams = new URLSearchParams();
  queryParams.append('format', invoiceFormat);

  if (invoiceFormat === 'zugferd' && invoiceOptions?.zugferdProfile) {
    queryParams.append('zugferdProfile', invoiceOptions.zugferdProfile);
  } else if (invoiceFormat === 'xrechnung' && invoiceOptions?.xrechnungSyntax) {
    queryParams.append('xrechnungSyntax', invoiceOptions.xrechnungSyntax);
  }

  const response = await fetch(
    `/api/organisations/${orgId}/invoices/${invoiceId}/generate?${queryParams.toString()}`
  );

  const data = await response.json();

  // Convert base64 to blob and download
  const blob = new Blob([Buffer.from(data.buffer, 'base64')], {
    type: data.contentType,
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = data.filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

## Styling

The component uses Tailwind CSS and is fully compatible with the shadcn/ui design system. It includes:

- Smooth fade-in animations for conditional fields
- Consistent spacing and typography
- Dark mode support
- Responsive design
- Accessible keyboard navigation

## Accessibility

- All inputs have proper labels
- Select components use ARIA attributes
- Keyboard navigation fully supported
- Screen reader friendly descriptions
