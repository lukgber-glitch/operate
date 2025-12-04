import { Module } from '@nestjs/common';
import { ViesController } from './vies.controller';
import { ViesService } from './vies.service';
import { ViesClient } from './vies.client';
import { CacheModule } from '../../cache/cache.module';

/**
 * VIES VAT Validation Module
 * Provides EU VAT number validation via VIES service
 */
@Module({
  imports: [CacheModule],
  controllers: [ViesController],
  providers: [ViesService, ViesClient],
  exports: [ViesService],
})
export class ViesModule {}
