import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationV2Controller } from './automation-v2.controller';
import { AutomationAuditLogController } from './audit-log.controller';
import { AutomationService } from './automation.service';
import { AutomationSettingsService } from './automation-settings.service';
import { AutoApproveService } from './auto-approve.service';
import { AutomationIntegrationService } from './automation-integration.service';
import { AutomationAuditLogService } from './audit-log.service';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../auth/rbac/rbac.module';

/**
 * Automation Module
 * Manages automation settings and decision logic for various features
 *
 * Services:
 * - AutomationService: Legacy service (deprecated, kept for backward compatibility)
 * - AutomationSettingsService: CRUD for automation settings (W8-T3)
 * - AutoApproveService: Auto-approval workflow engine (W8-T4)
 * - AutomationIntegrationService: Integration points for other services
 * - AutomationAuditLogService: Audit logging and querying (W8-T7)
 *
 * Controllers:
 * - AutomationController: Legacy API endpoints
 * - AutomationV2Controller: New API endpoints using updated schema
 * - AutomationAuditLogController: Audit log querying and export (W8-T7)
 */
@Module({
  imports: [DatabaseModule, RbacModule],
  controllers: [
    AutomationController, // Legacy - keep for backward compatibility
    AutomationV2Controller, // New implementation
    AutomationAuditLogController, // W8-T7 - Audit logs
  ],
  providers: [
    AutomationService, // Legacy - keep for backward compatibility
    AutomationSettingsService, // W8-T3
    AutoApproveService, // W8-T4
    AutomationIntegrationService, // Integration helpers
    AutomationAuditLogService, // W8-T7 - Audit logging
  ],
  exports: [
    AutomationService, // Legacy exports
    AutomationSettingsService,
    AutoApproveService,
    AutomationIntegrationService, // Export for use in other modules
    AutomationAuditLogService, // Export for use in other modules
  ],
})
export class AutomationModule {}
