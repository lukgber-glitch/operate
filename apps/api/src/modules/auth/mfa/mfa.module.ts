import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * MFA Module
 * Provides Multi-Factor Authentication functionality using TOTP
 * Includes setup, verification, backup codes, and management endpoints
 */
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
