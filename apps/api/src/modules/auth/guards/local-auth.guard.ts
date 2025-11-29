import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 * Used for email/password authentication (login endpoint)
 * Validates credentials using LocalStrategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
