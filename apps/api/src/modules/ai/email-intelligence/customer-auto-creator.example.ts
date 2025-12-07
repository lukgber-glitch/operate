/**
 * Customer Auto-Creator Service - Usage Examples
 * Demonstrates how to automatically create/update customer profiles from emails
 */

import { CustomerAutoCreatorService } from './customer-auto-creator.service';
import { EmailClassifierService } from './email-classifier.service';
import { EntityExtractorService } from './entity-extractor.service';

/**
 * Example 1: Process a quote request email
 * Expected: Creates new customer with LEAD status
 */
async function processQuoteRequestEmail(
  customerAutoCreator: CustomerAutoCreatorService,
  emailClassifier: EmailClassifierService,
  entityExtractor: EntityExtractorService,
) {
  const email = {
    subject: 'Request for Quote - Website Development',
    body: `
      Hello,

      We're interested in getting a quote for a new website development project.
      We need an e-commerce platform with payment integration.

      Please send us your pricing and timeline.

      Best regards,
      John Smith
      CEO
      Acme Corporation
      john.smith@acme-corp.com
      +1-555-123-4567
    `,
    from: 'john.smith@acme-corp.com',
    to: 'sales@yourcompany.com',
  };

  const orgId = 'org_123';

  // Step 1: Classify email
  const classification = await emailClassifier.classifyEmail({
    ...email,
    hasAttachments: false,
  });

  console.log('Classification:', classification.classification); // QUOTE_REQUEST

  // Step 2: Extract entities
  const entities = await entityExtractor.extractEntities(email);

  console.log('Extracted companies:', entities.companies);
  console.log('Extracted contacts:', entities.contacts);

  // Step 3: Auto-create/update customer
  const result = await customerAutoCreator.processEmail(
    email,
    classification,
    entities,
    orgId,
  );

  console.log('Customer creation result:', result);
  /*
   * Expected output:
   * {
   *   customer: {
   *     id: 'cust_xyz',
   *     name: 'Acme Corporation',
   *     email: 'john.smith@acme-corp.com',
   *     phone: '+15551234567',
   *     metadata: {
   *       source: 'EMAIL_AUTO_CREATED',
   *       status: 'LEAD',
   *       contacts: [{
   *         name: 'John Smith',
   *         email: 'john.smith@acme-corp.com',
   *         role: 'CEO'
   *       }]
   *     }
   *   },
   *   action: 'CREATED',
   *   changes: [
   *     'Created customer: Acme Corporation',
   *     'Status: LEAD',
   *     'Added contact: John Smith (john.smith@acme-corp.com)'
   *   ]
   * }
   */
}

/**
 * Example 2: Process an invoice sent email
 * Expected: Creates/updates customer with ACTIVE status
 */
async function processInvoiceSentEmail(
  customerAutoCreator: CustomerAutoCreatorService,
  emailClassifier: EmailClassifierService,
  entityExtractor: EntityExtractorService,
) {
  const email = {
    subject: 'Invoice #INV-2024-123',
    body: `
      Dear Jane Doe,

      Please find attached invoice #INV-2024-123 for $5,000.00
      Due date: January 15, 2025

      Payment details:
      Bank: Example Bank
      Account: 12345678

      Thank you for your business!

      Best regards,
      Billing Department
    `,
    from: 'billing@yourcompany.com',
    to: 'jane.doe@betacorp.com',
  };

  const orgId = 'org_123';

  const classification = await emailClassifier.classifyEmail({
    ...email,
    hasAttachments: true,
    attachmentNames: ['invoice-123.pdf'],
  });

  const entities = await entityExtractor.extractEntities(email);

  const result = await customerAutoCreator.processEmail(
    email,
    classification,
    entities,
    orgId,
  );

  console.log('Result:', result);
  /*
   * If customer exists:
   * {
   *   action: 'UPDATED',
   *   changes: ['Promoted from LEAD to ACTIVE customer']
   * }
   *
   * If customer doesn't exist:
   * {
   *   action: 'CREATED',
   *   changes: ['Created customer: Beta Corp', 'Status: ACTIVE']
   * }
   */
}

/**
 * Example 3: Multiple emails from same domain
 * Expected: Adds new contact to existing customer
 */
async function processMultipleContactsFromSameDomain(
  customerAutoCreator: CustomerAutoCreatorService,
  emailClassifier: EmailClassifierService,
  entityExtractor: EntityExtractorService,
) {
  const orgId = 'org_123';

  // First email from john@acme-corp.com
  const email1 = {
    subject: 'Quote Request',
    body: 'We need a quote...\n\nJohn Smith\njohn@acme-corp.com',
    from: 'john@acme-corp.com',
    to: 'sales@yourcompany.com',
  };

  const classification1 = await emailClassifier.classifyEmail({
    ...email1,
    hasAttachments: false,
  });
  const entities1 = await entityExtractor.extractEntities(email1);

  const result1 = await customerAutoCreator.processEmail(
    email1,
    classification1,
    entities1,
    orgId,
  );

  console.log('First email result:', result1.action); // CREATED

  // Second email from sarah@acme-corp.com (same domain)
  const email2 = {
    subject: 'Follow-up on Quote',
    body:
      'Following up on the quote request...\n\nSarah Johnson\nCFO\nsarah@acme-corp.com',
    from: 'sarah@acme-corp.com',
    to: 'sales@yourcompany.com',
  };

  const classification2 = await emailClassifier.classifyEmail({
    ...email2,
    hasAttachments: false,
  });
  const entities2 = await entityExtractor.extractEntities(email2);

  const result2 = await customerAutoCreator.processEmail(
    email2,
    classification2,
    entities2,
    orgId,
  );

  console.log('Second email result:', result2);
  /*
   * Expected:
   * {
   *   action: 'UPDATED',
   *   changes: ['Added 1 new contact(s)'],
   *   customer: {
   *     name: 'Acme Corporation',
   *     metadata: {
   *       contacts: [
   *         { name: 'John Smith', email: 'john@acme-corp.com' },
   *         { name: 'Sarah Johnson', email: 'sarah@acme-corp.com', role: 'CFO' }
   *       ]
   *     }
   *   }
   * }
   */
}

/**
 * Example 4: Manual customer matching
 * Use the matcher service directly to check for existing customers
 */
async function manualCustomerMatching(customerAutoCreator: CustomerAutoCreatorService) {
  const orgId = 'org_123';

  // Check if customer exists before processing
  const existingCustomer = await customerAutoCreator.matchToExistingCustomer(
    'Acme Corporation',
    'john@acme-corp.com',
    orgId,
  );

  if (existingCustomer) {
    console.log('Found existing customer:', existingCustomer.name);
    console.log('Customer ID:', existingCustomer.id);
    console.log('Current status:', existingCustomer.metadata?.status);
  } else {
    console.log('No existing customer found - will create new one');
  }
}

/**
 * Customer Detection Rules Reference:
 *
 * 1. QUOTE_REQUEST from unknown sender
 *    → Create Customer with status: LEAD
 *
 * 2. INVOICE_SENT to recipient
 *    → Create/Update Customer with status: ACTIVE
 *
 * 3. PAYMENT_RECEIVED from sender
 *    → Update Customer (mark as paying customer, status: ACTIVE)
 *
 * 4. Multiple emails from same domain
 *    → Group as single Customer with multiple contacts
 *
 * 5. Customer matching priority:
 *    - VAT ID (100% confidence)
 *    - Exact email (95% confidence)
 *    - Email domain (80% confidence)
 *    - Fuzzy company name (70%+ confidence)
 */
