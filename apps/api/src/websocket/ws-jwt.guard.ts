import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 * Validates JWT tokens for WebSocket connections
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      // Attach user data to socket for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        orgId: payload.orgId,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   * Supports both query parameter and Authorization header
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from query parameter
    const tokenFromQuery = client.handshake.query?.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Try to get token from Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from auth object (some clients send it this way)
    const tokenFromAuth = client.handshake.auth?.token as string;
    if (tokenFromAuth) {
      return tokenFromAuth;
    }

    return null;
  }
}
