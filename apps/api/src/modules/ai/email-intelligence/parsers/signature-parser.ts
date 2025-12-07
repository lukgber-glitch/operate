/**
 * Email Signature Parser
 * Utility to parse email signatures for contact information
 */

import { EmailSignature } from '../types/extracted-entities.types';

/**
 * Common signature separators and indicators
 */
const SIGNATURE_SEPARATORS = [
  /^--+\s*$/m, // -- or ---
  /^_{3,}\s*$/m, // ___
  /^Mit freundlichen Grüßen/im, // German
  /^Best regards/im,
  /^Kind regards/im,
  /^Sincerely/im,
  /^Cheers/im,
  /^Thanks/im,
  /^Vielen Dank/im, // German
  /^Beste Grüße/im, // German
];

/**
 * Email pattern
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Phone patterns (international and German)
 */
const PHONE_PATTERNS = [
  /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g, // International
  /\(\d{2,5}\)\s*\d{3,}-?\d{3,}/g, // (030) 12345-678
  /\d{2,5}\s*\/\s*\d{3,}/g, // 030 / 12345
];

/**
 * Website pattern
 */
const WEBSITE_PATTERN = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/g;

/**
 * German legal suffixes to identify companies
 */
const COMPANY_SUFFIXES = [
  'GmbH',
  'AG',
  'KG',
  'OHG',
  'GmbH & Co. KG',
  'UG',
  'e.V.',
  'Inc.',
  'LLC',
  'Ltd.',
  'Limited',
  'Corp.',
  'Corporation',
  'S.A.',
  'S.L.',
  'B.V.',
];

/**
 * Job titles/positions (German and English)
 */
const JOB_TITLES = [
  'CEO',
  'CTO',
  'CFO',
  'COO',
  'Managing Director',
  'Geschäftsführer',
  'Director',
  'Manager',
  'Head of',
  'Leiter',
  'Consultant',
  'Berater',
  'Developer',
  'Entwickler',
  'Engineer',
  'Ingenieur',
  'Sales',
  'Vertrieb',
  'Marketing',
  'Accounting',
  'Buchhaltung',
  'Support',
  'Assistant',
  'Assistent',
];

/**
 * Extract the signature portion from email body
 */
export function extractSignatureBlock(emailBody: string): string | null {
  // Try to find signature separator
  for (const separator of SIGNATURE_SEPARATORS) {
    const match = emailBody.match(separator);
    if (match && match.index !== undefined) {
      // Return everything after the separator
      const signatureStart = match.index + match[0].length;
      return emailBody.substring(signatureStart).trim();
    }
  }

  // Fallback: take last 20 lines if no separator found
  const lines = emailBody.split('\n');
  if (lines.length > 5) {
    return lines.slice(-20).join('\n');
  }

  return null;
}

/**
 * Parse email signature using regex patterns
 */
export function parseSignature(signatureText: string): Partial<EmailSignature> {
  const signature: Partial<EmailSignature> = {};

  // Extract email
  const emails = signatureText.match(EMAIL_PATTERN);
  if (emails && emails.length > 0) {
    signature.email = emails[0];
  }

  // Extract phones
  const phones: string[] = [];
  for (const pattern of PHONE_PATTERNS) {
    const matches = signatureText.match(pattern);
    if (matches) {
      phones.push(...matches);
    }
  }

  if (phones.length > 0) {
    // First phone is usually office, second mobile
    signature.phone = phones[0];
    if (phones.length > 1) {
      signature.mobile = phones[1];
    }
  }

  // Extract website
  const websites = signatureText.match(WEBSITE_PATTERN);
  if (websites && websites.length > 0) {
    // Filter out email domains
    const validWebsite = websites.find(
      (w) => !w.includes('@') && !w.startsWith('http://www.example.'),
    );
    if (validWebsite) {
      signature.website = validWebsite.startsWith('http')
        ? validWebsite
        : `https://${validWebsite}`;
    }
  }

  // Extract name (usually first non-empty line)
  const lines = signatureText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length > 0) {
    // First line is often the name
    const firstLine = lines[0];
    // Check if it's not a phone or email
    if (
      !EMAIL_PATTERN.test(firstLine) &&
      !PHONE_PATTERNS.some((p) => p.test(firstLine))
    ) {
      signature.name = firstLine;
    }
  }

  // Extract company (look for lines with legal suffixes)
  for (const line of lines) {
    for (const suffix of COMPANY_SUFFIXES) {
      if (line.includes(suffix)) {
        signature.company = line;
        break;
      }
    }
    if (signature.company) break;
  }

  // Extract title (look for job titles)
  for (const line of lines) {
    for (const title of JOB_TITLES) {
      if (line.toLowerCase().includes(title.toLowerCase())) {
        signature.title = line;
        break;
      }
    }
    if (signature.title) break;
  }

  // Extract address (lines with street numbers and postal codes)
  const addressLines = lines.filter(
    (line) =>
      /\d{5}/.test(line) || // Postal code
      /\d+\s+\w+\s+(Str|Street|Ave|Road|Way|Straße|Weg|Platz)/i.test(line),
  );
  if (addressLines.length > 0) {
    signature.address = addressLines.join(', ');
  }

  return signature;
}

/**
 * Normalize phone number to E.164 format (best effort)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If starts with 00, replace with +
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.substring(2);
  }

  // If doesn't start with +, assume German number and add +49
  if (!normalized.startsWith('+')) {
    // Remove leading 0
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    normalized = '+49' + normalized;
  }

  return normalized;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic check)
 */
export function validatePhone(phone: string): boolean {
  // Should have at least 7 digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : null;
}

/**
 * Normalize company name (remove legal suffixes)
 */
export function normalizeCompanyName(companyName: string): string {
  let normalized = companyName.trim();

  // Remove legal suffixes
  for (const suffix of COMPANY_SUFFIXES) {
    const regex = new RegExp(`\\s*${suffix.replace(/\./g, '\\.')}\\s*$`, 'i');
    normalized = normalized.replace(regex, '');
  }

  return normalized.trim();
}
