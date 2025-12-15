/**
 * CRM Clients Seed Data
 *
 * Creates sample clients for testing and development:
 * - Individual clients
 * - Company clients
 * - With multiple contacts, addresses, and communications
 */

import { PrismaClient, ClientType, ClientStatus, AddressType } from '@prisma/client';

export async function seedClients(prisma: PrismaClient, organisationId: string) {
  console.log('\nSeeding CRM clients...');

  // Clean existing client data (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning existing client data...');
    await prisma.clientCommunication.deleteMany({ where: { client: { orgId: organisationId } } });
    await prisma.clientPayment.deleteMany({ where: { client: { orgId: organisationId } } });
    await prisma.clientAddress.deleteMany({ where: { client: { orgId: organisationId } } });
    await prisma.clientContact.deleteMany({ where: { client: { orgId: organisationId } } });
    await prisma.client.deleteMany({ where: { orgId: organisationId } });
    console.log('Cleaned client data\n');
  }

  // Sample Client 1: Large Company (VIP)
  const client1 = await prisma.client.create({
    data: {
      orgId: organisationId,
      clientNumber: 'CLT-001',
      type: ClientType.COMPANY,
      status: ClientStatus.ACTIVE,
      name: 'TechCorp Solutions GmbH',
      displayName: 'TechCorp',
      legalName: 'TechCorp Solutions GmbH',
      companyName: 'TechCorp Solutions GmbH',
      vatId: 'DE123456789',
      taxId: 'DE123456789',
      registrationNumber: 'HRB 12345',
      email: 'info@techcorp.de',
      phone: '+49 30 12345678',
      website: 'https://techcorp.de',
      currency: 'EUR',
      paymentTerms: 30,
      defaultPaymentTerms: 30,
      creditLimit: 50000,
      language: 'de',
      timezone: 'Europe/Berlin',
      isActive: true,
      isVip: true,
      tags: ['VIP', 'Enterprise', 'Technology'],
      notes: 'Long-term strategic partner. Always pays on time.',
      source: 'manual',

      // Create contacts
      contacts: {
        create: [
          {
            firstName: 'Max',
            lastName: 'Müller',
            fullName: 'Max Müller',
            email: 'max.mueller@techcorp.de',
            phone: '+49 30 12345678',
            mobile: '+49 171 1234567',
            position: 'CEO',
            jobTitle: 'CEO',
            department: 'Executive',
            isPrimary: true,
            isActive: true,
            isBilling: true,
            notes: 'Main decision maker',
          },
          {
            firstName: 'Anna',
            lastName: 'Schmidt',
            fullName: 'Anna Schmidt',
            email: 'anna.schmidt@techcorp.de',
            phone: '+49 30 12345679',
            mobile: '+49 172 2345678',
            position: 'CFO',
            jobTitle: 'CFO',
            department: 'Finance',
            isPrimary: false,
            isActive: true,
            isBilling: true,
            notes: 'Handles all financial matters',
          },
        ],
      },

      // Create addresses
      addresses: {
        create: [
          {
            type: AddressType.REGISTERED,
            street: 'Friedrichstraße 100',
            street2: '5th Floor',
            city: 'Berlin',
            state: 'Berlin',
            postalCode: '10117',
            country: 'DE',
            isPrimary: true,
          },
          {
            type: AddressType.BILLING,
            street: 'Hauptstraße 50',
            city: 'München',
            state: 'Bayern',
            postalCode: '80331',
            country: 'DE',
            isPrimary: false,
          },
        ],
      },
    },
  });
  console.log(`✓ Created client: ${client1.name} (${client1.clientNumber})`);

  // Sample Client 2: Medium Company
  const client2 = await prisma.client.create({
    data: {
      orgId: organisationId,
      clientNumber: 'CLT-002',
      type: ClientType.COMPANY,
      status: ClientStatus.ACTIVE,
      name: 'Design Studio Berlin',
      displayName: 'Design Studio',
      legalName: 'Design Studio Berlin UG',
      companyName: 'Design Studio Berlin UG',
      vatId: 'DE987654321',
      email: 'hello@designstudio.de',
      phone: '+49 30 98765432',
      website: 'https://designstudio.de',
      currency: 'EUR',
      paymentTerms: 14,
      defaultPaymentTerms: 14,
      creditLimit: 10000,
      language: 'de',
      timezone: 'Europe/Berlin',
      isActive: true,
      isVip: false,
      tags: ['Design', 'Creative', 'SME'],
      notes: 'Growing agency. Good payment history.',
      source: 'referral',

      contacts: {
        create: [
          {
            firstName: 'Lisa',
            lastName: 'Weber',
            fullName: 'Lisa Weber',
            email: 'lisa@designstudio.de',
            phone: '+49 30 98765432',
            mobile: '+49 173 9876543',
            position: 'Founder & Creative Director',
            jobTitle: 'Founder',
            department: 'Management',
            isPrimary: true,
            isActive: true,
            isBilling: true,
          },
        ],
      },

      addresses: {
        create: [
          {
            type: AddressType.REGISTERED,
            street: 'Kreuzbergstraße 23',
            city: 'Berlin',
            state: 'Berlin',
            postalCode: '10965',
            country: 'DE',
            isPrimary: true,
          },
        ],
      },
    },
  });
  console.log(`✓ Created client: ${client2.name} (${client2.clientNumber})`);

  // Sample Client 3: Individual (Freelancer)
  const client3 = await prisma.client.create({
    data: {
      orgId: organisationId,
      clientNumber: 'CLT-003',
      type: ClientType.INDIVIDUAL,
      status: ClientStatus.ACTIVE,
      name: 'Hans Schneider',
      displayName: 'Hans Schneider',
      email: 'hans.schneider@freelancer.de',
      phone: '+49 171 5555555',
      currency: 'EUR',
      paymentTerms: 7,
      defaultPaymentTerms: 7,
      creditLimit: 5000,
      language: 'de',
      timezone: 'Europe/Berlin',
      isActive: true,
      isVip: false,
      tags: ['Freelancer', 'Consultant'],
      notes: 'Independent business consultant. Prefers quick payment.',
      source: 'website',

      contacts: {
        create: [
          {
            firstName: 'Hans',
            lastName: 'Schneider',
            fullName: 'Hans Schneider',
            email: 'hans.schneider@freelancer.de',
            mobile: '+49 171 5555555',
            position: 'Business Consultant',
            jobTitle: 'Business Consultant',
            isPrimary: true,
            isActive: true,
            isBilling: true,
          },
        ],
      },

      addresses: {
        create: [
          {
            type: AddressType.BILLING,
            street: 'Gartenstraße 15',
            city: 'Hamburg',
            state: 'Hamburg',
            postalCode: '20095',
            country: 'DE',
            isPrimary: true,
          },
        ],
      },
    },
  });
  console.log(`✓ Created client: ${client3.name} (${client3.clientNumber})`);

  // Sample Client 4: Prospect (Not yet a customer)
  const client4 = await prisma.client.create({
    data: {
      orgId: organisationId,
      clientNumber: 'CLT-004',
      type: ClientType.COMPANY,
      status: ClientStatus.PROSPECT,
      name: 'Future Industries AG',
      displayName: 'Future Industries',
      legalName: 'Future Industries Aktiengesellschaft',
      companyName: 'Future Industries AG',
      email: 'contact@futureindustries.com',
      phone: '+41 44 1234567',
      website: 'https://futureindustries.com',
      currency: 'CHF',
      paymentTerms: 30,
      defaultPaymentTerms: 30,
      language: 'de',
      timezone: 'Europe/Zurich',
      isActive: false,
      isVip: false,
      tags: ['Prospect', 'Enterprise', 'Switzerland'],
      notes: 'Large potential client. Currently in negotiation phase.',
      source: 'cold_outreach',

      contacts: {
        create: [
          {
            firstName: 'Peter',
            lastName: 'Keller',
            fullName: 'Peter Keller',
            email: 'p.keller@futureindustries.com',
            phone: '+41 44 1234567',
            position: 'Procurement Manager',
            jobTitle: 'Procurement Manager',
            department: 'Purchasing',
            isPrimary: true,
            isActive: true,
          },
        ],
      },

      addresses: {
        create: [
          {
            type: AddressType.REGISTERED,
            street: 'Bahnhofstrasse 100',
            city: 'Zürich',
            state: 'Zürich',
            postalCode: '8001',
            country: 'CH',
            isPrimary: true,
          },
        ],
      },
    },
  });
  console.log(`✓ Created client: ${client4.name} (${client4.clientNumber})`);

  // Sample Client 5: International Client (Austria)
  const client5 = await prisma.client.create({
    data: {
      orgId: organisationId,
      clientNumber: 'CLT-005',
      type: ClientType.COMPANY,
      status: ClientStatus.ACTIVE,
      name: 'Alpine Solutions GmbH',
      displayName: 'Alpine Solutions',
      legalName: 'Alpine Solutions Gesellschaft mit beschränkter Haftung',
      companyName: 'Alpine Solutions GmbH',
      vatId: 'ATU12345678',
      taxId: 'ATU12345678',
      email: 'office@alpine-solutions.at',
      phone: '+43 1 5555555',
      website: 'https://alpine-solutions.at',
      currency: 'EUR',
      paymentTerms: 21,
      defaultPaymentTerms: 21,
      creditLimit: 15000,
      language: 'de',
      timezone: 'Europe/Vienna',
      isActive: true,
      isVip: false,
      tags: ['Austria', 'Logistics', 'Cross-border'],
      notes: 'Austrian partner company. Good relationship.',
      source: 'partner',

      contacts: {
        create: [
          {
            firstName: 'Maria',
            lastName: 'Huber',
            fullName: 'Maria Huber',
            email: 'm.huber@alpine-solutions.at',
            phone: '+43 1 5555555',
            mobile: '+43 664 1234567',
            position: 'Managing Director',
            jobTitle: 'Managing Director',
            department: 'Management',
            isPrimary: true,
            isActive: true,
            isBilling: true,
          },
        ],
      },

      addresses: {
        create: [
          {
            type: AddressType.REGISTERED,
            street: 'Mariahilfer Straße 88',
            city: 'Wien',
            state: 'Wien',
            postalCode: '1070',
            country: 'AT',
            isPrimary: true,
          },
        ],
      },
    },
  });
  console.log(`✓ Created client: ${client5.name} (${client5.clientNumber})`);

  console.log('\n✓ Successfully seeded 5 clients with contacts and addresses');

  return {
    clients: [client1, client2, client3, client4, client5],
  };
}
