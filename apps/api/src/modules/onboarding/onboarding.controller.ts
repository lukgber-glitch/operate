import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { FirstAnalysisService } from './first-analysis.service';
import { AuthService } from '../auth/auth.service';
import {
  CompleteStepDto,
  OnboardingProgressDto,
  AnalysisStatusDto,
  AnalysisResultsDto,
} from './dto';

/**
 * Onboarding Controller
 * Manages organization onboarding flow
 */
@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly firstAnalysisService: FirstAnalysisService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get current onboarding progress for user's organization
   */
  @Get('progress')
  @ApiOperation({ summary: 'Get onboarding progress' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding progress retrieved successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgress(@Req() req: any): Promise<OnboardingProgressDto> {
    const { orgId, userId } = req.user;
    return this.onboardingService.getProgress(orgId, userId);
  }

  /**
   * Complete a specific onboarding step
   */
  @Post('step/:step')
  @ApiOperation({ summary: 'Complete an onboarding step' })
  @ApiParam({
    name: 'step',
    description: 'Step name to complete',
    enum: [
      'company_info',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Step completed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid step name' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  @ApiResponse({ status: 409, description: 'Onboarding already completed' })
  async completeStep(
    @Req() req: any,
    @Param('step') step: string,
    @Body() body?: CompleteStepDto,
  ): Promise<OnboardingProgressDto> {
    const { orgId } = req.user;
    return this.onboardingService.completeStep(orgId, step, body?.data);
  }

  /**
   * Skip a specific onboarding step
   */
  @Post('skip/:step')
  @ApiOperation({ summary: 'Skip an onboarding step' })
  @ApiParam({
    name: 'step',
    description: 'Step name to skip',
    enum: [
      'company_info',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Step skipped successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid step name' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  @ApiResponse({ status: 409, description: 'Onboarding already completed' })
  async skipStep(
    @Req() req: any,
    @Param('step') step: string,
  ): Promise<OnboardingProgressDto> {
    const { orgId } = req.user;
    return this.onboardingService.skipStep(orgId, step);
  }

  /**
   * Mark onboarding as complete
   */
  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  @ApiResponse({ status: 409, description: 'Onboarding already completed' })
  async completeOnboarding(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OnboardingProgressDto> {
    const { orgId, userId } = req.user;
    const result = await this.onboardingService.completeOnboarding(orgId, userId);

    // Set onboarding_complete cookie so middleware allows access to protected routes
    this.authService.setOnboardingCompleteCookie(res);

    return result;
  }

  /**
   * Get onboarding completion status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status summary' })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isCompleted: { type: 'boolean' },
        completionPercentage: { type: 'number' },
        completedSteps: { type: 'number' },
        totalSteps: { type: 'number' },
        currentStep: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Req() req: any): Promise<{
    isCompleted: boolean;
    completionPercentage: number;
    completedSteps: number;
    totalSteps: number;
    currentStep: number;
  }> {
    const { orgId } = req.user;
    return this.onboardingService.getStatus(orgId);
  }

  /**
   * Trigger first AI analysis after onboarding
   */
  @Post('trigger-analysis')
  @ApiOperation({
    summary: 'Trigger first AI analysis',
    description:
      'Starts the initial AI analysis of connected bank transactions and emails. ' +
      'This runs asynchronously and provides immediate value to users.',
  })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Force re-run even if analysis already completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis triggered successfully',
    schema: {
      type: 'object',
      properties: {
        analysisId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async triggerAnalysis(
    @Req() req: any,
    @Query('force') force?: boolean,
  ): Promise<{ analysisId: string; message: string }> {
    const { userId, orgId } = req.user;
    return this.firstAnalysisService.triggerAnalysis(userId, orgId, force || false);
  }

  /**
   * Get analysis status
   */
  @Get('analysis-status')
  @ApiOperation({
    summary: 'Get analysis status',
    description: 'Check the progress and status of the first AI analysis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis status retrieved successfully',
    type: AnalysisStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No analysis found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No analysis found for this user' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalysisStatus(@Req() req: any): Promise<AnalysisStatusDto | { message: string }> {
    const { userId } = req.user;
    const status = await this.firstAnalysisService.getAnalysisStatus(userId);

    if (!status) {
      return { message: 'No analysis found for this user' };
    }

    return status;
  }

  /**
   * Get analysis results
   */
  @Get('analysis-results')
  @ApiOperation({
    summary: 'Get analysis results',
    description:
      'Get the completed analysis results including bank transaction insights, ' +
      'email invoice analysis, and AI-generated suggestions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis results retrieved successfully',
    type: AnalysisResultsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No completed analysis found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No completed analysis found' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalysisResults(
    @Req() req: any,
  ): Promise<AnalysisResultsDto | { message: string }> {
    const { userId } = req.user;
    const results = await this.firstAnalysisService.getAnalysisResults(userId);

    if (!results) {
      return { message: 'No completed analysis found' };
    }

    return results;
  }
}
