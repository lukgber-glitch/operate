import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    let status: number;
    let errorCode: string;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.error || this.getErrorCode(status);
        details = responseObj.details;
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = exception.message || 'Internal server error';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'UNKNOWN_ERROR';
      message = 'An unknown error occurred';
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message: this.sanitizeMessage(message),
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: request.url,
      },
    };

    // Log error with context
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      errorCode,
      userId: (request as any).user?.id,
      orgId: (request as any).user?.orgId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= 500) {
      this.logger.error(
        `${errorCode}: ${message}`,
        exception instanceof Error ? exception.stack : '',
        logContext,
      );

      // Include stack trace in development only
      if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack =
          exception instanceof Error ? exception.stack : undefined;
      }
    } else if (status >= 400) {
      this.logger.warn(`${errorCode}: ${message}`, logContext);
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private sanitizeMessage(message: string | string[]): string {
    // Handle validation error arrays
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/gi,
      /token/gi,
      /secret/gi,
      /api[_-]?key/gi,
      /credit[_-]?card/gi,
    ];

    let sanitized = message;
    sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }
}
