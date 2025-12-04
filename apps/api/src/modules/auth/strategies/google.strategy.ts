import { Injectable, Logger, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthProfile, OAuthUser } from '../dto/oauth-callback.dto';

/**
 * Check if Google OAuth is configured
 */
function isGoogleOAuthEnabled(configService: ConfigService): boolean {
  const clientId = configService.get<string>('oauth.google.clientId');
  const clientSecret = configService.get<string>('oauth.google.clientSecret');
  return !!(clientId && clientId !== 'disabled' && clientSecret && clientSecret !== 'disabled');
}

/**
 * Google OAuth2 Strategy
 * Handles authentication via Google OAuth
 * Only active when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are properly configured
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    const clientId = configService.get<string>('oauth.google.clientId');
    const clientSecret = configService.get<string>('oauth.google.clientSecret');
    const callbackUrl = configService.get<string>('oauth.google.callbackUrl');

    // Use placeholder values if OAuth is disabled - strategy won't be used anyway
    super({
      clientID: clientId && clientId !== 'disabled' ? clientId : 'placeholder-disabled',
      clientSecret: clientSecret && clientSecret !== 'disabled' ? clientSecret : 'placeholder-disabled',
      callbackURL: callbackUrl || 'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });

    if (!isGoogleOAuthEnabled(configService)) {
      this.logger.warn('Google OAuth is disabled - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
    }
  }

  /**
   * Validate Google OAuth callback
   * Called by Passport after successful OAuth flow
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.log(`Google OAuth callback for user: ${profile.id}`);

      // Extract user information from Google profile
      const { id, emails, name, photos, locale } = profile;

      // Ensure email exists
      if (!emails || emails.length === 0) {
        return done(new Error('No email found in Google profile'), false);
      }

      const email = emails[0].value;
      const firstName = name?.givenName || '';
      const lastName = name?.familyName || '';
      const avatarUrl = photos?.[0]?.value || null;

      // Create OAuth profile data
      const oauthProfile: OAuthProfile = {
        id,
        email,
        firstName,
        lastName,
        avatarUrl,
        locale: locale || 'en',
      };

      // Return profile with tokens
      const oauthUser: OAuthUser = {
        provider: 'google',
        providerId: id,
        accessToken,
        refreshToken,
        profile: oauthProfile,
      };

      return done(null, oauthUser as any);
    } catch (error) {
      this.logger.error('Google OAuth validation failed', error.message);
      return done(error, false);
    }
  }
}
