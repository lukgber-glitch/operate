import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeyManagementService } from './key-management.service';

/**
 * Security Module
 *
 * Provides security services:
 * - Key management (encryption/decryption)
 * - KMS/HSM integration
 * - Certificate management utilities
 */
@Module({
  imports: [ConfigModule],
  providers: [KeyManagementService],
  exports: [KeyManagementService],
})
export class SecurityModule {}
