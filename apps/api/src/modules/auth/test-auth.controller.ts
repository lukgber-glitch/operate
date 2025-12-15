import {
  Controller,
  Get,
  Post,
  ForbiddenException,
  Logger,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';

/**
 * Test Authentication Controller
 *
 * ONLY AVAILABLE IN DEVELOPMENT/TEST MODE
 * Provides automated testing endpoints to bypass login forms
 *
 * Security: Disabled in production via environment check
 */
@ApiTags('Test Authentication')
@Controller('test')
export class TestAuthController {
  private readonly logger = new Logger(TestAuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get test authentication tokens
   * Returns valid JWT tokens for the test user without requiring login form
   *
   * Usage: curl http://localhost:3001/api/v1/test/auth
   *
   * @throws ForbiddenException if NODE_ENV is 'production'
   */
  @Public()
  @Get('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get test authentication tokens',
    description:
      'Returns valid access and refresh tokens for automated testing. Only available in development/test mode.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Test auth not available in production',
  })
  async getTestAuth(@Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    // SECURITY: Block in production
    const nodeEnv = this.configService.get<string>('nodeEnv') || 'development';
    if (nodeEnv === 'production') {
      this.logger.warn('Test auth endpoint accessed in production - BLOCKED');
      throw new ForbiddenException('Test authentication is not available in production');
    }

    this.logger.log('Test auth endpoint accessed - generating tokens for test user');

    try {
      // Find test user by email
      const testEmail = 'luk.gber@gmail.com';
      const user = await this.usersService.findByEmailWithPassword(testEmail);

      if (!user) {
        // If test user doesn't exist, we can't proceed
        throw new Error(`Test user not found: ${testEmail}`);
      }

      // Generate valid tokens using the existing login flow
      // This ensures the same token structure and session management
      const result = await this.authService.login(user);

      // Set tokens as HTTP-only cookies (same as normal login)
      if (result.accessToken && result.refreshToken) {
        this.authService.setAuthCookies(res, result.accessToken, result.refreshToken);

        // Check and set onboarding cookie if completed
        await this.authService.checkAndSetOnboardingCookie(user, res);
      }

      this.logger.log(`Test auth tokens generated for user: ${user.id}`);

      return result;
    } catch (error) {
      this.logger.error('Failed to generate test auth tokens', error.message);
      throw error;
    }
  }

  /**
   * POST variant of test auth (for compatibility with different testing tools)
   */
  @Public()
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get test authentication tokens (POST)',
    description:
      'POST variant of test auth endpoint. Returns valid access and refresh tokens for automated testing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Test auth not available in production',
  })
  async postTestAuth(@Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    // Delegate to GET handler
    return this.getTestAuth(res);
  }

  /**
   * Complete onboarding for test user
   * Marks the test user's organization onboarding as complete
   *
   * Usage: curl -X POST http://localhost:3001/api/v1/test/complete-onboarding
   *
   * @throws ForbiddenException if NODE_ENV is 'production'
   * @throws NotFoundException if test user or organization not found
   */
  @Public()
  @Post('complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding for test user',
    description:
      'Marks the test user organization onboarding as complete. Only available in development/test mode.',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding marked as complete',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Onboarding marked as complete' },
        orgId: { type: 'string', example: 'org_123456' },
        userId: { type: 'string', example: 'user_123456' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Test endpoints not available in production',
  })
  @ApiResponse({
    status: 404,
    description: 'Test user or organization not found',
  })
  async completeOnboarding(@Res({ passthrough: true }) res: Response): Promise<{
    success: boolean;
    message: string;
    orgId: string;
    userId: string;
  }> {
    // SECURITY: Block in production
    const nodeEnv = this.configService.get<string>('nodeEnv') || 'development';
    if (nodeEnv === 'production') {
      this.logger.warn('Test complete-onboarding endpoint accessed in production - BLOCKED');
      throw new ForbiddenException('Test endpoints are not available in production');
    }

    this.logger.log('Test complete-onboarding endpoint accessed');

    try {
      // Find test user
      const testEmail = 'luk.gber@gmail.com';
      const user = await this.usersService.findByEmailWithPassword(testEmail);

      if (!user) {
        throw new NotFoundException(`Test user not found: ${testEmail}`);
      }

      // Find user's organization
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.id,
          acceptedAt: { not: null },
        },
        include: {
          organisation: true,
        },
      });

      if (!membership) {
        throw new NotFoundException(`No organization membership found for user: ${testEmail}`);
      }

      const orgId = membership.organisation.id;

      // Check if OnboardingProgress exists for this org
      let onboardingProgress = await this.prisma.onboardingProgress.findUnique({
        where: { orgId },
      });

      if (!onboardingProgress) {
        // Create onboarding progress if it doesn't exist
        this.logger.log(`Creating onboarding progress for org: ${orgId}`);
        onboardingProgress = await this.prisma.onboardingProgress.create({
          data: {
            orgId,
            userId: user.id,
            currentStep: 6, // Last step
            totalSteps: 6,
            isCompleted: true,
            completedAt: new Date(),
            companyInfoStatus: 'COMPLETED',
            bankingStatus: 'SKIPPED',
            emailStatus: 'SKIPPED',
            taxStatus: 'SKIPPED',
            accountingStatus: 'SKIPPED',
            preferencesStatus: 'COMPLETED',
          },
        });
      } else if (!onboardingProgress.isCompleted) {
        // Mark existing progress as complete
        this.logger.log(`Marking onboarding complete for org: ${orgId}`);
        onboardingProgress = await this.prisma.onboardingProgress.update({
          where: { orgId },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            currentStep: 6,
          },
        });
      } else {
        this.logger.log(`Onboarding already complete for org: ${orgId}`);
      }

      // Set the onboarding_complete cookie
      res.cookie('onboarding_complete', 'true', {
        httpOnly: true,
        secure: nodeEnv === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      this.logger.log(
        `Onboarding completed successfully for user ${user.id}, org ${orgId}`,
      );

      return {
        success: true,
        message: 'Onboarding marked as complete',
        orgId,
        userId: user.id,
      };
    } catch (error) {
      this.logger.error('Failed to complete onboarding', error.message);
      throw error;
    }
  }
}
