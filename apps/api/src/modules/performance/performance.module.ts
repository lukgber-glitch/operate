import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Performance Module
 * Provides performance monitoring and metrics endpoints
 */
@Module({
  imports: [RbacModule],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
