import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Guard
 *
 * Implements CSRF protection using the Double Submit Cookie pattern.
 * This guard works in conjunction with SameSite cookies to provide defense-in-depth.
 *
 * SECURITY STRATEGY:
 * 1. Primary: SameSite=Strict cookies (blocks cross-site requests)
 * 2. Secondary: Double-submit token validation (additional verification layer)
 * 3. Exemptions: Safe methods (GET, HEAD, OPTIONS) and @SkipCsrf() decorated routes
 *
 * HOW IT WORKS:
 * - Client receives CSRF token via cookie (XSRF-TOKEN)
 * - Client must include token in header (X-XSRF-TOKEN) for state-changing requests
 * - Guard validates token match for POST/PUT/PATCH/DELETE requests
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  // Safe HTTP methods that don't require CSRF protection
  private readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  // Token cookie name (readable by JavaScript)
  private readonly TOKEN_COOKIE_NAME = 'XSRF-TOKEN';

  // Token header name (must match cookie value)
  private readonly TOKEN_HEADER_NAME = 'x-xsrf-token';

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Check if route is marked as @Public() (webhooks, OAuth callbacks, etc.)
    // These routes have alternative security measures
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug(`CSRF check skipped for public route: ${method} ${request.path}`);
      return true;
    }

    // Check if route is explicitly exempt from CSRF protection
    const skipCsrf = this.reflector.get<boolean>(
      'skipCsrf',
      context.getHandler(),
    );

    if (skipCsrf) {
      this.logger.debug(`CSRF check skipped for ${method} ${request.path}`);
      return true;
    }

    // Safe methods don't need CSRF protection
    if (this.SAFE_METHODS.includes(method)) {
      return true;
    }

    // Validate CSRF token for state-changing requests
    return this.validateCsrfToken(request);
  }

  /**
   * Validate CSRF token using double-submit cookie pattern
   *
   * SECURITY: Compares cookie value with header value using constant-time comparison
   * to prevent timing attacks.
   */
  private validateCsrfToken(request: Request): boolean {
    // Get token from cookie
    const cookieToken = request.cookies?.[this.TOKEN_COOKIE_NAME];

    // Get token from header
    const headerToken = request.headers[this.TOKEN_HEADER_NAME] as string;

    // Both token values must be present
    if (!cookieToken || !headerToken) {
      this.logger.warn(
        `CSRF validation failed: Missing token (cookie: ${!!cookieToken}, header: ${!!headerToken}) for ${request.method} ${request.path}`,
      );
      throw new ForbiddenException(
        'CSRF token validation failed. Missing CSRF token.',
      );
    }

    // Validate token format (should be 32-byte hex string = 64 characters)
    if (!this.isValidTokenFormat(cookieToken) || !this.isValidTokenFormat(headerToken)) {
      this.logger.warn(
        `CSRF validation failed: Invalid token format for ${request.method} ${request.path}`,
      );
      throw new ForbiddenException(
        'CSRF token validation failed. Invalid token format.',
      );
    }

    // Use constant-time comparison to prevent timing attacks
    // SECURITY: Prevents attackers from determining correct token through timing analysis
    if (!this.constantTimeCompare(cookieToken, headerToken)) {
      this.logger.warn(
        `CSRF validation failed: Token mismatch for ${request.method} ${request.path}`,
      );
      throw new ForbiddenException(
        'CSRF token validation failed. Token mismatch.',
      );
    }

    this.logger.debug(`CSRF validation passed for ${request.method} ${request.path}`);
    return true;
  }

  /**
   * Validate token format
   * Tokens should be 32-byte hex strings (64 hex characters)
   */
  private isValidTokenFormat(token: string): boolean {
    return /^[a-f0-9]{64}$/i.test(token);
  }

  /**
   * Constant-time string comparison
   *
   * SECURITY: Prevents timing attacks by always comparing all characters
   * regardless of when a mismatch is found.
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8'),
      );
    } catch {
      // If buffers are different lengths or invalid, comparison fails
      return false;
    }
  }
}

/**
 * Decorator to skip CSRF protection for specific routes
 *
 * USE CASES:
 * - Public webhooks (use other validation like signature verification)
 * - OAuth callbacks (use state parameter validation)
 * - API endpoints with alternative CSRF protection
 *
 * WARNING: Only use when you have alternative CSRF protection in place!
 */
export const SkipCsrf = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('skipCsrf', true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata('skipCsrf', true, target);
    return target;
  };
};
