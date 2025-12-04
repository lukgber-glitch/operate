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
  Req,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { LogCommunicationDto, UpdateCommunicationDto, CommunicationFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients/:clientId/communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post()
  async create(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Body() logCommunicationDto: LogCommunicationDto
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.communicationsService.create(clientId, orgId, userId, logCommunicationDto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Query() filters: CommunicationFiltersDto
  ) {
    const orgId = req.user.orgId;
    return this.communicationsService.findAllByClient(clientId, orgId, filters);
  }

  @Get('recent-activity')
  async getRecentActivity(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Query('days') days?: string
  ) {
    const orgId = req.user.orgId;
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.communicationsService.getRecentActivity(clientId, orgId, daysNum);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.communicationsService.findOne(id, orgId);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateCommunicationDto: UpdateCommunicationDto
  ) {
    const orgId = req.user.orgId;
    return this.communicationsService.update(id, orgId, updateCommunicationDto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.communicationsService.remove(id, orgId);
  }
}
