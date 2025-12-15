import { AUTO_REPLY_HEADERS, BULK_MAIL_INDICATORS } from '../data/default-filters';

export interface HeaderAnalysisResult {
  isAutoReply: boolean;
  isBulkMail: boolean;
  isNewsletter: boolean;
  isMarketing: boolean;
  indicators: string[];
  confidence: number;
}

/**
 * Analyze email headers for automated/bulk mail indicators
 */
export function analyzeEmailHeaders(
  headers: Record<string, string>,
): HeaderAnalysisResult {
  const indicators: string[] = [];
  let isAutoReply = false;
  let isBulkMail = false;
  let isNewsletter = false;
  let isMarketing = false;

  // Check auto-reply headers
  for (const header of AUTO_REPLY_HEADERS) {
    const value = headers[header] || headers[header.toLowerCase()];
    if (value) {
      isAutoReply = true;
      indicators.push(`${header}: ${value}`);
    }
  }

  // Check Auto-Submitted
  const autoSubmitted = headers['Auto-Submitted'] || headers['auto-submitted'];
  if (autoSubmitted && autoSubmitted !== 'no') {
    isAutoReply = true;
    indicators.push(`Auto-Submitted: ${autoSubmitted}`);
  }

  // Check Precedence
  const precedence = headers['Precedence'] || headers['precedence'];
  if (precedence) {
    const lower = precedence.toLowerCase();
    if (BULK_MAIL_INDICATORS['Precedence'].includes(lower)) {
      isBulkMail = true;
      indicators.push(`Precedence: ${precedence}`);
    }
  }

  // Check X-Mailer
  const xMailer = headers['X-Mailer'] || headers['x-mailer'];
  if (xMailer) {
    const lower = xMailer.toLowerCase();
    for (const knownMailer of BULK_MAIL_INDICATORS['X-Mailer']) {
      if (lower.includes(knownMailer)) {
        isBulkMail = true;
        isMarketing = true;
        indicators.push(`X-Mailer: ${xMailer}`);
        break;
      }
    }
  }

  // Check List-Unsubscribe
  if (headers['List-Unsubscribe'] || headers['list-unsubscribe']) {
    isNewsletter = true;
    indicators.push('List-Unsubscribe present');
  }

  // Check List-Id (mailing list indicator)
  if (headers['List-Id'] || headers['list-id']) {
    isNewsletter = true;
    indicators.push('List-Id present');
  }

  // Check campaign headers
  if (headers['X-Campaign'] || headers['x-campaign']) {
    isMarketing = true;
    indicators.push('X-Campaign present');
  }

  if (headers['X-MC-User'] || headers['x-mc-user']) {
    isMarketing = true;
    indicators.push('Mailchimp campaign detected');
  }

  // Calculate confidence based on number of indicators
  let confidence = 1.0;
  if (indicators.length > 0) {
    confidence = Math.min(0.95, 0.7 + indicators.length * 0.1);
  }

  return {
    isAutoReply,
    isBulkMail: isBulkMail || isNewsletter || isMarketing,
    isNewsletter,
    isMarketing,
    indicators,
    confidence,
  };
}

/**
 * Extract relevant headers from raw email headers
 */
export function extractRelevantHeaders(
  rawHeaders: string | Record<string, string>,
): Record<string, string> {
  const relevantKeys = [
    'Auto-Submitted',
    'X-Auto-Reply-From',
    'X-Autorespond',
    'X-Autoreply',
    'X-Auto-Response-Suppress',
    'Precedence',
    'X-Mailer',
    'List-Unsubscribe',
    'List-Id',
    'X-Campaign',
    'X-MC-User',
    'X-SG-EID', // SendGrid
    'X-Mailgun-Sid', // Mailgun
    'X-PM-Message-Id', // Postmark
  ];

  if (typeof rawHeaders === 'string') {
    // Parse string headers
    const headers: Record<string, string> = {};
    const lines = rawHeaders.split(/\r?\n/);
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (
          relevantKeys.some(
            (k) => k.toLowerCase() === key.toLowerCase(),
          )
        ) {
          headers[key] = value;
        }
      }
    }
    return headers;
  }

  // Filter object headers
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (
      relevantKeys.some((k) => k.toLowerCase() === key.toLowerCase())
    ) {
      filtered[key] = value;
    }
  }
  return filtered;
}
