import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-microsoft';
import { OAuthProfile, OAuthUser } from '../dto/oauth-callback.dto';

/**
 * Check if Microsoft OAuth is configured
 */
function isMicrosoftOAuthEnabled(configService: ConfigService): boolean {
  const clientId = configService.get<string>('oauth.microsoft.clientId');
  const clientSecret = configService.get<string>('oauth.microsoft.clientSecret');
  return !!(clientId && clientId !== 'disabled' && clientSecret && clientSecret !== 'disabled');
}

/**
 * Microsoft OAuth2 Strategy
 * Handles authentication via Microsoft OAuth (Azure AD)
 * Only active when MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are properly configured
 */
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(
  Strategy,
  'microsoft',
) {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(private configService: ConfigService) {
    const clientId = configService.get<string>('oauth.microsoft.clientId');
    const clientSecret = configService.get<string>('oauth.microsoft.clientSecret');
    const callbackUrl = configService.get<string>('oauth.microsoft.callbackUrl');
    const tenant = configService.get<string>('oauth.microsoft.tenant') || 'common';

    // Use placeholder values if OAuth is disabled - strategy won't be used anyway
    super({
      clientID: clientId && clientId !== 'disabled' ? clientId : 'placeholder-disabled',
      clientSecret: clientSecret && clientSecret !== 'disabled' ? clientSecret : 'placeholder-disabled',
      callbackURL: callbackUrl || 'http://localhost:3000/api/v1/auth/microsoft/callback',
      scope: ['openid', 'user.read', 'email', 'profile', 'offline_access'],
      tenant,
      // Show account picker for selecting saved accounts
      prompt: 'select_account',
    });

    if (!isMicrosoftOAuthEnabled(configService)) {
      this.logger.warn('Microsoft OAuth is disabled - MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET not configured');
    }
  }

  /**
   * Validate Microsoft OAuth callback
   * Called by Passport after successful OAuth flow
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      this.logger.log(`Microsoft OAuth callback for user: ${profile.id}`);

      // Extract user information from Microsoft profile
      const { id, emails, name, displayName } = profile;

      // Ensure email exists
      if (!emails || emails.length === 0) {
        return done(new Error('No email found in Microsoft profile'), false);
      }

      const email = emails[0].value;

      // Parse name - Microsoft may provide it differently
      let firstName = '';
      let lastName = '';

      if (name?.givenName && name?.familyName) {
        firstName = name.givenName;
        lastName = name.familyName;
      } else if (displayName) {
        // Try to split display name
        const nameParts = displayName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Create OAuth profile data
      const oauthProfile: OAuthProfile = {
        id,
        email,
        firstName,
        lastName,
        avatarUrl: undefined, // Microsoft Graph API photo requires separate call
        locale: 'en', // Microsoft doesn't provide locale in basic profile
      };

      // Return profile with tokens
      const oauthUser: OAuthUser = {
        provider: 'microsoft',
        providerId: id,
        accessToken,
        refreshToken,
        profile: oauthProfile,
      };

      return done(null, oauthUser);
    } catch (error) {
      this.logger.error('Microsoft OAuth validation failed', error.message);
      return done(error, false);
    }
  }
}
