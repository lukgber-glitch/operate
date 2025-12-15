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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Expenses Controller
 * Handles expense management operations
 */
@ApiTags('Finance - Expenses')
@Controller('organisations/:orgId/expenses')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  /**
   * List all expenses in organisation
   */
  @Get()
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'List expenses',
    description: 'Get paginated list of expenses with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Expenses retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: ExpenseQueryDto,
  ) {
    try {
      return await this.expensesService.findAll(orgId, query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  @Get('statistics')
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'Get expense statistics',
    description: 'Get totals by category and status',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Param('orgId') orgId: string) {
    try {
      return await this.expensesService.getStatistics(orgId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending expenses
   */
  @Get('pending')
  @RequirePermissions(Permission.EXPENSES_APPROVE)
  @ApiOperation({
    summary: 'Get pending expenses',
    description: 'Get all expenses awaiting approval',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending expenses retrieved successfully',
  })
  async getPending(@Param('orgId') orgId: string) {
    try {
      return await this.expensesService.getPending(orgId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single expense by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'Get expense',
    description: 'Retrieve single expense by ID',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async findOne(@Param('id') id: string) {
    try {
      return await this.expensesService.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new expense
   */
  @Post()
  @RequirePermissions(Permission.EXPENSES_CREATE)
  @ApiOperation({
    summary: 'Create expense',
    description: 'Create a new expense (status = PENDING)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Expense created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(orgId, createExpenseDto);
  }

  /**
   * Update expense
   */
  @Patch(':id')
  @RequirePermissions(Permission.EXPENSES_UPDATE)
  @ApiOperation({
    summary: 'Update expense',
    description: 'Update expense details (only PENDING expenses)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-pending expense',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  /**
   * Approve expense
   */
  @Post(':id/approve')
  @RequirePermissions(Permission.EXPENSES_APPROVE)
  @ApiOperation({
    summary: 'Approve expense',
    description: 'Approve an expense for reimbursement',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approvedBy: {
          type: 'string',
          description: 'User ID of approver',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      required: ['approvedBy'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Expense approved',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot approve non-pending expense',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async approve(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.expensesService.approve(id, approvedBy);
  }

  /**
   * Reject expense
   */
  @Post(':id/reject')
  @RequirePermissions(Permission.EXPENSES_APPROVE)
  @ApiOperation({
    summary: 'Reject expense',
    description: 'Reject an expense with reason',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Rejection reason',
          example: 'Missing receipt',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Expense rejected',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot reject non-pending expense',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.expensesService.reject(id, reason);
  }

  /**
   * Mark expense as reimbursed
   */
  @Post(':id/reimburse')
  @RequirePermissions(Permission.EXPENSES_UPDATE)
  @ApiOperation({
    summary: 'Reimburse expense',
    description: 'Mark approved expense as reimbursed',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense marked as reimbursed',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot reimburse non-approved expense',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async reimburse(@Param('id') id: string) {
    return this.expensesService.reimburse(id);
  }

  /**
   * Delete expense
   */
  @Delete(':id')
  @RequirePermissions(Permission.EXPENSES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete expense',
    description: 'Delete expense (only PENDING expenses)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Expense deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-pending expense',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.expensesService.delete(id);
  }
}
