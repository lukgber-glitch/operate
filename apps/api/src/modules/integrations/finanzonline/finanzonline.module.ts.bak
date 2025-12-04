import { Module } from '@nestjs/common';
import { FinanzOnlineController } from './finanzonline.controller';
import { FinanzOnlineService } from './finanzonline.service';
import { CacheModule } from '../../cache/cache.module';

/**
 * FinanzOnline Integration Module
 * Provides integration with Austrian FinanzOnline WebService for tax submissions
 *
 * Features:
 * - Certificate-based authentication
 * - VAT return submission (Umsatzsteuervoranmeldung)
 * - Income tax return submission (Einkommensteuererklärung)
 * - Submission status tracking
 * - Session management with Redis caching
 * - Encrypted credential storage
 * - Audit logging
 *
 * Environment Variables:
 * - FON_ENVIRONMENT: 'production' or 'sandbox' (default: sandbox)
 * - FON_TIMEOUT: Request timeout in ms (default: 30000)
 * - FON_DEBUG: Enable debug logging (default: false)
 * - FON_MAX_RETRIES: Maximum retry attempts (default: 3)
 * - FON_SESSION_TIMEOUT: Session timeout in minutes (default: 120)
 * - FON_ENCRYPTION_KEY: Key for encrypting credentials (required in production)
 */
@Module({
  imports: [CacheModule],
  controllers: [FinanzOnlineController],
  providers: [FinanzOnlineService],
  exports: [FinanzOnlineService],
})
export class FinanzOnlineModule {}
