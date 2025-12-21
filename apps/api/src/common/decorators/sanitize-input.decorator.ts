import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  sanitizeForStorage,
  isSafeString,
} from '../utils/xss-sanitizer.util';

/**
 * SEC-016: Sanitize Input Decorator
 *
 * Automatically sanitizes string input by removing XSS patterns.
 * Use on DTO properties that accept user input.
 *
 * @example
 * ```typescript
 * export class CreateUserDto {
 *   @SanitizeInput()
 *   @IsString()
 *   firstName: string;
 * }
 * ```
 */
export function SanitizeInput(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return sanitizeForStorage(value);
  });
}

/**
 * SEC-016: No XSS Validator Constraint
 */
@ValidatorConstraint({ name: 'noXss', async: false })
export class NoXssConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') {
      return true;
    }
    return isSafeString(value);
  }

  defaultMessage(): string {
    return 'Input contains potentially dangerous content';
  }
}

/**
 * SEC-016: No XSS Decorator
 *
 * Validates that string input does not contain XSS patterns.
 * Rejects input that contains dangerous patterns instead of sanitizing.
 *
 * Use when you want to reject dangerous input rather than sanitize it.
 *
 * @example
 * ```typescript
 * export class CreateUserDto {
 *   @NoXss()
 *   @IsString()
 *   comment: string;
 * }
 * ```
 */
export function NoXss(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [],
      validator: NoXssConstraint,
    });
  };
}

/**
 * SEC-016: Safe HTML Validator Constraint
 *
 * For fields that need to accept limited HTML (like rich text),
 * this validates that only safe tags are used.
 */
@ValidatorConstraint({ name: 'safeHtml', async: false })
export class SafeHtmlConstraint implements ValidatorConstraintInterface {
  private readonly allowedTags = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  ]);

  validate(value: any): boolean {
    if (typeof value !== 'string') {
      return true;
    }

    // Find all HTML tags in the content
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    let match;

    while ((match = tagPattern.exec(value)) !== null) {
      const tagName = match[1]?.toLowerCase();
      if (!tagName || !this.allowedTags.has(tagName)) {
        return false;
      }
    }

    // Also check for dangerous patterns
    return isSafeString(value);
  }

  defaultMessage(): string {
    return 'HTML content contains disallowed tags or potentially dangerous content';
  }
}

/**
 * SEC-016: Safe HTML Decorator
 *
 * Validates that HTML content only contains allowed safe tags.
 * Use for rich text fields where limited HTML is expected.
 *
 * @example
 * ```typescript
 * export class UpdateNoteDto {
 *   @SafeHtml()
 *   content: string;
 * }
 * ```
 */
export function SafeHtml(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [],
      validator: SafeHtmlConstraint,
    });
  };
}
