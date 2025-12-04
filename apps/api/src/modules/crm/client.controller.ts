import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ClientService } from './client.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFilterDto,
  BulkUpdateDto,
  CreateContactDto,
  CreateAddressDto,
  CreateNoteDto,
  ClientResponseDto,
} from './dto/client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('CRM - Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // ============================================================================
  // CLIENT CRUD OPERATIONS
  // ============================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    type: ClientResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Client with email/taxId already exists' })
  async create(@Req() req: any, @Body() createClientDto: CreateClientDto) {
    const { orgId, userId } = req.user;
    return this.clientService.create(orgId, createClientDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of clients retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['INDIVIDUAL', 'COMPANY'] })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'isVip', required: false, type: Boolean })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor for cursor-based pagination' })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(@Req() req: any, @Query() filters: ClientFilterDto) {
    const { orgId } = req.user;
    return this.clientService.findAll(orgId, filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search clients by query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Req() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const { orgId } = req.user;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.clientService.search(orgId, query, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client statistics for organization' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Req() req: any) {
    const { orgId } = req.user;
    return this.clientService.getStats(orgId);
  }

  @Get('top-revenue')
  @ApiOperation({ summary: 'Get top clients by revenue' })
  @ApiResponse({ status: 200, description: 'Top clients retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopByRevenue(@Req() req: any, @Query('limit') limit?: string) {
    const { orgId } = req.user;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.clientService.getTopByRevenue(orgId, limitNum);
  }

  @Get('requiring-attention')
  @ApiOperation({ summary: 'Get clients requiring attention (high risk, no recent contact)' })
  @ApiResponse({ status: 200, description: 'Clients requiring attention retrieved successfully' })
  async getRequiringAttention(@Req() req: any) {
    const { orgId } = req.user;
    return this.clientService.getRequiringAttention(orgId);
  }

  @Get('by-number/:clientNumber')
  @ApiOperation({ summary: 'Get client by client number' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'clientNumber', type: String, example: 'CLT-001' })
  async findByClientNumber(@Req() req: any, @Param('clientNumber') clientNumber: string) {
    const { orgId } = req.user;
    return this.clientService.findByClientNumber(orgId, clientNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID with all related data' })
  @ApiResponse({
    status: 200,
    description: 'Client retrieved successfully',
    type: ClientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.clientService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client by ID' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 409, description: 'Email or taxId conflict' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const { orgId, userId } = req.user;
    return this.clientService.update(id, orgId, updateClientDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete client by ID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') id: string) {
    const { orgId, userId } = req.user;
    return this.clientService.remove(id, orgId, userId);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple clients' })
  @ApiResponse({ status: 200, description: 'Clients updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async bulkUpdate(@Req() req: any, @Body() bulkUpdateDto: BulkUpdateDto) {
    const { orgId, userId } = req.user;
    return this.clientService.bulkUpdate(orgId, bulkUpdateDto, userId);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk soft delete multiple clients' })
  @ApiResponse({ status: 200, description: 'Clients deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async bulkDelete(@Req() req: any, @Body() body: { clientIds: string[] }) {
    const { orgId, userId } = req.user;
    return this.clientService.bulkDelete(orgId, body.clientIds, userId);
  }

  // ============================================================================
  // CLIENT CONTACTS
  // ============================================================================

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Get all contacts for a client' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async getContacts(@Req() req: any, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.clientService.getContacts(id, orgId);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add a new contact to a client' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async addContact(
    @Req() req: any,
    @Param('id') id: string,
    @Body() createContactDto: CreateContactDto,
  ) {
    const { orgId, userId } = req.user;
    return this.clientService.addContact(id, orgId, createContactDto, userId);
  }

  // ============================================================================
  // CLIENT ADDRESSES
  // ============================================================================

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Get all addresses for a client' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async getAddresses(@Req() req: any, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.clientService.getAddresses(id, orgId);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add a new address to a client' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async addAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    const { orgId, userId } = req.user;
    return this.clientService.addAddress(id, orgId, createAddressDto, userId);
  }

  // ============================================================================
  // CLIENT ACTIVITY & NOTES
  // ============================================================================

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get recent activity for a client (communications, notes)' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivity(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const { orgId } = req.user;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.clientService.getActivity(id, orgId, limitNum);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to a client' })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async addNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    const { orgId, userId } = req.user;
    return this.clientService.addNote(id, orgId, createNoteDto, userId);
  }

  // ============================================================================
  // CLIENT METRICS & RISK ASSESSMENT
  // ============================================================================

  @Post(':id/update-metrics')
  @ApiOperation({ summary: 'Manually update client metrics (revenue, invoices, payments)' })
  @ApiResponse({ status: 200, description: 'Metrics updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async updateMetrics(@Req() req: any, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.clientService.updateMetrics(id, orgId);
  }

  @Post(':id/assess-risk')
  @ApiOperation({ summary: 'Assess and update client risk level' })
  @ApiResponse({
    status: 200,
    description: 'Risk assessment completed',
    schema: {
      type: 'object',
      properties: {
        riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        riskScore: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async assessRisk(@Req() req: any, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.clientService.assessRisk(id, orgId);
  }
}
