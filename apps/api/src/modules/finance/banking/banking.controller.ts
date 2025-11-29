import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankTransactionQueryDto } from './dto/bank-transaction-query.dto';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Banking Controller
 * Handles bank account and transaction operations
 */
@ApiTags('Finance - Banking')
@Controller('organisations/:orgId/banking')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class BankingController {
  constructor(private bankingService: BankingService) {}

  // ============================================================================
  // BANK ACCOUNT ENDPOINTS
  // ============================================================================

  /**
   * List all bank accounts
   */
  @Get('accounts')
  @RequirePermissions(Permission.BANKING_READ)
  @ApiOperation({
    summary: 'List bank accounts',
    description: 'Get all bank accounts for organisation',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank accounts retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAllAccounts(@Param('orgId') orgId: string) {
    return this.bankingService.findAllAccounts(orgId);
  }

  /**
   * Get bank account by ID with balance
   */
  @Get('accounts/:id')
  @RequirePermissions(Permission.BANKING_READ)
  @ApiOperation({
    summary: 'Get bank account',
    description: 'Retrieve bank account by ID with current balance',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank account retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank account not found',
  })
  async findAccount(@Param('id') id: string) {
    return this.bankingService.findAccountById(id);
  }

  /**
   * Create bank account
   */
  @Post('accounts')
  @RequirePermissions(Permission.BANKING_CREATE)
  @ApiOperation({
    summary: 'Create bank account',
    description: 'Add a new bank account',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Bank account created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createAccount(
    @Param('orgId') orgId: string,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ) {
    return this.bankingService.createAccount(orgId, createBankAccountDto);
  }

  /**
   * Update bank account
   */
  @Patch('accounts/:id')
  @RequirePermissions(Permission.BANKING_UPDATE)
  @ApiOperation({
    summary: 'Update bank account',
    description: 'Update bank account details',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank account updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank account not found',
  })
  async updateAccount(
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankingService.updateAccount(id, updateBankAccountDto);
  }

  /**
   * Delete bank account
   */
  @Delete('accounts/:id')
  @RequirePermissions(Permission.BANKING_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete bank account',
    description: 'Delete bank account and all its transactions',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Bank account deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete primary account',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank account not found',
  })
  async deleteAccount(@Param('id') id: string): Promise<void> {
    return this.bankingService.deleteAccount(id);
  }

  /**
   * Set bank account as primary
   */
  @Post('accounts/:id/set-primary')
  @RequirePermissions(Permission.BANKING_UPDATE)
  @ApiOperation({
    summary: 'Set as primary account',
    description: 'Set this bank account as the primary account',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Account set as primary',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot set inactive account as primary',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank account not found',
  })
  async setPrimary(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.bankingService.setPrimaryAccount(id, orgId);
  }

  // ============================================================================
  // BANK TRANSACTION ENDPOINTS
  // ============================================================================

  /**
   * List transactions for an account
   */
  @Get('accounts/:id/transactions')
  @RequirePermissions(Permission.BANKING_READ)
  @ApiOperation({
    summary: 'List transactions',
    description: 'Get transactions for a bank account with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async findTransactions(
    @Param('id') accountId: string,
    @Query() query: BankTransactionQueryDto,
  ) {
    return this.bankingService.findAllTransactions(accountId, query);
  }

  /**
   * Import transactions for an account
   */
  @Post('accounts/:id/transactions')
  @RequirePermissions(Permission.BANKING_CREATE)
  @ApiOperation({
    summary: 'Import transactions',
    description: 'Bulk import bank transactions (skips duplicates)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Transactions imported successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank account not found',
  })
  async importTransactions(
    @Param('id') accountId: string,
    @Body() importTransactionsDto: ImportTransactionsDto,
  ) {
    return this.bankingService.importTransactions(
      accountId,
      importTransactionsDto,
    );
  }

  /**
   * Update transaction
   */
  @Patch('transactions/:id')
  @RequirePermissions(Permission.BANKING_UPDATE)
  @ApiOperation({
    summary: 'Update transaction',
    description: 'Update transaction category and reconciliation status',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Transaction category',
          example: 'Sales',
        },
        isReconciled: {
          type: 'boolean',
          description: 'Reconciliation status',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async updateTransaction(
    @Param('id') id: string,
    @Body() updates: { category?: string; isReconciled?: boolean },
  ) {
    return this.bankingService.updateTransaction(id, updates);
  }
}
