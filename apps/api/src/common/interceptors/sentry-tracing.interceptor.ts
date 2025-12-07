import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import * as Sentry from '@sentry/nestjs';

/**
 * Interceptor that creates Sentry spans for performance monitoring
 *
 * This interceptor wraps each request in a Sentry span to track:
 * - Response times
 * - Success/failure rates
 * - User context
 * - Request metadata
 */
@Injectable()
export class SentryTracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path || request.url;
    const method = request.method;

    // Add user context if available
    if (request.user) {
      Sentry.setUser({
        id: request.user.id,
        email: request.user.email,
        organizationId: request.user.organizationId,
      });
    }

    const startTime = Date.now();

    // Add breadcrumb for request start
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${method} ${routePath} - started`,
      level: 'info',
      data: {
        url: request.url,
        method: request.method,
      },
    });

    return next.handle().pipe(
      tap({
        next: () => {
          // Request completed successfully
          const duration = Date.now() - startTime;

          // Add breadcrumb for successful request
          Sentry.addBreadcrumb({
            category: 'http',
            message: `${method} ${routePath} - completed`,
            level: 'info',
            data: {
              duration_ms: duration,
              status: 200,
            },
          });
        },
      }),
      catchError((error) => {
        // Request failed
        const duration = Date.now() - startTime;
        const status = error?.status || 500;

        // Add breadcrumb for failed request
        Sentry.addBreadcrumb({
          category: 'http',
          message: `${method} ${routePath} - failed`,
          level: 'error',
          data: {
            duration_ms: duration,
            status,
            error: error?.message,
          },
        });

        return throwError(() => error);
      }),
    );
  }
}
