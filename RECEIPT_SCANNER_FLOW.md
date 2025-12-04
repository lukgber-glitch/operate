# Receipt Scanner User Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                              │
├─────────────────────────────────────────────────────────────┤
│  1. Dashboard → "Scan Receipt" Quick Action                 │
│  2. Expenses Page → "Scan Receipt" Button (header)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              UPLOAD PAGE (/expenses/scan)                    │
├─────────────────────────────────────────────────────────────┤
│  Options:                                                    │
│  • Drag & Drop files                                         │
│  • Click "Choose File" (Desktop/Gallery)                     │
│  • Click "Take Photo" (Mobile Camera)                        │
│                                                              │
│  Validation:                                                 │
│  ✓ File type: JPEG, PNG, WebP, PDF                          │
│  ✓ File size: Max 10MB                                      │
│  ✓ Preview before upload                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    Click "Process Receipt"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  UPLOAD & PROCESSING                         │
├─────────────────────────────────────────────────────────────┤
│  Progress Bar:                                               │
│  [=========>    ] 90% Uploading...                           │
│  [============] 100% Processing...                           │
│                                                              │
│  Auto-redirect when complete                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          REVIEW PAGE (/expenses/scan/[scanId])              │
│          STATUS: PROCESSING                                  │
├─────────────────────────────────────────────────────────────┤
│                  [Loading Spinner]                           │
│              Processing Receipt...                           │
│       This usually takes a few seconds                       │
│                                                              │
│  (Auto-polls every 2 seconds)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          REVIEW PAGE - COMPLETED                             │
├─────────────────────────────────────────────────────────────┤
│  LEFT SIDE              │  RIGHT SIDE                        │
│  ┌──────────────────┐   │  ┌─────────────────────────────┐ │
│  │  Receipt Image   │   │  │ Merchant: "Acme Corp"       │ │
│  │  [View Image]    │   │  │ Confidence: High (95%)      │ │
│  │                  │   │  │                             │ │
│  │  Line Items:     │   │  │ Date: 2024-12-02            │ │
│  │  • Office: $50   │   │  │ Confidence: High (92%)      │ │
│  │  • Paper: $100   │   │  │                             │ │
│  │                  │   │  │ Amount: 150.00              │ │
│  │  Confidence: 92% │   │  │ Confidence: Medium (85%)    │ │
│  └──────────────────┘   │  │                             │ │
│                         │  │ Tax: 28.50                  │ │
│                         │  │ Currency: EUR               │ │
│                         │  │ Category: Office Supplies   │ │
│                         │  │ Notes: [optional]           │ │
│                         │  │                             │ │
│                         │  │ [Confirm & Create Expense]  │ │
│                         │  │ [Reject]                    │ │
│                         │  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
                  ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   CONFIRM        │  │    REJECT        │
        └──────────────────┘  └──────────────────┘
                  │                   │
                  ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Create Expense   │  │ Discard Scan     │
        │ Redirect to      │  │ Redirect to      │
        │ /expenses/{id}   │  │ /expenses        │
        └──────────────────┘  └──────────────────┘

        Option: "Scan Another Receipt"
                  │
                  ▼
        Back to Upload Page
```

## Confidence Color Coding

| Confidence Level | Border Color | Badge Color | Percentage |
|-----------------|--------------|-------------|------------|
| High            | Green        | Green       | > 90%      |
| Medium          | Yellow       | Yellow      | 70-90%     |
| Low             | Red          | Red         | < 70%      |

## Layout Comparison

### Desktop (Side-by-Side)
```
┌───────────────────┬────────────────────┐
│   Receipt Image   │   Extracted Data   │
│                   │                    │
│   [Large View]    │   [Edit Form]      │
│                   │                    │
│   Line Items      │   Actions          │
└───────────────────┴────────────────────┘
```

### Mobile (Stacked)
```
┌─────────────────────────────────────┐
│        Receipt Image                │
│        [Full Width]                 │
├─────────────────────────────────────┤
│        Extracted Data               │
│        [Edit Form]                  │
│        [Full Width]                 │
├─────────────────────────────────────┤
│        Line Items                   │
├─────────────────────────────────────┤
│        Actions                      │
│        [Full Width Buttons]         │
└─────────────────────────────────────┘
```

## Error Handling

### Upload Errors
- Invalid file type → Toast notification
- File too large → Toast notification
- Network error → Retry option

### Processing Errors
- Scan failed → Error message + retry options
- Timeout → Auto-retry polling
- Network error → Manual retry button

### Validation Errors
- Missing required fields → Disabled submit button
- Invalid data → Field-level error messages
- API errors → Toast notification + form preservation

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/finance/receipts/scan` | Upload receipt file |
| GET | `/api/finance/receipts/scan/:scanId` | Get scan result (polled) |
| POST | `/api/finance/receipts/scan/:scanId/confirm` | Confirm and create expense |
| POST | `/api/finance/receipts/scan/:scanId/reject` | Reject scan |
| GET | `/api/finance/receipts/scan` | Get scan history |

## State Management Hooks

### useReceiptUpload()
```typescript
{
  uploadReceipt: (file: File) => Promise<ReceiptScan | null>
  isUploading: boolean
  uploadProgress: number (0-100)
  error: string | null
  reset: () => void
}
```

### useReceiptScan(scanId, enablePolling)
```typescript
{
  scan: ReceiptScan | null
  isLoading: boolean
  error: string | null
  refetch: () => void
  // Auto-polls every 2s if status is PENDING/PROCESSING
}
```

### useConfirmScan()
```typescript
{
  confirmScan: (scanId: string, data: ConfirmScanRequest) => Promise<Expense>
  isConfirming: boolean
  error: string | null
}
```

### useRejectScan()
```typescript
{
  rejectScan: (scanId: string, reason?: string) => Promise<void>
  isRejecting: boolean
  error: string | null
}
```

### useScanHistory(filters)
```typescript
{
  scans: ReceiptScan[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
  filters: ScanHistoryFilters
  setFilters: (filters: ScanHistoryFilters) => void
  fetchHistory: (customFilters?: ScanHistoryFilters) => Promise<void>
}
```

## User Journey Example

1. **User clicks "Scan Receipt" from dashboard**
   - Navigates to `/finance/expenses/scan`

2. **User takes photo with mobile camera**
   - Clicks "Take Photo" button
   - Camera opens (rear camera)
   - Takes picture
   - Preview shows immediately

3. **User clicks "Process Receipt"**
   - Progress bar shows 0-90% (upload)
   - Progress bar shows 90-100% (processing)
   - Auto-redirects to review page

4. **System processes receipt (2-5 seconds)**
   - Shows loading spinner
   - Polls backend every 2 seconds
   - Updates when status changes to COMPLETED

5. **User reviews extracted data**
   - Sees receipt image on left
   - Sees form on right
   - Merchant: "Starbucks" (High confidence - green)
   - Date: "2024-12-02" (High confidence - green)
   - Amount: "15.50" (Medium confidence - yellow)
   - Tax: "2.95" (High confidence - green)

6. **User corrects amount**
   - Changes 15.50 to 14.50
   - Selects category: "Meals & Entertainment"
   - Adds note: "Team meeting coffee"

7. **User confirms**
   - Clicks "Confirm & Create Expense"
   - Expense created
   - Redirects to expense detail page

## Mobile Features

### Camera Capture
- Uses `capture="environment"` for rear camera
- Works on iOS Safari and Chrome Mobile
- Supports gallery selection as fallback

### Touch Optimization
- Large tap targets (44x44px minimum)
- Swipe-friendly cards
- Responsive buttons
- Touch-friendly drag zones

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Stacked layout on mobile
- Side-by-side on desktop

## Performance Features

### Upload Optimization
- Client-side file validation
- Progress tracking
- Simulated progress for better UX
- Auto-cleanup of file inputs

### Processing Optimization
- Polling with cleanup
- Auto-stop when complete
- Network error recovery
- State management optimization

### Image Handling
- FileReader API for previews
- No server roundtrip for preview
- PDF detection and special handling
- Memory cleanup on unmount
