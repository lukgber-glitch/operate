import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

/**
 * Global exception filter that captures exceptions in Sentry
 * before passing them to the default exception handler.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Extract exception details
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Unknown error';

    // Only capture 5xx errors in Sentry
    if (status >= 500) {
      Sentry.withScope((scope) => {
        // Add request context
        scope.setContext('request', {
          url: request.url,
          method: request.method,
          headers: this.sanitizeHeaders(request.headers),
          query: request.query,
          params: request.params,
          body: this.sanitizeBody(request.body),
        });

        // Add response context
        scope.setContext('response', {
          statusCode: status,
        });

        // Add user context if authenticated
        if (request.user) {
          scope.setUser({
            id: request.user.id,
            email: request.user.email,
            organizationId: request.user.organizationId,
            username: request.user.email,
          });
        }

        // Add organization context
        if (request.user?.organizationId) {
          scope.setTag('organization_id', request.user.organizationId);
        }

        // Add custom tags
        scope.setTag('http_method', request.method);
        scope.setTag('http_status', status);
        scope.setTag('route', request.route?.path || request.url);

        // Set fingerprint for better error grouping
        scope.setFingerprint([
          '{{ default }}',
          request.route?.path || request.url,
          String(status),
        ]);

        // Capture the exception
        Sentry.captureException(exception);
      });
    }

    // Pass to default exception handler
    super.catch(exception, host);
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'taxId',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
