/**
 * IMAP Parser Service
 * Parses email content, headers, and attachments
 */

import { Injectable, Logger } from '@nestjs/common';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import { ImapMessage, ImapAttachment } from './imap.types';
import { DEFAULT_MAX_ATTACHMENT_SIZE } from './imap.constants';

@Injectable()
export class ImapParserService {
  private readonly logger = new Logger(ImapParserService.name);

  /**
   * Parse raw email source into structured format
   */
  async parseEmail(source: Buffer | string): Promise<ParsedMail> {
    try {
      const parsed = await simpleParser(source);
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse email: ${error.message}`, error.stack);
      throw new Error('Failed to parse email content');
    }
  }

  /**
   * Extract text content from email
   */
  extractTextContent(parsed: ParsedMail): {
    text: string | null;
    html: string | null;
  } {
    return {
      text: parsed.text || null,
      html: parsed.html || null,
    };
  }

  /**
   * Extract attachments from parsed email
   */
  extractAttachments(
    parsed: ParsedMail,
    maxSize: number = DEFAULT_MAX_ATTACHMENT_SIZE,
  ): ImapAttachment[] {
    const attachments: ImapAttachment[] = [];

    if (!parsed.attachments || parsed.attachments.length === 0) {
      return attachments;
    }

    for (const attachment of parsed.attachments) {
      // Skip attachments that exceed max size
      if (attachment.size > maxSize) {
        this.logger.warn(
          `Attachment ${attachment.filename} exceeds max size (${attachment.size} > ${maxSize})`,
        );
        continue;
      }

      attachments.push({
        filename: attachment.filename || 'unnamed',
        contentType: attachment.contentType,
        size: attachment.size,
        contentId: attachment.contentId,
        disposition: attachment.contentDisposition,
        content: attachment.content,
      });
    }

    return attachments;
  }

  /**
   * Extract email headers
   */
  extractHeaders(parsed: ParsedMail): Map<string, string> {
    const headers = new Map<string, string>();

    if (parsed.headers) {
      for (const [key, value] of parsed.headers) {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(', '));
        } else if (value && typeof value === 'object' && 'value' in value) {
          headers.set(key, String(value.value));
        }
      }
    }

    return headers;
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html: string): string {
    if (!html) {
      return '';
    }

    // Remove script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Extract plain text from HTML
   */
  htmlToText(html: string): string {
    if (!html) {
      return '';
    }

    let text = html;

    // Replace <br> with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Replace closing block tags with newlines
    text = text.replace(/<\/(div|p|h[1-6]|li|tr)>/gi, '\n');

    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = this.decodeHtmlEntities(text);

    // Clean up whitespace
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

    return text;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(/&[#\w]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Extract email addresses from header
   */
  extractEmailAddresses(addressHeader: any): Array<{ name?: string; address: string }> {
    if (!addressHeader) {
      return [];
    }

    if (Array.isArray(addressHeader)) {
      return addressHeader.map((addr) => ({
        name: addr.name || undefined,
        address: addr.address,
      }));
    }

    if (typeof addressHeader === 'object' && 'address' in addressHeader) {
      return [
        {
          name: addressHeader.name || undefined,
          address: addressHeader.address,
        },
      ];
    }

    return [];
  }

  /**
   * Parse email subject
   */
  parseSubject(subject: string | undefined): string {
    if (!subject) {
      return '(No Subject)';
    }

    // Trim and clean up
    return subject.trim().substring(0, 500);
  }

  /**
   * Calculate email thread ID
   */
  calculateThreadId(messageId: string, references?: string, inReplyTo?: string): string {
    // Use References header to determine thread
    if (references) {
      const refs = references.split(/\s+/);
      if (refs.length > 0) {
        return refs[0]; // First message ID in thread
      }
    }

    // Use In-Reply-To header
    if (inReplyTo) {
      return inReplyTo;
    }

    // This is a new thread
    return messageId;
  }

  /**
   * Detect email importance/priority
   */
  detectPriority(headers: Map<string, string>): 'high' | 'normal' | 'low' {
    const priority = headers.get('x-priority') || headers.get('priority');
    const importance = headers.get('importance');

    if (priority === '1' || importance === 'high') {
      return 'high';
    }

    if (priority === '5' || importance === 'low') {
      return 'low';
    }

    return 'normal';
  }

  /**
   * Extract metadata from email
   */
  extractMetadata(parsed: ParsedMail): Record<string, any> {
    const headers = this.extractHeaders(parsed);

    return {
      messageId: parsed.messageId,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      priority: this.detectPriority(headers),
      hasAttachments: parsed.attachments && parsed.attachments.length > 0,
      attachmentCount: parsed.attachments ? parsed.attachments.length : 0,
      isEncrypted: this.isEncrypted(headers),
      isSigned: this.isSigned(headers),
      spamScore: this.extractSpamScore(headers),
      listUnsubscribe: headers.get('list-unsubscribe'),
    };
  }

  /**
   * Check if email is encrypted
   */
  private isEncrypted(headers: Map<string, string>): boolean {
    const contentType = headers.get('content-type') || '';
    return (
      contentType.includes('encrypted') ||
      contentType.includes('application/pgp-encrypted') ||
      contentType.includes('application/pkcs7-mime')
    );
  }

  /**
   * Check if email is signed
   */
  private isSigned(headers: Map<string, string>): boolean {
    const contentType = headers.get('content-type') || '';
    return (
      contentType.includes('signed') ||
      contentType.includes('application/pgp-signature') ||
      contentType.includes('application/pkcs7-signature')
    );
  }

  /**
   * Extract spam score from headers
   */
  private extractSpamScore(headers: Map<string, string>): number | null {
    const spamScore = headers.get('x-spam-score');
    if (spamScore) {
      const score = parseFloat(spamScore);
      return isNaN(score) ? null : score;
    }
    return null;
  }

  /**
   * Format email size
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Truncate text with ellipsis
   */
  truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Check if content is HTML
   */
  isHtml(content: string): boolean {
    return /<[a-z][\s\S]*>/i.test(content);
  }

  /**
   * Get email preview text
   */
  getPreviewText(parsed: ParsedMail, maxLength: number = 200): string {
    let preview = '';

    if (parsed.text) {
      preview = parsed.text;
    } else if (parsed.html) {
      preview = this.htmlToText(parsed.html);
    }

    return this.truncate(preview, maxLength);
  }
}
