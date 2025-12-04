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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, ClientFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(@Req() req: any, @Body() createClientDto: CreateClientDto) {
    const orgId = req.user.orgId;
    return this.clientsService.create(orgId, createClientDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() filters: ClientFiltersDto) {
    const orgId = req.user.orgId;
    return this.clientsService.findAll(orgId, filters);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const orgId = req.user.orgId;
    return this.clientsService.getStats(orgId);
  }

  @Get('top-revenue')
  async getTopByRevenue(@Req() req: any, @Query('limit') limit?: string) {
    const orgId = req.user.orgId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.clientsService.getTopByRevenue(orgId, limitNum);
  }

  @Get('requiring-attention')
  async getRequiringAttention(@Req() req: any) {
    const orgId = req.user.orgId;
    return this.clientsService.getRequiringAttention(orgId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.clientsService.findOne(id, orgId);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto
  ) {
    const orgId = req.user.orgId;
    return this.clientsService.update(id, orgId, updateClientDto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.clientsService.remove(id, orgId);
  }

  @Post(':id/update-metrics')
  async updateMetrics(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.clientsService.updateMetrics(id, orgId);
  }

  @Post(':id/assess-risk')
  async assessRisk(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.clientsService.assessRisk(id, orgId);
  }
}
