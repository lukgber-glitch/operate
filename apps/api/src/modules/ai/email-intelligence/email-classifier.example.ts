/**
 * Email Classifier Service - Usage Examples
 *
 * This file demonstrates how to use the EmailClassifierService
 * for classifying business emails.
 */

import { EmailClassifierService } from './email-classifier.service';
import { EmailInput, EmailClassification, EmailPriority } from './types/email-classification.types';

/**
 * Example 1: Classify a simple invoice email
 */
export async function exampleClassifyInvoice(service: EmailClassifierService) {
  const email: EmailInput = {
    subject: 'Rechnung Nr. 2024-001 - Fälligkeit 15.06.2024',
    body: `
      Sehr geehrte Damen und Herren,

      anbei erhalten Sie unsere Rechnung Nr. 2024-001 über €1,250.00.
      Zahlungsziel: 15.06.2024

      Mit freundlichen Grüßen,
      Buchhaltung Example GmbH
    `,
    from: 'buchhaltung@example-vendor.de',
    to: 'info@mycompany.com',
    hasAttachments: true,
    attachmentTypes: ['application/pdf'],
    attachmentNames: ['Rechnung_2024-001.pdf'],
  };

  const result = await service.classifyEmail(email);

  console.log('Invoice Email Classification:');
  console.log(`  Classification: ${result.classification}`); // Expected: INVOICE_RECEIVED
  console.log(`  Confidence: ${result.confidence}`); // Expected: > 0.9
  console.log(`  Priority: ${result.priority}`); // Expected: HIGH
  console.log(`  Suggested Action: ${result.suggestedAction}`); // Expected: CREATE_BILL
  console.log(`  Extracted Intent: ${result.extractedIntent}`);
  console.log(`  Extracted Entities:`, result.extractedEntities);

  return result;
}

/**
 * Example 2: Classify a customer inquiry email
 */
export async function exampleClassifyInquiry(service: EmailClassifierService) {
  const email: EmailInput = {
    subject: 'Question about your consulting services',
    body: `
      Hi,

      I'm interested in your consulting services for my small business.
      Could you provide more information about pricing and packages?

      Best regards,
      John Smith
      CEO, Smith Consulting Ltd
    `,
    from: 'john@smithconsulting.com',
    to: 'sales@mycompany.com',
    hasAttachments: false,
  };

  const result = await service.classifyEmail(email);

  console.log('Inquiry Email Classification:');
  console.log(`  Classification: ${result.classification}`); // Expected: CUSTOMER_INQUIRY or QUOTE_REQUEST
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Priority: ${result.priority}`); // Expected: MEDIUM or HIGH
  console.log(`  Suggested Action: ${result.suggestedAction}`); // Expected: RESPOND_TO_INQUIRY or SEND_QUOTE

  return result;
}

/**
 * Example 3: Classify a payment confirmation
 */
export async function exampleClassifyPayment(service: EmailClassifierService) {
  const email: EmailInput = {
    subject: 'Payment Confirmation - Invoice #12345',
    body: `
      Dear Customer,

      Thank you for your payment of €500.00 for invoice #12345.
      Payment method: Bank transfer
      Transaction ID: TXN-2024-5678

      This payment has been successfully processed.

      Best regards,
      Accounting Department
    `,
    from: 'payments@vendor.com',
    to: 'accounts@mycompany.com',
    hasAttachments: false,
  };

  const result = await service.classifyEmail(email);

  console.log('Payment Email Classification:');
  console.log(`  Classification: ${result.classification}`); // Expected: PAYMENT_SENT or PAYMENT_RECEIVED
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Priority: ${result.priority}`);
  console.log(`  Suggested Action: ${result.suggestedAction}`); // Expected: RECORD_PAYMENT
  console.log(`  Extracted Entities:`, result.extractedEntities);

  return result;
}

/**
 * Example 4: Batch classify multiple emails
 */
export async function exampleBatchClassify(service: EmailClassifierService) {
  const emails: EmailInput[] = [
    {
      subject: 'Rechnung 2024-001',
      body: 'Anbei unsere Rechnung über €1000',
      from: 'vendor@example.de',
      to: 'info@mycompany.com',
      hasAttachments: true,
      attachmentTypes: ['application/pdf'],
    },
    {
      subject: 'Quote Request for 100 units',
      body: 'We need a quote for 100 units of product X',
      from: 'customer@example.com',
      to: 'sales@mycompany.com',
      hasAttachments: false,
    },
    {
      subject: 'Issue with recent order',
      body: 'We have an issue with our last order. Please help.',
      from: 'customer@problem.com',
      to: 'support@mycompany.com',
      hasAttachments: false,
    },
  ];

  const results = await service.classifyBatch(emails);

  console.log(`Batch Classification Results (${results.length} emails):`);
  results.forEach((result, idx) => {
    console.log(`\nEmail ${idx + 1}:`);
    console.log(`  Classification: ${result.classification}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Priority: ${result.priority}`);
    console.log(`  Suggested Action: ${result.suggestedAction}`);
  });

  return results;
}

/**
 * Example 5: Classify and store in database
 */
export async function exampleClassifyAndStore(
  service: EmailClassifierService,
  emailId: string,
) {
  // Classify email from database and store result
  const result = await service.classifyAndStore(emailId, {
    useCache: true, // Use cached classification if available
    forceReclassify: false, // Don't reclassify if already classified
    includeBody: true, // Include full body for better accuracy
  });

  console.log('Classification stored in database:');
  console.log(`  Email ID: ${emailId}`);
  console.log(`  Classification: ${result.classification}`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Priority: ${result.priority}`);

  // Check if needs review
  const needsReview = service.needsReview(result);
  console.log(`  Needs Review: ${needsReview}`);

  if (needsReview) {
    const reviewPriority = service.getReviewPriority(result);
    console.log(`  Review Priority: ${reviewPriority}/100`);
  }

  return result;
}

/**
 * Example 6: Batch classify and store multiple emails
 */
export async function exampleBatchClassifyAndStore(
  service: EmailClassifierService,
  emailIds: string[],
) {
  const results = await service.classifyAndStoreBatch(emailIds, {
    useCache: true,
  });

  console.log(`Batch classified and stored ${results.length} emails`);

  // Get statistics
  const needsReview = results.filter((r: any) => service.needsReview(r));
  const highPriority = results.filter((r: any) => r.priority === EmailPriority.HIGH || r.priority === EmailPriority.CRITICAL);

  console.log(`  Needs Review: ${needsReview.length}`);
  console.log(`  High Priority: ${highPriority.length}`);

  return results;
}

/**
 * Example 7: Get classification statistics for organization
 */
export async function exampleGetStats(
  service: EmailClassifierService,
  orgId: string,
) {
  const stats = await service.getClassificationStats(orgId);

  console.log('Classification Statistics:');
  console.log(`  Total Emails: ${stats.total}`);
  console.log(`  Classified: ${stats.classified}`);
  console.log(`  Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  console.log(`  Needs Review: ${stats.needsReview}`);

  console.log('\n  By Classification:');
  Object.entries(stats.byClassification)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .forEach(([category, count]) => {
      console.log(`    ${category}: ${count}`);
    });

  console.log('\n  By Priority:');
  Object.entries(stats.byPriority)
    .forEach(([priority, count]) => {
      console.log(`    ${priority}: ${count}`);
    });

  return stats;
}

/**
 * Sample email data for testing
 */
export const sampleEmails = {
  germanInvoice: {
    subject: 'Rechnung Nr. 2024-001 - Fälligkeit 15.06.2024',
    body: 'Sehr geehrte Damen und Herren, anbei erhalten Sie unsere Rechnung...',
    from: 'buchhaltung@vendor.de',
    to: 'info@mycompany.com',
    hasAttachments: true,
    attachmentTypes: ['application/pdf'],
    attachmentNames: ['Rechnung_2024-001.pdf'],
  },

  englishInvoice: {
    subject: 'Invoice #INV-2024-5678 - Due June 30, 2024',
    body: 'Dear Customer, Please find attached our invoice for $2,500.00...',
    from: 'billing@vendor.com',
    to: 'accounts@mycompany.com',
    hasAttachments: true,
    attachmentTypes: ['application/pdf'],
    attachmentNames: ['Invoice-INV-2024-5678.pdf'],
  },

  paymentReminder: {
    subject: '2nd Reminder: Invoice 12345 overdue',
    body: 'This is your second payment reminder. Amount due: €500. Please pay immediately.',
    from: 'accounts@vendor.com',
    to: 'finance@mycompany.com',
    hasAttachments: false,
  },

  quoteRequest: {
    subject: 'RFQ: 100 units of Product X',
    body: 'Hi, We would like to request a quote for 100 units of Product X. Please advise on pricing and delivery time.',
    from: 'purchasing@customer.com',
    to: 'sales@mycompany.com',
    hasAttachments: false,
  },

  customerComplaint: {
    subject: 'URGENT: Problem with order #12345',
    body: 'We received a defective product in our last order. This is unacceptable! Please resolve immediately or we will seek refund.',
    from: 'manager@customer.com',
    to: 'support@mycompany.com',
    hasAttachments: true,
    attachmentTypes: ['image/jpeg'],
    attachmentNames: ['defect-photo.jpg'],
  },

  newsletter: {
    subject: 'Our Monthly Newsletter - June 2024',
    body: 'Check out our latest products and special offers! Click here to unsubscribe.',
    from: 'marketing@vendor.com',
    to: 'info@mycompany.com',
    hasAttachments: false,
  },

  contractSigned: {
    subject: 'Signed Contract - Service Agreement 2024',
    body: 'Please find attached the signed service agreement. Both parties have signed.',
    from: 'legal@customer.com',
    to: 'contracts@mycompany.com',
    hasAttachments: true,
    attachmentTypes: ['application/pdf'],
    attachmentNames: ['Service-Agreement-2024-Signed.pdf'],
  },
};
