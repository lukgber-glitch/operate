import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentOrg decorator
 * Extracts the current organisation ID from the request object
 * The org ID is typically set in a header or derived from the authenticated user's membership
 * Must be used with JwtAuthGuard or other authentication guard
 *
 * @example
 * @Get('invoices')
 * @UseGuards(JwtAuthGuard)
 * getInvoices(@CurrentOrg() orgId: string) {
 *   return this.invoiceService.findAll(orgId);
 * }
 */
export const CurrentOrg = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Try to get org from header first (x-org-id)
    const headerOrgId = request.headers['x-org-id'];
    if (headerOrgId) {
      return headerOrgId;
    }

    // Fall back to user's current membership
    if (request.user?.currentOrgId) {
      return request.user.currentOrgId;
    }

    // Fall back to user's first membership
    if (request.user?.memberships?.[0]?.orgId) {
      return request.user.memberships[0].orgId;
    }

    return null;
  },
);
