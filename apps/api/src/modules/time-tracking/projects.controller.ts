import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Time Tracking - Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-tracking/projects')
export class ProjectsController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Returns all projects' })
  findAll(@Req() req: any, @Query() filters: any) {
    return this.timeTrackingService.findAllProjects(req.user.organisationId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project with time summary' })
  @ApiResponse({ status: 200, description: 'Returns the project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.findOneProject(id, req.user.organisationId);
  }

  @Get(':id/profitability')
  @ApiOperation({ summary: 'Get project profitability analysis' })
  @ApiResponse({
    status: 200,
    description: 'Returns profitability metrics',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getProfitability(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.getProjectProfitability(
      id,
      req.user.organisationId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project has been created' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    return this.timeTrackingService.createProject(
      req.user.organisationId,
      createProjectDto,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project has been updated' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.timeTrackingService.updateProject(
      id,
      req.user.organisationId,
      updateProjectDto,
    );
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiResponse({ status: 200, description: 'Project has been archived' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  archive(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.archiveProject(id, req.user.organisationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/archive a project' })
  @ApiResponse({ status: 200, description: 'Project has been deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete project with time entries',
  })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.deleteProject(id, req.user.organisationId);
  }
}
