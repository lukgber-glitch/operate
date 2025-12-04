# Email Notification Templates

This directory contains HTML email templates for the Operate notification system.

## Templates

### 1. Base Template (`base.template.ts`)
The foundation for all email templates featuring:
- Responsive design (desktop & mobile)
- Company branding placeholders (logo, name, address)
- Professional header with gradient
- Styled CTA buttons
- Info/Warning/Success message boxes
- Professional footer with unsubscribe link

### 2. Invoice Reminder (`invoice-reminder.template.ts`)
For due and overdue invoice notifications:
- Customer details
- Invoice amount and number
- Due date and days overdue (if applicable)
- Payment link integration
- Different urgency levels (due vs. overdue)

### 3. Tax Deadline (`tax-deadline.template.ts`)
VAT and tax filing deadline alerts:
- Tax type (VAT, Income Tax, Corporate Tax, etc.)
- Filing period and deadline
- Days remaining countdown
- Estimated amount due
- Country-specific information
- Urgent warnings for imminent deadlines
- Preparation checklist

### 4. Document Processed (`document-processed.template.ts`)
AI document classification completion:
- Document name and type
- Classification result with confidence score
- Extracted field data (invoice number, amount, etc.)
- Review recommendations for low-confidence results
- Next steps guidance

### 5. Weekly Summary (`weekly-summary.template.ts`)
Weekly financial summary and insights:
- Revenue, expenses, and net profit
- Period-over-period comparison
- Invoice activity statistics
- Top expense categories breakdown
- Upcoming deadlines
- Actionable tips and recommendations

### 6. Welcome (`welcome.template.ts`)
Onboarding welcome email:
- Account activation link
- Account type and details
- Feature highlights with icons
- Getting started checklist
- Resource links (documentation, guides)
- Support contact information

## Template Service (`template.service.ts`)

The `TemplateService` provides:

### Methods

#### `render(templateType, variables): string`
Renders a template with provided variables.

```typescript
const html = templateService.render('invoice-reminder', {
  customerName: 'John Doe',
  invoiceNumber: 'INV-2024-001',
  invoiceAmount: '1,250.00',
  currency: 'EUR',
  dueDate: '2024-12-15',
  invoiceLink: 'https://app.operate.com/invoices/123',
});
```

#### `validateVariables(templateType, variables): boolean`
Validates that all required variables are present.

```typescript
templateService.validateVariables('tax-deadline', variables);
// Throws error if required fields are missing
```

#### `getPreview(templateType): string`
Generates a preview with sample data for testing.

```typescript
const preview = templateService.getPreview('welcome');
// Returns rendered HTML with sample data
```

#### `getAvailableTemplates(): TemplateType[]`
Lists all available template types.

```typescript
const templates = templateService.getAvailableTemplates();
// ['invoice-reminder', 'tax-deadline', 'document-processed', 'weekly-summary', 'welcome']
```

## Usage Example

```typescript
import { TemplateService } from './templates/template.service';

@Injectable()
export class EmailService {
  constructor(private templateService: TemplateService) {}

  async sendInvoiceReminder(invoice: Invoice) {
    const html = this.templateService.render('invoice-reminder', {
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
      invoiceAmount: invoice.total.toFixed(2),
      currency: invoice.currency,
      dueDate: invoice.dueDate.toISOString(),
      daysOverdue: invoice.getDaysOverdue(),
      invoiceLink: `${process.env.APP_URL}/invoices/${invoice.id}`,
      companyName: 'Your Company',
    });

    await this.mailer.send({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.number} Reminder`,
      html,
    });
  }
}
```

## Template Variables

### Base Variables (available in all templates)
- `companyName` - Company name (default: 'Operate')
- `companyLogo` - URL to company logo
- `companyAddress` - Company address
- `year` - Current year
- `unsubscribeLink` - Link to unsubscribe

### Invoice Reminder
- `customerName` (required)
- `invoiceNumber` (required)
- `invoiceAmount` (required)
- `currency` (required)
- `dueDate` (required)
- `invoiceLink` (required)
- `daysOverdue` (optional)
- `paymentLink` (optional)

### Tax Deadline
- `recipientName` (required)
- `taxType` (required)
- `period` (required)
- `deadline` (required)
- `daysRemaining` (required)
- `country` (required)
- `estimatedAmount` (optional)
- `currency` (optional)
- `filingLink` (optional)

### Document Processed
- `recipientName` (required)
- `documentName` (required)
- `documentType` (required)
- `uploadDate` (required)
- `processedDate` (required)
- `classification` (required)
- `confidence` (required)
- `documentLink` (required)
- `extractedFields` (optional)
- `requiresReview` (optional)
- `reviewLink` (optional)

### Weekly Summary
- `recipientName` (required)
- `weekStart` (required)
- `weekEnd` (required)
- `totalRevenue` (required)
- `totalExpenses` (required)
- `netProfit` (required)
- `currency` (required)
- `dashboardLink` (required)
- `revenueChange` (optional)
- `expensesChange` (optional)
- `invoicesSent` (optional)
- `invoicesPaid` (optional)
- `invoicesOverdue` (optional)
- `documentsProcessed` (optional)
- `upcomingDeadlines` (optional)
- `topExpenseCategories` (optional)

### Welcome
- `userName` (required)
- `userEmail` (required)
- `accountType` (required)
- `dashboardLink` (required)
- `activationLink` (optional)
- `supportEmail` (optional)
- `gettingStartedLink` (optional)
- `documentationLink` (optional)
- `features` (optional)

## Design Features

### Responsive Design
All templates are mobile-responsive with:
- Fluid layouts that adapt to screen size
- Touch-friendly buttons and links
- Readable font sizes on all devices

### Visual Elements
- Gradient headers (purple to violet)
- Color-coded message boxes:
  - Info (blue) - General information
  - Warning (orange) - Urgent actions required
  - Success (green) - Completed actions
- Professional typography
- Consistent spacing and alignment

### Accessibility
- Semantic HTML
- Sufficient color contrast
- Alt text for images
- Clear call-to-action buttons

## Testing Templates

To test templates in development:

```typescript
// Generate preview HTML
const previewHtml = templateService.getPreview('invoice-reminder');

// Save to file for browser testing
fs.writeFileSync('preview.html', previewHtml);
```

## Customization

To customize templates:

1. **Branding**: Update base variables in your email service
2. **Colors**: Modify CSS in `base.template.ts`
3. **Layout**: Edit individual template files
4. **New Templates**: Follow the existing pattern and add to `TemplateService`

## Integration with NotificationsModule

The `TemplateService` is automatically available when you import `NotificationsModule`:

```typescript
@Module({
  imports: [NotificationsModule],
})
export class YourModule {}
```

Then inject it anywhere in your module:

```typescript
constructor(private templateService: TemplateService) {}
```
