/**
 * Entity Extractor Service - Usage Examples
 *
 * This file demonstrates how to use the EntityExtractorService
 */

import { EntityExtractorService } from './entity-extractor.service';
import { EmailInput } from './types/extracted-entities.types';

/**
 * Example: Extract entities from a single email
 */
export async function extractFromSingleEmail(
  service: EntityExtractorService,
): Promise<void> {
  const email: EmailInput = {
    subject: 'Rechnung RE-2024-12345 - Projekt Alpha',
    from: 'billing@acme-gmbh.de',
    to: 'finance@mycompany.com',
    body: `
Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung für unsere Dienstleistungen im November 2024.

Rechnungsnummer: RE-2024-12345
Rechnungsdatum: 01.12.2024
Fälligkeitsdatum: 31.12.2024

Projektnummer: ALPHA-2024
Gesamtbetrag: 5.420,00 EUR

Bitte überweisen Sie den Betrag auf folgendes Konto:
IBAN: DE89 3704 0044 0532 0130 00
BIC: COBADEFFXXX

Mit freundlichen Grüßen,

Max Mustermann
Leiter Finanzen
ACME Solutions GmbH
Musterstraße 123
10115 Berlin
Deutschland

Tel: +49 30 12345678
Mobil: +49 170 9876543
Email: m.mustermann@acme-gmbh.de
Web: www.acme-solutions.de
USt-IdNr: DE123456789
    `,
  };

  const entities = await service.extractEntities(email);

  console.log('Extracted Entities:');
  console.log('- Companies:', entities.companies);
  console.log('- Contacts:', entities.contacts);
  console.log('- Amounts:', entities.amounts);
  console.log('- Invoice Numbers:', entities.invoiceNumbers);
  console.log('- Dates:', entities.dates);
  console.log('- Project Names:', entities.projectNames);
  console.log('- Overall Confidence:', entities.overallConfidence);
}

/**
 * Example: Extract entities from multiple emails in batch
 */
export async function extractFromBatch(
  service: EntityExtractorService,
): Promise<void> {
  const emails: EmailInput[] = [
    {
      subject: 'Invoice #INV-001 - December Services',
      from: 'accounts@vendor1.com',
      to: 'ap@company.com',
      body: 'Please find attached invoice INV-001 for $2,500.00 due by Dec 31, 2024.',
    },
    {
      subject: 'Bestellung #ORD-456 bestätigt',
      from: 'sales@supplier.de',
      to: 'purchasing@company.de',
      body: 'Ihre Bestellung ORD-456 über 1.850,00 EUR wurde bestätigt.',
    },
    {
      subject: 'Meeting Request - Project Phoenix',
      from: 'john.doe@partner.com',
      to: 'team@company.com',
      body: 'Let\'s schedule a meeting for Jan 15, 2025 to discuss Project Phoenix.',
    },
  ];

  const results = await service.extractBatch(emails);

  results.forEach((entities, index) => {
    console.log(`\nEmail ${index + 1}:`);
    console.log('- Companies:', entities.companies.length);
    console.log('- Contacts:', entities.contacts.length);
    console.log('- Amounts:', entities.amounts.length);
  });
}

/**
 * Example: Extract signature information
 */
export async function extractSignature(
  service: EntityExtractorService,
): Promise<void> {
  const emailBody = `
Hi there,

Thanks for your inquiry. I'll get back to you soon.

Best regards,

Anna Schmidt
Senior Account Manager
TechCorp Deutschland GmbH
Hauptstraße 45, 80331 München

Phone: +49 89 12345678
Mobile: +49 170 1234567
Email: a.schmidt@techcorp.de
Website: www.techcorp.de
  `;

  const signature = await service.extractFromSignature(emailBody);

  console.log('Extracted Signature:');
  console.log('- Name:', signature.name);
  console.log('- Title:', signature.title);
  console.log('- Company:', signature.company);
  console.log('- Phone:', signature.phone);
  console.log('- Email:', signature.email);
  console.log('- Confidence:', signature.confidence);
}

/**
 * Example: Process synced email and store extracted entities
 */
export async function processAndStoreEntities(
  service: EntityExtractorService,
  prisma: any, // PrismaService
  syncedEmail: any, // SyncedEmail from database
): Promise<void> {
  // Extract entities from synced email
  const emailInput: EmailInput = {
    subject: syncedEmail.subject || '',
    body: syncedEmail.bodyPreview || syncedEmail.snippet || '',
    from: syncedEmail.from || '',
    to: syncedEmail.to[0] || '',
    cc: syncedEmail.cc,
    date: syncedEmail.receivedAt,
  };

  const entities = await service.extractEntities(emailInput);

  // Store in database
  await prisma.emailExtractedEntities.create({
    data: {
      emailId: syncedEmail.id,
      orgId: syncedEmail.orgId,
      userId: syncedEmail.userId,
      entities: entities as any, // Store full entities as JSON
      companyNames: entities.companies.map((c) => c.name),
      contactEmails: entities.contacts.map((c) => c.email),
      invoiceNumbers: entities.invoiceNumbers,
      orderNumbers: entities.orderNumbers,
      overallConfidence: entities.overallConfidence,
      status: 'COMPLETED',
    },
  });

  console.log(`Stored entities for email ${syncedEmail.id}`);
}

/**
 * Example: Query emails by extracted entities
 */
export async function queryByEntities(prisma: any): Promise<void> {
  // Find emails from a specific company
  const emailsFromAcme = await prisma.emailExtractedEntities.findMany({
    where: {
      companyNames: {
        has: 'ACME Solutions', // Array contains check
      },
    },
    include: {
      email: true, // Include the full email
    },
  });

  console.log(`Found ${emailsFromAcme.length} emails from ACME Solutions`);

  // Find emails with specific invoice number
  const invoiceEmails = await prisma.emailExtractedEntities.findMany({
    where: {
      invoiceNumbers: {
        has: 'RE-2024-12345',
      },
    },
    include: {
      email: true,
    },
  });

  console.log(`Found ${invoiceEmails.length} emails with invoice RE-2024-12345`);

  // Find emails with contact email
  const contactEmails = await prisma.emailExtractedEntities.findMany({
    where: {
      contactEmails: {
        has: 'm.mustermann@acme-gmbh.de',
      },
    },
    include: {
      email: true,
    },
  });

  console.log(`Found ${contactEmails.length} emails from contact`);
}
