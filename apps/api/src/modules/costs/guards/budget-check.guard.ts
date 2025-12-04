import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CostCategory } from '@prisma/client';
import { BudgetsService } from '../budgets/budgets.service';

/**
 * Metadata key for budget check decorator
 */
export const BUDGET_CHECK_KEY = 'budget_check';

/**
 * Interface for budget check metadata
 */
export interface BudgetCheckMetadata {
  category: CostCategory;
  amountKey?: string; // Key in request body to get amount, default: 'amount'
}

/**
 * Decorator to enable budget checking for an endpoint
 * @param category Cost category to check
 * @param amountKey Key in request body to extract amount (default: 'amount')
 */
export const CheckBudget = (category: CostCategory, amountKey = 'amount') =>
  SetMetadata(BUDGET_CHECK_KEY, { category, amountKey } as BudgetCheckMetadata);

/**
 * Guard that checks if a cost operation is allowed within budget limits
 * Use with @CheckBudget decorator
 *
 * Example:
 * @Post()
 * @CheckBudget(CostCategory.AI_CLASSIFICATION)
 * async classify(@Body() dto: ClassifyDto) { ... }
 */
@Injectable()
export class BudgetCheckGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly budgetsService: BudgetsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<BudgetCheckMetadata>(
      BUDGET_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      // No budget check required
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const orgId = request.user?.orgId || request.org?.id;

    if (!orgId) {
      // No org context, skip check (will fail auth later)
      return true;
    }

    const { category, amountKey } = metadata;
    const amount = amountKey ? request.body?.[amountKey] : undefined;

    if (amount === undefined || amount === null) {
      // No amount to check
      return true;
    }

    const result = await this.budgetsService.canIncurCost(
      orgId,
      category,
      amount,
    );

    if (!result.allowed) {
      throw new ForbiddenException({
        message: result.reason || 'Budget limit exceeded',
        budgetId: result.budgetId,
        category,
        amount,
      });
    }

    return true;
  }
}
