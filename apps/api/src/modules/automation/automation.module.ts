import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Automation Module
 * Manages automation settings and decision logic for various features
 */
@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
