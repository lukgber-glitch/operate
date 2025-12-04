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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConnectionHubService } from './connection-hub.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  UpdateOnboardingStepDto,
  SkipOnboardingStepDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { IntegrationStatus } from '@prisma/client';

@ApiTags('Connection Hub')
@ApiBearerAuth()
@Controller('connection-hub')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConnectionHubController {
  constructor(private connectionHubService: ConnectionHubService) {}

  // ============================================================================
  // INTEGRATION ENDPOINTS
  // ============================================================================

  @Get('integrations')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get all integrations for organisation' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['BANKING', 'EMAIL', 'ACCOUNTING', 'TAX', 'CRM', 'STORAGE', 'CALENDAR'],
  })
  @ApiQuery({ name: 'status', required: false, enum: IntegrationStatus })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async getIntegrations(
    @CurrentOrg() orgId: string,
    @Query('type') type?: string,
    @Query('status') status?: IntegrationStatus,
  ) {
    return this.connectionHubService.getIntegrations(orgId, { type, status });
  }

  @Get('integrations/providers')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get available integration providers' })
  @ApiResponse({ status: 200, description: 'List of available providers' })
  async getAvailableProviders() {
    return this.connectionHubService.getAvailableProviders();
  }

  @Get('integrations/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getIntegrationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.connectionHubService.getIntegrationById(id);
  }

  @Post('integrations')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  @ApiResponse({ status: 409, description: 'Integration already exists' })
  async createIntegration(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.connectionHubService.createIntegration(orgId, dto);
  }

  @Put('integrations/:id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async updateIntegration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.connectionHubService.updateIntegration(id, dto);
  }

  @Delete('integrations/:id')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 204, description: 'Integration deleted' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async deleteIntegration(@Param('id', ParseUUIDPipe) id: string) {
    await this.connectionHubService.deleteIntegration(id);
  }

  @Post('integrations/:id/disconnect')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Disconnect an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration disconnected' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async disconnectIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.connectionHubService.disconnectIntegration(id);
  }

  @Post('integrations/:id/reconnect')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Reconnect an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration ready to reconnect' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async reconnectIntegration(@Param('id', ParseUUIDPipe) id: string) {
    return this.connectionHubService.reconnectIntegration(id);
  }

  @Post('integrations/:id/sync')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Trigger sync for an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Sync started' })
  @ApiResponse({ status: 400, description: 'Cannot sync' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async triggerSync(@Param('id', ParseUUIDPipe) id: string) {
    return this.connectionHubService.triggerSync(id);
  }

  // ============================================================================
  // ONBOARDING ENDPOINTS
  // ============================================================================

  @Get('onboarding')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Get onboarding progress' })
  @ApiResponse({ status: 200, description: 'Onboarding progress' })
  async getOnboardingProgress(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.connectionHubService.getOnboardingProgress(orgId, userId);
  }

  @Put('onboarding/step')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update onboarding step' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  async updateOnboardingStep(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOnboardingStepDto,
  ) {
    return this.connectionHubService.updateOnboardingStep(orgId, userId, dto);
  }

  @Post('onboarding/skip')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Skip onboarding step' })
  @ApiResponse({ status: 200, description: 'Step skipped' })
  async skipOnboardingStep(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SkipOnboardingStepDto,
  ) {
    return this.connectionHubService.skipOnboardingStep(orgId, userId, dto);
  }

  @Post('onboarding/complete')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Complete onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  @ApiResponse({ status: 400, description: 'Cannot complete onboarding' })
  async completeOnboarding(@CurrentOrg() orgId: string) {
    return this.connectionHubService.completeOnboarding(orgId);
  }

  @Post('onboarding/reset')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Reset onboarding (for testing)' })
  @ApiResponse({ status: 200, description: 'Onboarding reset' })
  async resetOnboarding(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.connectionHubService.resetOnboarding(orgId, userId);
  }
}
