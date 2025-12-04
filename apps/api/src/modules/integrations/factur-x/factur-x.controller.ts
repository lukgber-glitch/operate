import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FacturXService } from './factur-x.service';
import {
  GenerateFacturXDto,
  SendFacturXDto,
  ParseFacturXDto,
  ValidateFacturXDto,
} from './dto';
import {
  FacturXInvoiceData,
  FacturXProfile,
  FacturXValidationResult,
  FacturXParseResult,
  FacturXTransmissionResult,
} from './types/factur-x.types';

/**
 * Factur-X Controller
 *
 * REST API endpoints for French electronic invoicing (Factur-X).
 */
@ApiTags('Factur-X (France)')
@Controller('integrations/factur-x')
export class FacturXController {
  private readonly logger = new Logger(FacturXController.name);

  constructor(private readonly facturXService: FacturXService) {}

  /**
   * Generate Factur-X invoice (PDF/A-3 with embedded XML)
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Factur-X invoice',
    description:
      'Generate a Factur-X compliant invoice in PDF/A-3 format with embedded XML',
  })
  @ApiResponse({
    status: 200,
    description: 'Factur-X PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid invoice data' })
  async generateFacturX(
    @Body() dto: GenerateFacturXDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Generating Factur-X invoice ${dto.number}`);

      // Convert DTO to invoice data
      const invoice = this.dtoToInvoiceData(dto);

      // Generate PDF
      const pdfBuffer = await this.facturXService.generateFacturXInvoice(
        invoice,
        {
          profile: dto.profile || FacturXProfile.EN16931,
          validateSIRET: dto.validateSIRET,
          validateTVA: dto.validateTVA,
        },
      );

      // Send as PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="factur-x-${dto.number}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(
        `Failed to generate Factur-X: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate Factur-X XML only
   */
  @Post('generate-xml')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Factur-X XML',
    description: 'Generate only the XML part without PDF',
  })
  @ApiResponse({
    status: 200,
    description: 'XML generated successfully',
    content: {
      'application/xml': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async generateXml(
    @Body() dto: GenerateFacturXDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Generating Factur-X XML for invoice ${dto.number}`);

      const invoice = this.dtoToInvoiceData(dto);
      const xml = await this.facturXService.generateXmlOnly(
        invoice,
        dto.profile || FacturXProfile.EN16931,
      );

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="factur-x-${dto.number}.xml"`,
      );
      res.send(xml);
    } catch (error) {
      this.logger.error(`Failed to generate XML: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate invoice data
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Factur-X invoice data',
    description: 'Validate invoice data against EN 16931 and French regulations',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: Object,
  })
  async validateInvoice(
    @Body() dto: GenerateFacturXDto,
  ): Promise<FacturXValidationResult> {
    try {
      this.logger.log(`Validating invoice ${dto.number}`);

      const invoice = this.dtoToInvoiceData(dto);
      return await this.facturXService.validateInvoice(invoice);
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse Factur-X PDF
   */
  @Post('parse-pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Parse Factur-X PDF',
    description: 'Extract and parse invoice data from Factur-X PDF',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF parsed successfully',
    type: Object,
  })
  async parsePdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() options?: ParseFacturXDto,
  ): Promise<FacturXParseResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`Parsing Factur-X PDF (${file.size} bytes)`);

      return await this.facturXService.parseFacturXPdf(file.buffer);
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse Factur-X XML
   */
  @Post('parse-xml')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse Factur-X XML',
    description: 'Parse Factur-X XML to invoice data',
  })
  @ApiResponse({
    status: 200,
    description: 'XML parsed successfully',
    type: Object,
  })
  async parseXml(@Body('xml') xml: string): Promise<FacturXParseResult> {
    try {
      if (!xml) {
        throw new BadRequestException('No XML provided');
      }

      this.logger.log('Parsing Factur-X XML');

      return await this.facturXService.parseFacturXXml(xml);
    } catch (error) {
      this.logger.error(`Failed to parse XML: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate Factur-X PDF
   */
  @Post('validate-pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validate Factur-X PDF',
    description: 'Validate PDF/A-3 compliance and embedded XML',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: Object,
  })
  async validatePdf(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FacturXValidationResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`Validating Factur-X PDF (${file.size} bytes)`);

      return await this.facturXService.validateFacturXPdf(file.buffer);
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send Factur-X via Peppol
   */
  @Post('send-peppol')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Factur-X via Peppol',
    description:
      'Generate Factur-X invoice and send it via Peppol network',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice sent successfully',
    type: Object,
  })
  async sendViaPeppol(
    @Body() dto: SendFacturXDto,
  ): Promise<FacturXTransmissionResult> {
    try {
      this.logger.log(
        `Sending Factur-X invoice ${dto.invoice.number} via Peppol`,
      );

      const invoice = this.dtoToInvoiceData(dto.invoice);

      return await this.facturXService.sendViaPeppol(invoice, {
        sendViaPeppol: dto.peppolOptions.sendViaPeppol,
        recipientParticipantId: dto.peppolOptions.recipientParticipantId,
        recipientScheme: dto.peppolOptions.recipientScheme || '0002',
        attachOriginalPdf: dto.peppolOptions.attachOriginalPdf,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send via Peppol: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Health check
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if Factur-X service is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async health(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Convert DTO to FacturXInvoiceData
   */
  private dtoToInvoiceData(dto: GenerateFacturXDto): FacturXInvoiceData {
    return {
      number: dto.number,
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      type: dto.type,
      currency: dto.currency,
      seller: dto.seller,
      buyer: dto.buyer,
      items: dto.items,
      vatBreakdown: dto.vatBreakdown,
      subtotal: dto.subtotal,
      totalVAT: dto.totalVAT,
      totalAmount: dto.totalAmount,
      paymentTerms: dto.paymentTerms,
      paymentMeans: dto.paymentMeans,
      bankAccount: dto.bankAccount,
      legalMentions: dto.legalMentions,
      purchaseOrderReference: dto.purchaseOrderReference,
      contractReference: dto.contractReference,
      customerReference: dto.customerReference,
      notes: dto.notes,
    };
  }
}
