import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../dto/auth-response.dto';
import { UsersService } from '../../users/users.service';

/**
 * Custom JWT extractor that reads from cookies
 */
const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

/**
 * SEC-011: User validation cache entry
 */
interface UserCacheEntry {
  exists: boolean;
  cachedAt: number;
}

/**
 * JWT Strategy for Passport
 * Validates JWT access tokens and attaches user data to request
 *
 * SECURITY OPTIMIZATION:
 * - SEC-011: User validation caching (30 second TTL) to reduce DB hits
 * - Cache invalidation on token expiry check
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  // SEC-011: In-memory cache for user validation
  // Short TTL (30s) balances performance vs security (user deletion/deactivation)
  private readonly userCache = new Map<string, UserCacheEntry>();
  private readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback for backward compatibility
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });

    // SEC-011: Clean up expired cache entries every 60 seconds
    setInterval(() => this.cleanupCache(), 60 * 1000);
  }

  /**
   * SEC-011: Check if cached user validation is still valid
   */
  private getCachedUserExists(userId: string): boolean | null {
    const entry = this.userCache.get(userId);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.cachedAt > this.CACHE_TTL_MS) {
      this.userCache.delete(userId);
      return null;
    }

    return entry.exists;
  }

  /**
   * SEC-011: Cache user validation result
   */
  private cacheUserExists(userId: string, exists: boolean): void {
    this.userCache.set(userId, {
      exists,
      cachedAt: Date.now(),
    });
  }

  /**
   * SEC-011: Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [userId, entry] of this.userCache.entries()) {
      if (now - entry.cachedAt > this.CACHE_TTL_MS) {
        this.userCache.delete(userId);
      }
    }
  }

  /**
   * Invalidate user from cache (call when user is deleted/deactivated)
   */
  public invalidateUser(userId: string): void {
    this.userCache.delete(userId);
  }

  /**
   * Validates JWT payload and returns user data
   * This method is called after JWT signature is verified
   *
   * SECURITY:
   * - SEC-011: Uses caching to reduce DB hits while maintaining security
   */
  async validate(payload: JwtPayload) {
    // SEC-011: Check cache first
    const cachedExists = this.getCachedUserExists(payload.sub);

    if (cachedExists === true) {
      // User exists in cache, skip DB lookup
      return {
        userId: payload.sub,
        email: payload.email,
        orgId: payload.orgId,
        role: payload.role,
      };
    }

    if (cachedExists === false) {
      // User was recently checked and doesn't exist
      throw new UnauthorizedException('User not found or inactive');
    }

    // Cache miss - verify user still exists and is active
    const user = await this.usersService.findById(payload.sub);

    // SEC-011: Cache the result
    this.cacheUserExists(payload.sub, !!user);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user data that will be attached to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
