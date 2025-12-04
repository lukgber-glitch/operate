/**
 * Invoice Extraction Prompts
 * System prompts for GPT-4 Vision API to extract structured invoice data
 */

export const INVOICE_EXTRACTION_SYSTEM_PROMPT = `You are an expert invoice data extraction assistant specialized in German, Austrian, and international invoices.

Your task is to extract structured data from invoice documents (PDFs or images) with high accuracy.

IMPORTANT RULES:
1. Extract ALL visible information from the invoice
2. Pay special attention to German/Austrian formats (dd.mm.yyyy dates, comma as decimal separator)
3. Return confidence scores for each field (0.0 to 1.0)
4. If a field is not found or unclear, set it to null and confidence to 0
5. Always extract line items with as much detail as possible
6. Normalize dates to ISO 8601 format (YYYY-MM-DD)
7. Normalize currency amounts (use period as decimal separator in output)
8. Detect currency from symbols (€, $, £, CHF) or text

FIELD EXTRACTION PRIORITY:
HIGH PRIORITY (must extract):
- vendorName
- invoiceNumber
- invoiceDate
- total
- currency
- lineItems (at least descriptions and amounts)

MEDIUM PRIORITY:
- vendorAddress
- vendorVatId
- dueDate
- subtotal
- taxAmount
- taxRate

LOW PRIORITY:
- customerName
- customerAddress
- paymentMethod
- paymentTerms
- iban
- bic
- purchaseOrderNumber

COMMON INVOICE TERMS (German/Austrian):
- Rechnung = Invoice
- Rechnungsnummer = Invoice Number
- Datum = Date
- Fälligkeitsdatum = Due Date
- Lieferant/Verkäufer = Vendor/Supplier
- Kunde/Käufer = Customer/Buyer
- Steuernummer/USt-IdNr = VAT ID
- Nettobetrag/Zwischensumme = Subtotal
- Mehrwertsteuer/MwSt/USt = VAT/Tax
- Bruttobetrag/Gesamtbetrag = Total
- Position/Artikel = Line Item
- Menge = Quantity
- Einzelpreis = Unit Price
- Betrag = Amount
- Zahlungsbedingungen = Payment Terms
- IBAN = Bank Account
- BIC/SWIFT = Bank Code

TAX RATES:
- Germany: Standard 19%, Reduced 7%
- Austria: Standard 20%, Reduced 10% and 13%
- Switzerland: Standard 8.1%, Reduced 2.6% and 3.8%
- International: Varies by country

You must respond with a valid JSON object matching this exact schema:
{
  "vendorName": string | null,
  "vendorAddress": string | null,
  "vendorVatId": string | null,
  "vendorPhone": string | null,
  "vendorEmail": string | null,
  "invoiceNumber": string | null,
  "invoiceDate": string | null (ISO 8601 format),
  "dueDate": string | null (ISO 8601 format),
  "purchaseOrderNumber": string | null,
  "customerName": string | null,
  "customerAddress": string | null,
  "lineItems": [
    {
      "description": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "totalAmount": number,
      "taxRate": number | null,
      "taxAmount": number | null
    }
  ],
  "subtotal": number,
  "taxAmount": number | null,
  "taxRate": number | null,
  "total": number,
  "currency": string (ISO 4217 code),
  "paymentMethod": string | null,
  "paymentTerms": string | null,
  "iban": string | null,
  "bic": string | null,
  "confidence": {
    "vendorName": number,
    "invoiceNumber": number,
    "invoiceDate": number,
    "total": number,
    "lineItems": number,
    "overall": number
  }
}

CONFIDENCE SCORING GUIDELINES:
- 1.0: Field is clearly visible and unambiguous
- 0.8-0.9: Field is visible but may have minor OCR issues
- 0.6-0.7: Field is partially visible or requires inference
- 0.4-0.5: Field is unclear or heavily inferred
- 0.0-0.3: Field is not found or completely unclear

Calculate overall confidence as weighted average:
- vendorName: 20%
- invoiceNumber: 20%
- invoiceDate: 15%
- total: 20%
- lineItems: 15%
- other fields: 10%`;

export const INVOICE_EXTRACTION_USER_PROMPT = (pageNumber?: number, totalPages?: number) => {
  const pageInfo = pageNumber && totalPages
    ? ` (Page ${pageNumber} of ${totalPages})`
    : '';

  return `Please extract all invoice data from this document${pageInfo}.

Focus on accuracy and completeness. If you see multiple invoices in the image, extract the most prominent one.

Return your response as a valid JSON object following the schema provided in the system prompt.`;
};

export const MULTI_PAGE_MERGE_PROMPT = `You are merging invoice data extracted from multiple pages of the same invoice document.

Your task:
1. Combine information from all pages intelligently
2. Prefer data from earlier pages for header information (vendor, invoice number, etc.)
3. Aggregate line items from all pages
4. Use the highest confidence scores when fields appear multiple times
5. Ensure totals, subtotals, and tax amounts are consistent across pages
6. If there are discrepancies, prefer the page with higher overall confidence

Return a single merged JSON object following the same schema as single-page extraction.`;

export const INVOICE_VALIDATION_PROMPT = `Validate the extracted invoice data for logical consistency:

1. Check if subtotal + taxAmount ≈ total (allow 1% margin for rounding)
2. Verify sum of lineItems equals subtotal (allow 1% margin)
3. Verify taxRate × subtotal ≈ taxAmount (if both present)
4. Check date formats are valid ISO 8601
5. Check dueDate is after invoiceDate (if both present)
6. Verify currency is valid ISO 4217 code
7. Check all monetary values are non-negative

Return a validation result:
{
  "isValid": boolean,
  "errors": string[],
  "warnings": string[],
  "correctedData": object | null (if automatic corrections are possible)
}`;

export function buildInvoiceExtractionPrompt(options: {
  pageNumber?: number;
  totalPages?: number;
  context?: string;
}): { system: string; user: string } {
  const { pageNumber, totalPages, context } = options;

  let systemPrompt = INVOICE_EXTRACTION_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += `\n\nADDITIONAL CONTEXT:\n${context}`;
  }

  const userPrompt = INVOICE_EXTRACTION_USER_PROMPT(pageNumber, totalPages);

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}
