import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Header,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AustriaTaxService } from './austria-tax.service';
import { SubmitUvaDto, VerifyUidDto } from './dto';

@ApiTags('Tax - Austria FinanzOnline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tax/finanz-online')
export class AustriaTaxController {
  constructor(private austriaTaxService: AustriaTaxService) {}

  @Get('preview')
  @ApiOperation({ summary: 'Get UVA preview with calculated data from invoices/expenses' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'period', required: true, description: 'Format: YYYY-MM, YYYY-QN, or YYYY' })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  async getUvaPreview(
    @Query('organizationId') organizationId: string,
    @Query('period') period: string,
  ) {
    return this.austriaTaxService.generateUvaPreview(organizationId, period);
  }

  @Get('verify-uid')
  @ApiOperation({ summary: 'Verify Austrian UID using EU VIES system' })
  @ApiQuery({ name: 'uid', required: true, description: 'Austrian UID (ATU12345678)' })
  @ApiResponse({ status: 200, description: 'UID verification result' })
  async verifyUid(@Query('uid') uid: string) {
    return this.austriaTaxService.verifyUid(uid);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit UVA to FinanzOnline' })
  @ApiResponse({ status: 200, description: 'Submission result' })
  async submitUva(@Body() dto: SubmitUvaDto) {
    return this.austriaTaxService.submitUva(dto);
  }

  @Get(':submissionId/status')
  @ApiOperation({ summary: 'Get UVA submission status' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({ status: 200, description: 'Submission status' })
  async getSubmissionStatus(
    @Param('submissionId') submissionId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.austriaTaxService.getSubmissionStatus(organizationId, submissionId);
  }

  @Get('receipt/:submissionId')
  @ApiOperation({ summary: 'Download submission receipt as PDF' })
  @ApiResponse({ status: 200, description: 'PDF receipt', type: StreamableFile })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="finanzonline-receipt.pdf"')
  async downloadReceipt(@Param('submissionId') submissionId: string) {
    const buffer = await this.austriaTaxService.generateReceipt(submissionId);
    return new StreamableFile(buffer);
  }
}
