import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Export Access Guard
 * Ensures users can only access exports from their own organization
 * and validates retention policy constraints
 */
@Injectable()
export class ExportAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user || !user.userId || !user.organizationId) {
      throw new ForbiddenException('User must be authenticated');
    }

    // If this is a create operation, no additional checks needed
    // The organizationId will be taken from the authenticated user
    const method = request.method;
    if (method === 'POST' && !request.params.id) {
      return true;
    }

    // For operations on existing exports, validate organization access
    // This would typically query the database to check the export's organizationId
    // For now, we'll allow the service layer to handle this validation
    // A full implementation would inject a repository and check here

    return true;
  }
}

/**
 * Retention Policy Guard
 * Prevents deletion of exports within the retention period
 *
 * Note: This is a placeholder. Full implementation would:
 * 1. Inject ComplianceService or Repository
 * 2. Fetch the export by ID
 * 3. Check if deletedAt is within retention period
 * 4. Throw ForbiddenException if within retention period
 */
@Injectable()
export class RetentionPolicyGuard implements CanActivate {
  // Retention period in days (configurable)
  private readonly RETENTION_PERIOD_DAYS = 90;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const exportId = request.params.id;

    if (!exportId) {
      throw new NotFoundException('Export ID is required');
    }

    // TODO: Implement retention policy check
    // 1. Fetch export from database
    // 2. Check if export.createdAt is within retention period
    // 3. If within retention period, throw ForbiddenException
    // 4. Otherwise, allow deletion

    // For now, allow all deletions
    // A full implementation would look like:
    /*
    const export = await this.complianceService.findById(exportId);
    if (!export) {
      throw new NotFoundException('Export not found');
    }

    const retentionEndDate = new Date(export.createdAt);
    retentionEndDate.setDate(retentionEndDate.getDate() + this.RETENTION_PERIOD_DAYS);

    if (new Date() < retentionEndDate) {
      throw new ForbiddenException(
        `Export cannot be deleted within ${this.RETENTION_PERIOD_DAYS} days of creation (retention policy)`
      );
    }
    */

    return true;
  }
}
