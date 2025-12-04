import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import {
  CreateRuleDto,
  ReconciliationFilter,
  ApplyMatchDto,
  IgnoreTransactionDto,
} from './reconciliation.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('organisations/:orgId/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  /**
   * GET /organisations/:orgId/reconciliation/unmatched
   * Get all unmatched transactions for an organisation
   */
  @Get('unmatched')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async getUnmatchedTransactions(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('merchantName') merchantName?: string,
    @Query('accountId') accountId?: string,
  ) {
    const filters: ReconciliationFilter = {
      status: status as any,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      merchantName,
      accountId,
    };

    return this.reconciliationService.getUnmatchedTransactions(orgId, filters);
  }

  /**
   * GET /organisations/:orgId/reconciliation/transactions/:id/matches
   * Get suggested matches for a specific transaction
   */
  @Get('transactions/:id/matches')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async getSuggestedMatches(
    @Param('orgId') orgId: string,
    @Param('id') transactionId: string,
  ) {
    return this.reconciliationService.getSuggestedMatches(transactionId);
  }

  /**
   * POST /organisations/:orgId/reconciliation/transactions/:id/match
   * Apply a match to a transaction
   */
  @Post('transactions/:id/match')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async applyMatch(
    @Param('orgId') orgId: string,
    @Param('id') transactionId: string,
    @Body() matchDto: ApplyMatchDto,
  ) {
    return this.reconciliationService.applyMatch(transactionId, matchDto);
  }

  /**
   * POST /organisations/:orgId/reconciliation/transactions/:id/undo
   * Undo a match
   */
  @Post('transactions/:id/undo')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async undoMatch(
    @Param('orgId') orgId: string,
    @Param('id') transactionId: string,
  ) {
    await this.reconciliationService.undoMatch(transactionId);
  }

  /**
   * POST /organisations/:orgId/reconciliation/transactions/:id/ignore
   * Mark a transaction as ignored
   */
  @Post('transactions/:id/ignore')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async ignoreTransaction(
    @Param('orgId') orgId: string,
    @Param('id') transactionId: string,
    @Body() dto: IgnoreTransactionDto,
  ) {
    await this.reconciliationService.ignoreTransaction(transactionId, dto);
  }

  /**
   * POST /organisations/:orgId/reconciliation/auto
   * Run auto-reconciliation for the organisation
   */
  @Post('auto')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async autoReconcile(@Param('orgId') orgId: string) {
    return this.reconciliationService.autoReconcile(orgId);
  }

  /**
   * GET /organisations/:orgId/reconciliation/stats
   * Get reconciliation statistics
   */
  @Get('stats')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async getReconciliationStats(@Param('orgId') orgId: string) {
    return this.reconciliationService.getReconciliationStats(orgId);
  }

  /**
   * POST /organisations/:orgId/reconciliation/rules
   * Create a new reconciliation rule
   */
  @Post('rules')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createRule(
    @Param('orgId') orgId: string,
    @Body() dto: CreateRuleDto,
  ) {
    return this.reconciliationService.createRule(orgId, dto);
  }
}
