/**
 * Auth Module Exports
 * Central export point for all authentication-related components
 */

// Core Auth
export * from './auth.module';
export * from './auth.service';
export * from './auth.controller';

// OAuth
export * from './oauth.service';
export * from './oauth.controller';

// MFA
export * from './mfa';

// Guards
export * from './guards/jwt-auth.guard';
export * from './guards/local-auth.guard';
export * from './guards/mfa.guard';

// Decorators
export * from './decorators/require-mfa.decorator';

// Strategies
export * from './strategies/jwt.strategy';
export * from './strategies/local.strategy';
export * from './strategies/google.strategy';
export * from './strategies/microsoft.strategy';

// DTOs
export * from './dto/auth-response.dto';
export * from './dto/login.dto';
export * from './dto/register.dto';
export * from './dto/refresh-token.dto';
export * from './dto/oauth-callback.dto';
export * from './dto/complete-mfa-login.dto';

// RBAC
export * from './rbac';
