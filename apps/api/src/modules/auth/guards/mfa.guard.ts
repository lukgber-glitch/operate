import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { REQUIRE_MFA_KEY } from '../decorators/require-mfa.decorator';

/**
 * MFA Guard
 * Enforces Multi-Factor Authentication for protected operations
 *
 * Usage:
 * - Apply @RequireMfa() decorator to controller methods that need MFA
 * - Guard checks if user has MFA enabled and validates it
 * - Can be used alongside @UseGuards(JwtAuthGuard) for double security
 *
 * Security Considerations:
 * - Only enforces MFA if explicitly required via decorator
 * - Validates that user has MFA enabled in database
 * - Does NOT log sensitive MFA data
 */
@Injectable()
export class MfaGuard implements CanActivate {
  private readonly logger = new Logger(MfaGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if MFA is required for this route
    const requireMfa = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MFA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If MFA is not required, allow access
    if (!requireMfa) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated (JwtAuthGuard should run first)
    if (!user || !user.userId) {
      this.logger.warn('MFA Guard: No authenticated user found');
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user has MFA enabled
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        mfaEnabled: true,
        email: true,
      },
    });

    if (!dbUser) {
      this.logger.warn(`MFA Guard: User not found: ${user.userId}`);
      throw new UnauthorizedException('User not found');
    }

    // If user doesn't have MFA enabled, deny access to MFA-protected resource
    if (!dbUser.mfaEnabled) {
      this.logger.warn(
        `MFA Guard: User ${dbUser.email} attempted to access MFA-protected resource without MFA enabled`,
      );
      throw new UnauthorizedException(
        'Multi-Factor Authentication must be enabled to access this resource',
      );
    }

    // MFA is enabled, allow access
    this.logger.log(
      `MFA Guard: Access granted for user ${dbUser.email} to MFA-protected resource`,
    );
    return true;
  }
}
