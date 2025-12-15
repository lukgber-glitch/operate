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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MileageService } from './mileage.service';
import { CreateMileageEntryDto } from './dto/create-mileage-entry.dto';
import { UpdateMileageEntryDto } from './dto/update-mileage-entry.dto';
import { MileageQueryDto } from './dto/mileage-query.dto';
import { CreateMileageRateDto } from './dto/create-mileage-rate.dto';

@ApiTags('Mileage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Get()
  @ApiOperation({ summary: 'List all mileage entries' })
  @ApiResponse({ status: 200, description: 'Returns list of mileage entries' })
  async findAll(@Req() req: any, @Query() query: MileageQueryDto) {
    const organisationId = req.user.organisationId;
    return this.mileageService.findAll(organisationId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get mileage summary statistics' })
  @ApiResponse({ status: 200, description: 'Returns summary statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const organisationId = req.user.organisationId;
    return this.mileageService.getSummary(organisationId, startDate, endDate);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get available mileage rates' })
  @ApiResponse({ status: 200, description: 'Returns available rates' })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getRates(
    @Req() req: any,
    @Query('country') country?: string,
    @Query('year') year?: number,
  ) {
    const organisationId = req.user.organisationId;
    return this.mileageService.getRates(organisationId, country, year);
  }

  @Get('tax-report')
  @ApiOperation({ summary: 'Generate tax-compliant mileage report' })
  @ApiResponse({ status: 200, description: 'Returns tax report for specified year' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getTaxReport(@Req() req: any, @Query('year') year: number) {
    const organisationId = req.user.organisationId;
    return this.mileageService.getTaxReport(organisationId, Number(year));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single mileage entry' })
  @ApiResponse({ status: 200, description: 'Returns mileage entry' })
  @ApiResponse({ status: 404, description: 'Mileage entry not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const organisationId = req.user.organisationId;
    return this.mileageService.findOne(id, organisationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new mileage entry' })
  @ApiResponse({ status: 201, description: 'Mileage entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Req() req: any, @Body() dto: CreateMileageEntryDto) {
    const organisationId = req.user.organisationId;
    const userId = req.user.sub;
    return this.mileageService.create(organisationId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mileage entry' })
  @ApiResponse({ status: 200, description: 'Mileage entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Mileage entry not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMileageEntryDto,
  ) {
    const organisationId = req.user.organisationId;
    return this.mileageService.update(id, organisationId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mileage entry' })
  @ApiResponse({ status: 200, description: 'Mileage entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mileage entry not found' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const organisationId = req.user.organisationId;
    return this.mileageService.delete(id, organisationId);
  }

  @Post('rates')
  @ApiOperation({ summary: 'Create a custom mileage rate' })
  @ApiResponse({ status: 201, description: 'Mileage rate created successfully' })
  async createRate(@Req() req: any, @Body() dto: CreateMileageRateDto) {
    const organisationId = req.user.organisationId;
    return this.mileageService.createRate(organisationId, dto);
  }
}
