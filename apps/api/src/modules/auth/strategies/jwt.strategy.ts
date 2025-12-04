import { Injectable, UnauthorizedException } from '@nestjs/common';
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
 * JWT Strategy for Passport
 * Validates JWT access tokens and attaches user data to request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
  }

  /**
   * Validates JWT payload and returns user data
   * This method is called after JWT signature is verified
   */
  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.usersService.findById(payload.sub);

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
