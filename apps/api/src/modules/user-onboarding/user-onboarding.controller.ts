import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserOnboardingService } from './user-onboarding.service';
import {
  OnboardingProgressDto,
  CompleteStepDto,
  SkipStepDto,
  GoToStepDto,
} from './dto';
import { ONBOARDING_STEPS } from './user-onboarding.constants';

/**
 * User Onboarding Controller
 * Manages individual user onboarding progress
 */
@ApiTags('User Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class UserOnboardingController {
  constructor(private readonly onboardingService: UserOnboardingService) {}

  /**
   * Get current user's onboarding progress
   */
  @Get('progress')
  @ApiOperation({
    summary: "Get user's onboarding progress",
    description: 'Retrieves the current onboarding progress for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding progress retrieved successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async getProgress(@Req() req: any): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.getProgress(userId);
  }

  /**
   * Start onboarding for the current user
   */
  @Post('start')
  @ApiOperation({
    summary: 'Start onboarding',
    description: 'Initializes onboarding for a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding started successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startOnboarding(@Req() req: any): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.startOnboarding(userId);
  }

  /**
   * Complete a specific onboarding step
   */
  @Post('step/:stepId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete an onboarding step',
    description: 'Marks a specific step as completed and optionally stores step data',
  })
  @ApiParam({
    name: 'stepId',
    description: 'Step ID to complete',
    enum: Object.values(ONBOARDING_STEPS),
    example: 'profile',
  })
  @ApiBody({
    description: 'Optional step data',
    required: false,
    schema: {
      type: 'object',
      properties: {
        stepData: {
          type: 'object',
          example: { firstName: 'John', lastName: 'Doe' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Step completed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid step ID or onboarding already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async completeStep(
    @Req() req: any,
    @Param('stepId') stepId: string,
    @Body() body?: { stepData?: Record<string, any> },
  ): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.completeStep(userId, stepId, body?.stepData);
  }

  /**
   * Skip a specific onboarding step
   */
  @Post('step/:stepId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Skip an onboarding step',
    description: 'Marks a non-required step as skipped',
  })
  @ApiParam({
    name: 'stepId',
    description: 'Step ID to skip',
    enum: Object.values(ONBOARDING_STEPS),
    example: 'team',
  })
  @ApiResponse({
    status: 200,
    description: 'Step skipped successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid step ID, required step, or onboarding already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async skipStep(
    @Req() req: any,
    @Param('stepId') stepId: string,
  ): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.skipStep(userId, stepId);
  }

  /**
   * Navigate to a specific step
   */
  @Post('step/:stepId/goto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Navigate to a specific step',
    description: 'Sets the current step without marking it complete',
  })
  @ApiParam({
    name: 'stepId',
    description: 'Step ID to navigate to',
    enum: Object.values(ONBOARDING_STEPS),
    example: 'preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Navigated successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid step ID or onboarding already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async goToStep(
    @Req() req: any,
    @Param('stepId') stepId: string,
  ): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.goToStep(userId, stepId);
  }

  /**
   * Complete entire onboarding
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding',
    description: 'Finalizes the onboarding process (requires all required steps to be completed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Missing required steps or already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async completeOnboarding(@Req() req: any): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.completeOnboarding(userId);
  }

  /**
   * Reset onboarding (admin only)
   */
  @Post('reset')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset onboarding (Admin only)',
    description: 'Resets a user onboarding progress to start over',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding reset successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Onboarding progress not found' })
  async resetOnboarding(@Req() req: any): Promise<OnboardingProgressDto> {
    const userId = req.user.userId;
    return this.onboardingService.resetOnboarding(userId);
  }

  /**
   * Check if onboarding is complete
   */
  @Get('status')
  @ApiOperation({
    summary: 'Check onboarding completion status',
    description: 'Returns whether the user has completed onboarding',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isComplete: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Req() req: any): Promise<{ isComplete: boolean }> {
    const userId = req.user.userId;
    const isComplete = await this.onboardingService.isOnboardingComplete(userId);
    return { isComplete };
  }
}
