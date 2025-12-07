import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { VatReturnService } from './vat-return.service';
import { VatReturnPreviewService } from './vat-return-preview.service';
import { CreateVatReturnDto } from './dto/create-vat-return.dto';
import { ApproveVatReturnDto } from './dto/approve-vat-return.dto';
import { SubmitVatReturnDto } from './dto/submit-vat-return.dto';
import { RejectVatReturnDto } from './dto/reject-vat-return.dto';

@ApiTags('Tax - VAT Return')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tax/vat-return')
export class VatReturnController {
  constructor(
    private vatReturnService: VatReturnService,
    private previewService: VatReturnPreviewService,
  ) {}

  @Get('preview')
  @ApiOperation({ summary: 'Generate VAT return preview without saving' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'period', required: true, description: 'Format: YYYY-QN, YYYY-MM, or YYYY' })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  async getPreview(
    @Query('organizationId') organizationId: string,
    @Query('period') period: string,
  ) {
    return this.previewService.generatePreview(organizationId, period);
  }

  @Post()
  @ApiOperation({ summary: 'Create VAT return draft from preview' })
  @ApiResponse({ status: 201, description: 'VAT return draft created successfully' })
  @ApiResponse({ status: 409, description: 'VAT return for this period already exists' })
  async createDraft(@Body() dto: CreateVatReturnDto) {
    return this.vatReturnService.createDraft(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get VAT return history' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getHistory(
    @Query('organizationId') organizationId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.vatReturnService.getHistory(organizationId, yearNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get VAT return by ID' })
  @ApiResponse({ status: 200, description: 'VAT return retrieved successfully' })
  @ApiResponse({ status: 404, description: 'VAT return not found' })
  async getById(@Param('id') id: string) {
    return this.vatReturnService.getById(id);
  }

  @Get('period/:organizationId/:period')
  @ApiOperation({ summary: 'Get VAT return by organization and period' })
  @ApiResponse({ status: 200, description: 'VAT return retrieved successfully' })
  @ApiResponse({ status: 404, description: 'VAT return not found' })
  async getByPeriod(
    @Param('organizationId') organizationId: string,
    @Param('period') period: string,
  ) {
    return this.vatReturnService.getByPeriod(organizationId, period);
  }

  @Post(':id/submit-for-approval')
  @ApiOperation({ summary: 'Submit VAT return for approval' })
  @ApiResponse({ status: 200, description: 'Submitted for approval successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async submitForApproval(@Param('id') id: string) {
    return this.vatReturnService.submitForApproval(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve VAT return' })
  @ApiResponse({ status: 200, description: 'Approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async approve(@Param('id') id: string, @Body() dto: ApproveVatReturnDto) {
    return this.vatReturnService.approve(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Mark VAT return as submitted to ELSTER' })
  @ApiResponse({ status: 200, description: 'Marked as submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async markSubmitted(@Param('id') id: string, @Body() dto: SubmitVatReturnDto) {
    return this.vatReturnService.markSubmitted(id, dto);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark VAT return as accepted by ELSTER' })
  @ApiResponse({ status: 200, description: 'Marked as accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async markAccepted(@Param('id') id: string) {
    return this.vatReturnService.markAccepted(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark VAT return as rejected by ELSTER' })
  @ApiResponse({ status: 200, description: 'Marked as rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async markRejected(@Param('id') id: string, @Body() dto: RejectVatReturnDto) {
    return this.vatReturnService.markRejected(id, dto.reason, dto.errorCode);
  }

  @Put(':id/preview')
  @ApiOperation({ summary: 'Update preview data for existing VAT return' })
  @ApiResponse({ status: 200, description: 'Preview updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update preview in current status' })
  async updatePreview(@Param('id') id: string) {
    return this.vatReturnService.updatePreview(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete VAT return (only DRAFT or REJECTED)' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete in current status' })
  async delete(@Param('id') id: string) {
    await this.vatReturnService.delete(id);
  }
}
