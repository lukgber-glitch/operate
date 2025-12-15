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
  Req,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ContractStatus } from '@prisma/client';
import {
  CreateContractDto,
  UpdateContractDto,
  SendContractDto,
  SignContractDto,
  CreateFromTemplateDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  ContractResponseDto,
  TemplateResponseDto,
} from './dto/contract.dto';
import type { Request, Response } from 'express';

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ============================================================================
  // CONTRACT ENDPOINTS
  // ============================================================================

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all contracts' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved', type: [ContractResponseDto] })
  async findAll(
    @Req() req: any,
    @Query('status') status?: ContractStatus,
    @Query('clientId') clientId?: string,
  ) {
    const organisationId = req.user.organisationId;
    return this.contractsService.findAll(organisationId, { status, clientId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract retrieved', type: ContractResponseDto })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const organisationId = req.user.organisationId;
    return this.contractsService.findOne(id, organisationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new contract' })
  @ApiResponse({ status: 201, description: 'Contract created', type: ContractResponseDto })
  async create(@Req() req: any, @Body() dto: CreateContractDto) {
    const organisationId = req.user.organisationId;
    return this.contractsService.create(organisationId, dto);
  }

  @Post('from-template')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create contract from template' })
  @ApiResponse({ status: 201, description: 'Contract created from template', type: ContractResponseDto })
  async createFromTemplate(@Req() req: any, @Body() dto: CreateFromTemplateDto) {
    const organisationId = req.user.organisationId;
    return this.contractsService.createFromTemplate(organisationId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({ status: 200, description: 'Contract updated', type: ContractResponseDto })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    const organisationId = req.user.organisationId;
    return this.contractsService.update(id, organisationId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete contract' })
  @ApiResponse({ status: 204, description: 'Contract deleted' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const organisationId = req.user.organisationId;
    await this.contractsService.delete(id, organisationId);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send contract for signature' })
  @ApiResponse({ status: 200, description: 'Contract sent for signature', type: ContractResponseDto })
  async send(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SendContractDto,
  ) {
    const organisationId = req.user.organisationId;
    return this.contractsService.send(id, organisationId, dto);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download contract as PDF' })
  @ApiResponse({ status: 200, description: 'PDF generated' })
  async downloadPdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const organisationId = req.user.organisationId;
    const pdf = await this.contractsService.generatePdf(id, organisationId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=contract-${id}.pdf`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  // ============================================================================
  // PUBLIC SIGNATURE ENDPOINTS
  // ============================================================================

  @Get('public/:token')
  @ApiOperation({ summary: 'View contract by token (public)' })
  @ApiResponse({ status: 200, description: 'Contract retrieved', type: ContractResponseDto })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async viewByToken(@Param('token') token: string) {
    return this.contractsService.findByToken(token);
  }

  @Post('public/:token/sign')
  @ApiOperation({ summary: 'Sign contract (public)' })
  @ApiResponse({ status: 200, description: 'Contract signed', type: ContractResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid signature data' })
  async signContract(
    @Param('token') token: string,
    @Body() dto: SignContractDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.contractsService.sign(token, dto, ipAddress);
  }

  // ============================================================================
  // TEMPLATE ENDPOINTS
  // ============================================================================

  @Get('templates')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contract templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved', type: [TemplateResponseDto] })
  async findAllTemplates(@Req() req: any) {
    const organisationId = req.user.organisationId;
    return this.contractsService.findAllTemplates(organisationId);
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved', type: TemplateResponseDto })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findTemplate(@Param('id') id: string) {
    return this.contractsService.findTemplate(id);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create contract template' })
  @ApiResponse({ status: 201, description: 'Template created', type: TemplateResponseDto })
  async createTemplate(@Req() req: any, @Body() dto: CreateTemplateDto) {
    const organisationId = req.user.organisationId;
    return this.contractsService.createTemplate(organisationId, dto);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated', type: TemplateResponseDto })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const organisationId = req.user.organisationId;
    return this.contractsService.updateTemplate(id, organisationId, dto);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(@Req() req: any, @Param('id') id: string) {
    const organisationId = req.user.organisationId;
    await this.contractsService.deleteTemplate(id, organisationId);
  }

  @Post('templates/seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed system templates (admin only)' })
  @ApiResponse({ status: 200, description: 'System templates seeded' })
  async seedTemplates() {
    return this.contractsService.seedSystemTemplates();
  }
}
