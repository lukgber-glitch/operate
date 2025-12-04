import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { CurrentOrg } from '../../auth/decorators/current-org.decorator';

@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Budget created successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @CurrentOrg() orgId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.create(orgId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for the organisation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of budgets',
    type: [BudgetResponseDto],
  })
  async findAll(@CurrentOrg() orgId: string): Promise<BudgetResponseDto[]> {
    return this.budgetsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget details',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  async findOne(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget updated successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.update(orgId, id, updateBudgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Budget deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  async remove(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.budgetsService.remove(orgId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget paused successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Budget is already paused',
  })
  async pause(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.pause(orgId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget resumed successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Budget is not paused',
  })
  async resume(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.resume(orgId, id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get alerts for a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of alerts to return (default: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of budget alerts',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
  })
  async getAlerts(
    @CurrentOrg() orgId: string,
    @Param('id') budgetId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.budgetsService.getAlerts(orgId, budgetId, limit);
  }

  @Post(':id/alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge a budget alert' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alert acknowledged successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget or alert not found',
  })
  async acknowledgeAlert(
    @CurrentOrg() orgId: string,
    @Param('id') budgetId: string,
    @Param('alertId') alertId: string,
  ) {
    return this.budgetsService.acknowledgeAlert(orgId, budgetId, alertId);
  }
}
