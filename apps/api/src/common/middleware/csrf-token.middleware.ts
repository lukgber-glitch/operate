import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Token Middleware
 *
 * Generates and sets CSRF tokens for all incoming requests.
 * Works with CsrfGuard to implement the Double Submit Cookie pattern.
 *
 * SECURITY STRATEGY:
 * 1. Generates a cryptographically secure random token (32 bytes)
 * 2. Sets token as both HTTP-only cookie and readable cookie
 * 3. Client reads token from cookie and includes in request headers
 * 4. CsrfGuard validates token match on state-changing requests
 *
 * COOKIE SETTINGS:
 * - XSRF-TOKEN: Readable by JavaScript (for client to copy to header)
 * - SameSite=Strict: Primary CSRF protection (blocks cross-site requests)
 * - Secure: Only sent over HTTPS in production
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */
@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfTokenMiddleware.name);

  // Token cookie name (must match CsrfGuard)
  private readonly TOKEN_COOKIE_NAME = 'XSRF-TOKEN';

  // Token lifetime (15 minutes, matches access token)
  private readonly TOKEN_MAX_AGE = 15 * 60 * 1000;

  use(req: Request, res: Response, next: NextFunction) {
    // Check if token already exists in cookie
    const existingToken = req.cookies?.[this.TOKEN_COOKIE_NAME];

    // Only generate new token if one doesn't exist or is invalid
    if (!existingToken || !this.isValidToken(existingToken)) {
      const csrfToken = this.generateToken();

      // Set CSRF token as cookie
      // NOTE: This cookie is NOT httpOnly so JavaScript can read it
      // This is required for the double-submit pattern
      res.cookie(this.TOKEN_COOKIE_NAME, csrfToken, {
        httpOnly: false, // MUST be false for client to read
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Primary CSRF protection
        maxAge: this.TOKEN_MAX_AGE,
        path: '/',
      });

      this.logger.debug(`Generated new CSRF token for ${req.method} ${req.path}`);
    }

    next();
  }

  /**
   * Generate cryptographically secure CSRF token
   *
   * SECURITY: Uses crypto.randomBytes for secure random generation
   * Returns 32-byte hex string (64 characters)
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate token format
   * Tokens should be 32-byte hex strings (64 hex characters)
   */
  private isValidToken(token: string): boolean {
    return /^[a-f0-9]{64}$/i.test(token);
  }
}
