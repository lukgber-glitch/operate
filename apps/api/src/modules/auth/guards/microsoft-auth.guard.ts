import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Microsoft OAuth Guard
 * Extends AuthGuard to pass prompt=select_account for account picker
 */
@Injectable()
export class MicrosoftAuthGuard extends AuthGuard('microsoft') {
  constructor() {
    super({
      prompt: 'select_account',
    });
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return {
      prompt: 'select_account',
    };
  }
}
