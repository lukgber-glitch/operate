import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * Queue Board Authentication Middleware
 * Protects the Bull Board dashboard from unauthorized access
 *
 * Authentication methods:
 * 1. Admin API Key header (X-Queue-Admin-Key)
 * 2. JWT Bearer token with admin role
 *
 * Usage:
 * Add to app.module.ts:
 * ```typescript
 * consumer
 *   .apply(QueueBoardAuthMiddleware)
 *   .forRoutes('/admin/queues');
 * ```
 */
@Injectable()
export class QueueBoardAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Method 1: Check for admin API key
      const adminKey = req.headers['x-queue-admin-key'] as string;
      const configuredKey = this.configService.get<string>('QUEUE_ADMIN_KEY');

      if (adminKey && configuredKey && adminKey === configuredKey) {
        return next();
      }

      // Method 2: Check for JWT Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('jwt.secret'),
          });

          // Check if user has admin role or is owner
          if (payload.role === 'OWNER' || payload.role === 'ADMIN') {
            return next();
          }
        } catch (error) {
          // JWT verification failed, continue to unauthorized
        }
      }

      // No valid authentication found
      throw new UnauthorizedException(
        'Queue Board access requires admin authentication. ' +
        'Provide either X-Queue-Admin-Key header or valid admin JWT token.',
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
