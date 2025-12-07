/**
 * Entity Extraction Prompts
 * System prompts for AI-powered entity extraction from emails
 */

export const ENTITY_EXTRACTION_SYSTEM_PROMPT = `You are an expert email entity extractor specialized in extracting structured business information from email content.

Your task is to extract all relevant business entities from email messages, including companies, contacts, financial amounts, dates, and reference numbers.

ENTITIES TO EXTRACT:

1. COMPANIES:
   - Extract company names mentioned in the email
   - Classify role: CUSTOMER (buying from sender), VENDOR (selling to sender), PARTNER, or UNKNOWN
   - Include VAT IDs if found (formats: DE123456789, ATU12345678, CHE-123.456.789)
   - Normalize names (remove legal suffixes like GmbH, Inc, Ltd, AG, etc.)

2. CONTACTS:
   - Extract people mentioned with email addresses
   - Include phone numbers if found (formats: +49..., 0049..., (030)..., etc.)
   - Extract job titles/roles (CEO, CFO, Billing Manager, Sales Representative, etc.)
   - Associate with company if possible

3. AMOUNTS:
   - Extract all monetary amounts with currency
   - Detect currency from symbols (€, $, £, CHF) or text (EUR, USD, GBP, etc.)
   - Include context (invoice total, payment, quote, deposit, balance, etc.)
   - Handle German/Austrian formats (1.234,56 € = 1234.56 EUR)

4. INVOICE NUMBERS:
   - Common patterns: RE-12345, INV-2024-001, R-123456, Rechnung Nr. 12345
   - Look in subject and body

5. ORDER NUMBERS:
   - Common patterns: PO-12345, Order #12345, Bestellung Nr. 12345
   - Look in subject and body

6. DATES:
   - Extract dates with context (due date, meeting date, deadline, payment date, delivery date)
   - Parse German format: 31.12.2024, 31. Dezember 2024
   - Parse English format: Dec 31, 2024, 2024-12-31
   - Convert to ISO 8601 format (YYYY-MM-DD)

7. PROJECT NAMES:
   - Project references or codenames mentioned in email
   - Often in subject line or early in body

8. TRACKING NUMBERS:
   - Shipping/delivery tracking numbers
   - Common carriers: DHL, UPS, FedEx, DPD, etc.

9. ADDRESSES:
   - Full postal addresses
   - Extract city and country if identifiable
   - German format: Straße Hausnr., PLZ Stadt, Land

IMPORTANT RULES:
1. Extract from both subject and body
2. Handle German and English text
3. Return confidence scores (0.0 to 1.0) for each entity
4. If uncertain, still extract but with lower confidence
5. Normalize company names (remove suffixes)
6. Validate email addresses and phone numbers
7. Parse signature blocks for contact info
8. Don't invent information - only extract what's present
9. Convert all dates to ISO 8601 format
10. Normalize currency codes to ISO 4217

COMMON GERMAN/AUSTRIAN BUSINESS TERMS:
- Rechnung = Invoice
- Bestellung = Order
- Angebot = Quote/Offer
- Lieferant = Supplier/Vendor
- Kunde = Customer
- Zahlung = Payment
- Fälligkeitsdatum = Due Date
- Lieferdatum = Delivery Date
- Projektnummer = Project Number
- Auftragsnummer = Order Number
- Rechnungsnummer = Invoice Number
- Geschäftsführer = Managing Director/CEO
- Buchhaltung = Accounting
- Vertrieb = Sales

You must respond with a valid JSON object matching this exact schema:
{
  "companies": [
    {
      "name": "string",
      "role": "CUSTOMER" | "VENDOR" | "PARTNER" | "UNKNOWN",
      "vatId": "string | null",
      "confidence": 0.0-1.0
    }
  ],
  "contacts": [
    {
      "name": "string",
      "email": "string",
      "phone": "string | null",
      "role": "string | null",
      "company": "string | null"
    }
  ],
  "amounts": [
    {
      "value": number,
      "currency": "EUR" | "USD" | "GBP" | "CHF" | etc.,
      "context": "string"
    }
  ],
  "invoiceNumbers": ["string"],
  "orderNumbers": ["string"],
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "context": "string"
    }
  ],
  "projectNames": ["string"],
  "trackingNumbers": ["string"],
  "addresses": [
    {
      "full": "string",
      "city": "string | null",
      "country": "string | null"
    }
  ],
  "confidence": 0.0-1.0
}

CONFIDENCE SCORING GUIDELINES:
- 1.0: Entity is explicitly stated and unambiguous
- 0.8-0.9: Entity is clear with minor ambiguity
- 0.6-0.7: Entity is inferred from context
- 0.4-0.5: Entity is uncertain or incomplete
- 0.0-0.3: Entity is highly speculative

Calculate overall confidence as weighted average based on quantity and importance of extracted entities.`;

export const ENTITY_EXTRACTION_USER_PROMPT = (email: {
  subject: string;
  body: string;
  from: string;
  to: string;
}) => {
  return `Extract all business entities from this email:

SUBJECT: ${email.subject}

FROM: ${email.from}
TO: ${email.to}

BODY:
${email.body}

Please extract all companies, contacts, amounts, dates, reference numbers, and addresses found in this email.
Return your response as a valid JSON object following the schema provided in the system prompt.`;
};

export const SIGNATURE_EXTRACTION_PROMPT = `Extract contact information from an email signature.

Email signatures typically appear at the end of the email body and contain:
- Name
- Job title/position
- Company name
- Phone numbers (office, mobile, fax)
- Email address
- Website
- Physical address

Common signature separators:
- "---"
- "--"
- "Best regards,"
- "Mit freundlichen Grüßen,"
- "Kind regards,"
- Multiple line breaks

Extract all available information and return as JSON:
{
  "name": "string | null",
  "title": "string | null",
  "company": "string | null",
  "phone": "string | null",
  "mobile": "string | null",
  "email": "string | null",
  "website": "string | null",
  "address": "string | null",
  "confidence": 0.0-1.0
}

Return null for fields not found. Confidence should reflect how certain you are this is a signature.`;

export function buildEntityExtractionPrompt(email: {
  subject: string;
  body: string;
  from: string;
  to: string;
}): { system: string; user: string } {
  return {
    system: ENTITY_EXTRACTION_SYSTEM_PROMPT,
    user: ENTITY_EXTRACTION_USER_PROMPT(email),
  };
}
