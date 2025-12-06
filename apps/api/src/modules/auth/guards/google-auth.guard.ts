import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * Extends AuthGuard to pass prompt=select_account for account picker
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    return super.handleRequest(err, user, info, context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return {
      prompt: 'select_account',
      accessType: 'offline',
      scope: ['openid', 'email', 'profile'],
    };
  }
}
