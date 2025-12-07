/**
 * Prompt Sanitizer Guard
 * Detects and blocks prompt injection attacks before they reach the AI service
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface InjectionPattern {
  name: string;
  pattern: RegExp;
  severity: 'high' | 'medium' | 'low';
}

@Injectable()
export class PromptSanitizerGuard implements CanActivate {
  private readonly logger = new Logger(PromptSanitizerGuard.name);

  // Injection patterns to detect malicious inputs
  private readonly injectionPatterns: InjectionPattern[] = [
    // Direct instruction override attempts
    {
      name: 'Ignore previous instructions',
      pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
      severity: 'high',
    },
    {
      name: 'Disregard instructions',
      pattern: /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
      severity: 'high',
    },
    {
      name: 'Forget instructions',
      pattern: /forget\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
      severity: 'high',
    },

    // Role manipulation
    {
      name: 'System role injection',
      pattern: /^\s*system\s*:/im,
      severity: 'high',
    },
    {
      name: 'Assistant role injection',
      pattern: /^\s*assistant\s*:/im,
      severity: 'high',
    },
    {
      name: 'Human role injection',
      pattern: /^\s*human\s*:/im,
      severity: 'medium',
    },
    {
      name: 'User role injection',
      pattern: /^\s*user\s*:/im,
      severity: 'medium',
    },

    // Prompt termination attempts
    {
      name: 'Prompt end marker',
      pattern: /\[\/?(INST|SYS|END)\]/i,
      severity: 'high',
    },
    {
      name: 'XML-style role tags',
      pattern: /<\/?(?:system|assistant|human|user)>/i,
      severity: 'high',
    },

    // Base64 encoded commands (common obfuscation technique)
    {
      name: 'Suspicious base64',
      pattern: /(?:aWdub3Jl|ZGlzcmVnYXJk|Zm9yZ2V0|c3lzdGVt|YXNzaXN0YW50)/i, // Base64 for common injection words
      severity: 'medium',
    },

    // Unicode obfuscation
    {
      name: 'Unicode obfuscation',
      pattern: /[\u200B-\u200D\uFEFF]/,
      severity: 'low',
    },

    // Repeated special characters (possible delimiter injection)
    {
      name: 'Delimiter injection',
      pattern: /[#@$%]{5,}/,
      severity: 'medium',
    },

    // Escape sequence abuse
    {
      name: 'Escape sequence abuse',
      pattern: /\\[xX][0-9a-fA-F]{2,}/,
      severity: 'low',
    },

    // SQL-style comments (might be trying to comment out instructions)
    {
      name: 'SQL comment injection',
      pattern: /--\s*[^\n]*ignore|--\s*[^\n]*disregard/i,
      severity: 'medium',
    },

    // Script tag injection
    {
      name: 'Script tag injection',
      pattern: /<script[^>]*>[\s\S]*?<\/script>/i,
      severity: 'high',
    },

    // Excessive newlines (possible prompt structure manipulation)
    {
      name: 'Excessive newlines',
      pattern: /\n{10,}/,
      severity: 'low',
    },

    // Direct AI jailbreak attempts
    {
      name: 'DAN prompt',
      pattern: /do\s+anything\s+now|DAN\s+mode/i,
      severity: 'high',
    },
    {
      name: 'Jailbreak attempt',
      pattern: /act\s+as\s+if\s+you('re|\s+are)\s+(not\s+)?bound/i,
      severity: 'high',
    },
    {
      name: 'Roleplay jailbreak',
      pattern: /pretend\s+(you('re|\s+are)|to\s+be)\s+(no\s+longer|not)\s+an?\s+AI/i,
      severity: 'high',
    },

    // Token smuggling attempts
    {
      name: 'Token smuggling',
      pattern: /<\|.*?\|>/,
      severity: 'high',
    },
  ];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract content from request body
    const content = this.extractContent(request.body);

    if (!content) {
      // If there's no content to check, allow the request
      return true;
    }

    // Check for injection patterns
    const detectedInjections = this.detectInjections(content);

    if (detectedInjections.length > 0) {
      // Log the attempted injection
      const user = (request as any).user;
      const userId = user?.id || 'unknown';

      this.logger.warn(
        `Prompt injection attempt detected from user ${userId}: ${detectedInjections.map(d => d.name).join(', ')}`,
      );

      // Log the actual content for security audit (in production, this should go to a security log)
      this.logger.debug(`Blocked content: ${this.truncateForLog(content)}`);

      // Block high severity injections
      const hasHighSeverity = detectedInjections.some(d => d.severity === 'high');

      if (hasHighSeverity) {
        throw new BadRequestException({
          message: 'Invalid input detected. Please rephrase your message.',
          code: 'PROMPT_INJECTION_DETECTED',
          details: 'Your message contains patterns that are not allowed for security reasons.',
        });
      }

      // For medium/low severity, we could either block or sanitize
      // For now, we'll block medium severity as well
      const hasMediumSeverity = detectedInjections.some(d => d.severity === 'medium');

      if (hasMediumSeverity) {
        throw new BadRequestException({
          message: 'Suspicious input detected. Please rephrase your message.',
          code: 'SUSPICIOUS_INPUT',
          details: 'Your message contains patterns that may cause issues.',
        });
      }
    }

    return true;
  }

  /**
   * Extract content from request body
   */
  private extractContent(body: any): string | null {
    if (!body) return null;

    // Check common field names
    if (typeof body.content === 'string') return body.content;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.text === 'string') return body.text;
    if (typeof body.prompt === 'string') return body.prompt;

    // Check for messages array (chat format)
    if (Array.isArray(body.messages)) {
      return body.messages
        .map((msg: any) => msg.content || msg.message || '')
        .join('\n');
    }

    // If it's a string, use it directly
    if (typeof body === 'string') return body;

    return null;
  }

  /**
   * Detect injection patterns in content
   */
  private detectInjections(content: string): InjectionPattern[] {
    const detected: InjectionPattern[] = [];

    for (const pattern of this.injectionPatterns) {
      if (pattern.pattern.test(content)) {
        detected.push(pattern);
      }
    }

    return detected;
  }

  /**
   * Truncate content for logging (to avoid logging sensitive data)
   */
  private truncateForLog(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '... [truncated]';
  }

  /**
   * Sanitize content by removing detected patterns (alternative to blocking)
   * This is not used by default but can be useful for less severe cases
   */
  sanitizeContent(content: string): string {
    let sanitized = content;

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove excessive newlines
    sanitized = sanitized.replace(/\n{5,}/g, '\n\n\n');

    // Remove zero-width characters
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove potential role markers
    sanitized = sanitized.replace(/^\s*(system|assistant|human|user)\s*:/gim, '');

    return sanitized.trim();
  }
}
