import { Module } from '@nestjs/common';
import { SvMeldungController } from './sv-meldung.controller';
import { SvMeldungService } from './sv-meldung.service';
import { CacheModule } from '../../cache/cache.module';

/**
 * SV-Meldung Module
 * German Social Security Reporting Integration
 *
 * Provides functionality for:
 * - Employee registration (Anmeldung)
 * - Employee deregistration (Abmeldung)
 * - Employment changes (Änderung)
 * - DEÜV message generation and validation
 */
@Module({
  imports: [CacheModule],
  controllers: [SvMeldungController],
  providers: [SvMeldungService],
  exports: [SvMeldungService],
})
export class SvMeldungModule {}
