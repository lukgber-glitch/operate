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
  ApiQuery,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';
import { QuoteStatus } from '@prisma/client';

/**
 * Quotes Controller
 * Handles quote/estimate management operations
 */
@ApiTags('Finance - Quotes')
@Controller('organisations/:orgId/quotes')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  /**
   * List all quotes in organisation
   */
  @Get()
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'List quotes',
    description: 'Get paginated list of quotes with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: QuoteStatus,
    description: 'Filter by quote status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Search in quote number, title, description',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: 'number',
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quotes retrieved successfully',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query('status') status?: QuoteStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quotesService.findAll(orgId, {
      status,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  /**
   * Get single quote by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.INVOICES_READ)
  @ApiOperation({
    summary: 'Get quote',
    description: 'Retrieve single quote by ID with items',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async findOne(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.quotesService.findOne(id, orgId);
  }

  /**
   * Create new quote
   */
  @Post()
  @RequirePermissions(Permission.INVOICES_CREATE)
  @ApiOperation({
    summary: 'Create quote',
    description: 'Create a new quote with items (auto-generates quote number)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createQuoteDto: CreateQuoteDto,
  ) {
    return this.quotesService.create(orgId, createQuoteDto);
  }

  /**
   * Update quote
   */
  @Patch(':id')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Update quote',
    description: 'Update quote details (only DRAFT quotes)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update non-draft quote',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, orgId, updateQuoteDto);
  }

  /**
   * Delete quote
   */
  @Delete(':id')
  @RequirePermissions(Permission.INVOICES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete quote',
    description: 'Delete quote (only DRAFT quotes)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Quote deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete non-draft quote',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async delete(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
  ): Promise<void> {
    return this.quotesService.delete(id, orgId);
  }

  /**
   * Send quote to client
   */
  @Post(':id/send')
  @RequirePermissions(Permission.INVOICES_UPDATE)
  @ApiOperation({
    summary: 'Send quote',
    description: 'Mark quote as sent and generate public access token',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote marked as sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot send non-draft quote',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async send(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.quotesService.send(id, orgId);
  }

  /**
   * Convert quote to invoice
   */
  @Post(':id/convert')
  @RequirePermissions(Permission.INVOICES_CREATE)
  @ApiOperation({
    summary: 'Convert to invoice',
    description: 'Convert accepted quote to invoice',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote converted to invoice',
  })
  @ApiResponse({
    status: 400,
    description: 'Quote cannot be converted',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async convertToInvoice(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
  ) {
    return this.quotesService.convertToInvoice(id, orgId);
  }

  /**
   * Get quote by public token (no auth required)
   */
  @Get('public/:token')
  @ApiOperation({
    summary: 'Get quote (public)',
    description: 'Retrieve quote by public token (no authentication required)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID (not used but required by route)',
    type: 'string',
  })
  @ApiParam({
    name: 'token',
    description: 'Public access token',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async getPublic(@Param('token') token: string) {
    return this.quotesService.findByPublicToken(token);
  }

  /**
   * Accept quote (public, no auth)
   */
  @Post('public/:token/accept')
  @ApiOperation({
    summary: 'Accept quote (public)',
    description: 'Client accepts quote via public token (no authentication required)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID (not used but required by route)',
    type: 'string',
  })
  @ApiParam({
    name: 'token',
    description: 'Public access token',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Quote cannot be accepted',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async acceptPublic(@Param('token') token: string) {
    return this.quotesService.acceptByToken(token);
  }

  /**
   * Reject quote (public, no auth)
   */
  @Post('public/:token/reject')
  @ApiOperation({
    summary: 'Reject quote (public)',
    description: 'Client rejects quote via public token (no authentication required)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID (not used but required by route)',
    type: 'string',
  })
  @ApiParam({
    name: 'token',
    description: 'Public access token',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Quote cannot be rejected',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async rejectPublic(@Param('token') token: string) {
    return this.quotesService.rejectByToken(token);
  }
}
