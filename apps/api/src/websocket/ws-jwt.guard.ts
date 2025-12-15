import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 * Validates JWT tokens for WebSocket connections
 *
 * SECURITY FEATURES:
 * - SEC-013: Prefer auth object over query params (prevents token logging)
 * - SEC-014: Token expiry validation
 * - SEC-015: Connection rate limiting per IP
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  // SEC-015: Connection rate limiting
  private readonly connectionAttempts = new Map<string, { count: number; resetTime: Date }>();
  private readonly MAX_CONNECTIONS_PER_IP = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();

      // SEC-015: Check connection rate limiting
      const clientIp = this.getClientIp(client);
      if (this.isRateLimited(clientIp)) {
        this.logger.warn(`SEC-015: WebSocket connection rate limit exceeded for IP: ${clientIp}`);
        throw new WsException('Too many connection attempts. Please try again later.');
      }
      this.recordConnectionAttempt(clientIp);

      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // SEC-014: Verify JWT token with expiry check
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      // SEC-014: Additional expiry validation
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new WsException('Unauthorized: Token expired');
      }

      // Attach user data to socket for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        orgId: payload.orgId,
        role: payload.role,
      };

      // Store connection metadata for auditing
      client.data.connectedAt = new Date();
      client.data.clientIp = clientIp;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   *
   * SECURITY ORDER (SEC-013):
   * 1. auth object (preferred - not logged in URLs)
   * 2. Authorization header (standard HTTP auth)
   * 3. Query parameter (last resort - may be logged)
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // SEC-013: Prefer auth object (most secure - not logged in URLs)
    const tokenFromAuth = client.handshake.auth?.token as string;
    if (tokenFromAuth) {
      return tokenFromAuth;
    }

    // Try to get token from Authorization header (secure)
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // SEC-013: Query parameter as last resort (may be logged in server logs)
    // Log a warning to track usage for deprecation
    const tokenFromQuery = client.handshake.query?.token as string;
    if (tokenFromQuery) {
      this.logger.warn(
        'SEC-013: WebSocket token received via query parameter. Consider using auth object instead.',
      );
      return tokenFromQuery;
    }

    return null;
  }

  /**
   * Get client IP address from socket
   */
  private getClientIp(client: Socket): string {
    return (
      client.handshake.headers['x-forwarded-for']?.toString().split(',')[0] ||
      client.handshake.address ||
      'unknown'
    );
  }

  /**
   * SEC-015: Check if IP is rate limited
   */
  private isRateLimited(ip: string): boolean {
    const record = this.connectionAttempts.get(ip);
    if (!record) return false;

    if (new Date() > record.resetTime) {
      this.connectionAttempts.delete(ip);
      return false;
    }

    return record.count >= this.MAX_CONNECTIONS_PER_IP;
  }

  /**
   * SEC-015: Record connection attempt
   */
  private recordConnectionAttempt(ip: string): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.RATE_LIMIT_WINDOW_MS);

    const record = this.connectionAttempts.get(ip);
    if (record && now < record.resetTime) {
      record.count++;
    } else {
      this.connectionAttempts.set(ip, { count: 1, resetTime });
    }
  }

  /**
   * Cleanup expired rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = new Date();
    for (const [ip, record] of this.connectionAttempts.entries()) {
      if (now > record.resetTime) {
        this.connectionAttempts.delete(ip);
      }
    }
  }
}
