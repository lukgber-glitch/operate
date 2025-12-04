import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { UsersModule } from '../users/users.module';
import { MfaModule } from './mfa/mfa.module';
import { MfaGuard } from './guards/mfa.guard';
import { RbacModule } from './rbac/rbac.module';

/**
 * Authentication Module
 * Provides JWT-based authentication with access and refresh tokens
 * Supports OAuth2 authentication with Google and Microsoft
 * Includes Role-Based Access Control (RBAC)
 */
@Module({
  imports: [
    // Make UsersModule available
    UsersModule,

    // MFA Module for Multi-Factor Authentication
    MfaModule,

    // RBAC Module for Role-Based Access Control
    RbacModule,

    // Configure Passport
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // Configure JWT module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    MicrosoftStrategy,
    MfaGuard,
  ],
  exports: [AuthService, OAuthService, JwtStrategy, PassportModule, MfaGuard, RbacModule],
})
export class AuthModule {}
