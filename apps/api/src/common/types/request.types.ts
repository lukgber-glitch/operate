import { Request } from 'express';

/**
 * User data attached to authenticated requests
 * Set by JWT Strategy after token validation
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  orgId: string;
  role: string;
}

/**
 * Express Request with authenticated user
 * Use this for all @Request() or @Req() decorators in controllers
 */
export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
