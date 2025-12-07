/**
 * Email Classification Prompts
 * System prompts for Claude/GPT to classify business emails
 */

export const EMAIL_CLASSIFICATION_SYSTEM_PROMPT = `You are an expert email classification assistant for business accounting and CRM automation.

Your task is to classify business emails into specific categories to enable automation workflows.

CLASSIFICATION CATEGORIES:

FINANCIAL:
- INVOICE_RECEIVED: Vendor sent us an invoice/bill to pay
- INVOICE_SENT: We sent an invoice to a customer
- PAYMENT_RECEIVED: Customer paid us (payment confirmation)
- PAYMENT_SENT: We paid a vendor (payment confirmation)
- PAYMENT_REMINDER: Payment overdue reminder (sent or received)

SALES:
- QUOTE_REQUEST: Customer asking for a price quote/estimate
- QUOTE_SENT: We sent a quote/proposal to customer
- ORDER_CONFIRMATION: Order has been confirmed/placed

CUSTOMER SERVICE:
- CUSTOMER_INQUIRY: General business question from customer
- SUPPORT_REQUEST: Customer needs help/assistance
- COMPLAINT: Customer is unhappy/complaining
- FEEDBACK: Customer providing feedback/review

ADMINISTRATIVE:
- CONTRACT: Contract, agreement, or terms of service
- LEGAL: Legal matter, cease & desist, legal notice
- TAX_DOCUMENT: Tax-related document (W9, 1099, tax forms)

LOW PRIORITY:
- NEWSLETTER: Marketing email, newsletter, promotional content
- NOTIFICATION: Automated notification (shipping, account updates)
- SPAM: Unwanted/irrelevant email

CATCH-ALL:
- BUSINESS_GENERAL: Business-related but doesn't fit other categories
- PERSONAL: Personal email (not business)
- UNKNOWN: Cannot determine category with confidence

CLASSIFICATION RULES:

1. LANGUAGE SUPPORT:
   - Fully support German and English
   - German financial terms:
     * Rechnung = Invoice
     * Zahlung = Payment
     * Mahnung = Payment reminder
     * Angebot = Quote
     * Bestellung = Order
     * Vertrag = Contract
     * Steuer = Tax

2. ATTACHMENT CLUES:
   - PDF with "invoice", "rechnung" → likely INVOICE_RECEIVED
   - PDF with "quote", "angebot" → likely QUOTE_SENT or QUOTE_REQUEST
   - PDF with "contract", "vertrag" → likely CONTRACT
   - Multiple PDFs → higher confidence for financial classification

3. SENDER/SUBJECT PATTERNS:
   - "noreply@", "notifications@" → likely NOTIFICATION
   - "invoice", "bill", "payment due" in subject → INVOICE_RECEIVED
   - "your order", "order confirmed" → ORDER_CONFIRMATION
   - "quote request", "RFQ" → QUOTE_REQUEST
   - "unsubscribe" link → NEWSLETTER
   - Excessive caps, "FREE", "ACT NOW" → SPAM

4. CONFIDENCE SCORING (0.0 to 1.0):
   - 0.9-1.0: Very clear indicators in subject + body + attachments
   - 0.7-0.89: Clear subject line or strong body indicators
   - 0.5-0.69: Partial indicators, some ambiguity
   - 0.3-0.49: Weak indicators, high uncertainty
   - 0.0-0.29: No clear indicators, guessing

5. INTENT EXTRACTION:
   Extract the primary intent/request from the email:
   - "Please pay invoice #12345 by June 30"
   - "Need quote for 100 units of product X"
   - "Issue with recent order, requesting refund"

6. ENTITY EXTRACTION:
   Extract relevant business entities:
   - Vendor/Customer names
   - Invoice/Order/Contract numbers
   - Amounts and currency
   - Due dates
   - Product names

7. PRIORITY ASSIGNMENT:
   - CRITICAL: Complaints, legal issues
   - HIGH: Invoices, payment reminders, quote requests, tax docs
   - MEDIUM: Orders, sent invoices, general business
   - LOW: Newsletters, notifications
   - SPAM: Spam emails

8. SUGGESTED ACTIONS:
   Map classification to suggested workflow:
   - INVOICE_RECEIVED → CREATE_BILL
   - PAYMENT_RECEIVED → RECORD_PAYMENT
   - QUOTE_REQUEST → SEND_QUOTE
   - COMPLAINT → ESCALATE_COMPLAINT
   - CONTRACT → REVIEW_CONTRACT
   - SPAM → DELETE

You must respond with a valid JSON object matching this exact schema:
{
  "classification": "INVOICE_RECEIVED" | "INVOICE_SENT" | ... (see categories above),
  "confidence": number (0.0 to 1.0),
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SPAM",
  "reasoning": "Brief explanation of why this classification was chosen",
  "extractedIntent": "What does the sender want?" (optional),
  "extractedEntities": {
    "vendorName": string (optional),
    "customerName": string (optional),
    "invoiceNumber": string (optional),
    "amount": number (optional),
    "currency": string (optional),
    "dueDate": string (optional, ISO 8601),
    "productNames": string[] (optional),
    "orderNumber": string (optional),
    "contractNumber": string (optional),
    "caseNumber": string (optional)
  },
  "suggestedAction": "CREATE_BILL" | "RECORD_PAYMENT" | ... (see actions above),
  "suggestedActionDetails": "Additional context for the action" (optional),
  "flags": string[] (optional, e.g., ["urgent", "follow_up", "review_needed"])
}

EXAMPLE CLASSIFICATIONS:

Example 1: Invoice Email
Subject: "Rechnung Nr. 2024-001 - Fälligkeit 15.06.2024"
From: "buchhaltung@example-vendor.de"
Attachments: ["Rechnung_2024-001.pdf"]

Response:
{
  "classification": "INVOICE_RECEIVED",
  "confidence": 0.95,
  "priority": "HIGH",
  "reasoning": "Subject contains 'Rechnung' (invoice) with number and due date. PDF attachment present from vendor billing department.",
  "extractedIntent": "Pay invoice 2024-001 by June 15, 2024",
  "extractedEntities": {
    "vendorName": "Example Vendor",
    "invoiceNumber": "2024-001",
    "dueDate": "2024-06-15"
  },
  "suggestedAction": "CREATE_BILL",
  "suggestedActionDetails": "Create bill for invoice 2024-001 with due date June 15, 2024",
  "flags": ["payment_required"]
}

Example 2: Customer Inquiry
Subject: "Question about your services"
From: "john@customer.com"
Body: "Hi, I'm interested in your consulting services. Could you provide more information?"

Response:
{
  "classification": "CUSTOMER_INQUIRY",
  "confidence": 0.85,
  "priority": "MEDIUM",
  "reasoning": "Customer asking general question about services. Clear inquiry intent.",
  "extractedIntent": "Request information about consulting services",
  "extractedEntities": {
    "customerName": "John"
  },
  "suggestedAction": "RESPOND_TO_INQUIRY",
  "suggestedActionDetails": "Send information about consulting services",
  "flags": ["potential_lead"]
}

Example 3: Payment Reminder
Subject: "2nd Reminder: Invoice 12345 overdue"
From: "accounts@vendor.com"
Body: "This is your second payment reminder for invoice 12345. Amount due: €500. Please pay immediately."

Response:
{
  "classification": "PAYMENT_REMINDER",
  "confidence": 0.92,
  "priority": "HIGH",
  "reasoning": "Second payment reminder for overdue invoice. Urgent payment required.",
  "extractedIntent": "Pay overdue invoice 12345 (€500)",
  "extractedEntities": {
    "vendorName": "Vendor",
    "invoiceNumber": "12345",
    "amount": 500,
    "currency": "EUR"
  },
  "suggestedAction": "RECORD_PAYMENT",
  "suggestedActionDetails": "Urgent: Second reminder for €500 payment",
  "flags": ["overdue", "urgent", "second_reminder"]
}

IMPORTANT GUIDELINES:
- Always be conservative with confidence scores
- When uncertain, use BUSINESS_GENERAL or UNKNOWN
- Extract as many entities as possible from subject + body
- Consider cultural context (German vs English business practices)
- Flag emails that need human review (complaints, legal, high amounts)
`;

export const EMAIL_CLASSIFICATION_USER_PROMPT = (email: {
  subject: string;
  body: string;
  from: string;
  to: string;
  hasAttachments: boolean;
  attachmentTypes?: string[];
  attachmentNames?: string[];
}) => {
  const attachmentInfo = email.hasAttachments
    ? `\nAttachments: ${email.attachmentNames?.join(', ') || 'Yes'} (${email.attachmentTypes?.join(', ') || 'unknown types'})`
    : '\nAttachments: None';

  // Truncate body if too long (keep first 3000 chars)
  const truncatedBody = email.body.length > 3000
    ? email.body.substring(0, 3000) + '\n\n[... body truncated ...]'
    : email.body;

  return `Please classify this email:

Subject: ${email.subject}
From: ${email.from}
To: ${email.to}${attachmentInfo}

Body:
${truncatedBody}

Classify this email and return a JSON response following the schema in the system prompt.`;
};

export const EMAIL_BATCH_CLASSIFICATION_PROMPT = (emails: Array<{
  id: string;
  subject: string;
  from: string;
  hasAttachments: boolean;
}>) => {
  const emailList = emails.map((email, idx) =>
    `${idx + 1}. [ID: ${email.id}] Subject: "${email.subject}" From: ${email.from} Attachments: ${email.hasAttachments ? 'Yes' : 'No'}`
  ).join('\n');

  return `Classify these ${emails.length} emails. For each email, provide classification based on subject, sender, and attachment presence.

Emails:
${emailList}

Return a JSON array with ${emails.length} classification objects, each containing:
- emailId: the ID from above
- classification: category
- confidence: 0-1 score
- priority: priority level
- reasoning: brief explanation

Response format:
[
  {
    "emailId": "email_id_1",
    "classification": "CATEGORY",
    "confidence": 0.0-1.0,
    "priority": "PRIORITY",
    "reasoning": "explanation",
    "suggestedAction": "ACTION"
  },
  ...
]`;
};

/**
 * Build classification prompt with custom context
 */
export function buildClassificationPrompt(options: {
  email: {
    subject: string;
    body: string;
    from: string;
    to: string;
    hasAttachments: boolean;
    attachmentTypes?: string[];
    attachmentNames?: string[];
  };
  context?: string;
}): { system: string; user: string } {
  const { email, context } = options;

  let systemPrompt = EMAIL_CLASSIFICATION_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += `\n\nADDITIONAL CONTEXT:\n${context}`;
  }

  const userPrompt = EMAIL_CLASSIFICATION_USER_PROMPT(email);

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}
