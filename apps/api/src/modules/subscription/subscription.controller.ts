import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionManagerService } from './services/subscription-manager.service';
import {
  StartTrialDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionResponseDto,
  UsageStatsDto,
  PortalSessionResponseDto,
} from './dto/subscription.dto';

/**
 * Subscription Controller
 * Manages organization subscription lifecycle and billing
 */
@ApiTags('Subscription')
@Controller('subscription')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when auth is set up
export class SubscriptionController {
  constructor(
    private readonly subscriptionManager: SubscriptionManagerService,
  ) {}

  /**
   * Get current subscription status
   */
  @Get(':orgId')
  @ApiOperation({
    summary: 'Get current subscription',
    description: 'Retrieve current subscription status and usage for an organization',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details',
    type: SubscriptionResponseDto,
  })
  async getSubscription(
    @Param('orgId') orgId: string,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionManager.getSubscription(orgId);
  }

  /**
   * Start trial subscription
   */
  @Post('start-trial')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start trial subscription',
    description: 'Start a 14-day trial for PRO tier',
  })
  @ApiResponse({
    status: 201,
    description: 'Trial started successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Organization already has a subscription',
  })
  async startTrial(
    @Body() dto: StartTrialDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionManager.startTrial(dto);
  }

  /**
   * Upgrade subscription tier
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade subscription',
    description: 'Upgrade to a higher subscription tier (Free -> Pro -> Enterprise)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid upgrade path',
  })
  async upgradeSubscription(
    @Body() dto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionManager.upgradeSubscription(dto);
  }

  /**
   * Downgrade subscription tier
   */
  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Downgrade subscription',
    description: 'Downgrade to a lower subscription tier. Changes apply at period end by default.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription downgraded successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid downgrade path',
  })
  async downgradeSubscription(
    @Body() dto: DowngradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionManager.downgradeSubscription(dto);
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancel subscription. By default, cancellation takes effect at period end.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No active subscription to cancel',
  })
  async cancelSubscription(
    @Body() dto: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionManager.cancelSubscription(dto);
  }

  /**
   * Get usage statistics
   */
  @Get(':orgId/usage')
  @ApiOperation({
    summary: 'Get usage statistics',
    description: 'Retrieve current usage stats (invoices, users) for the billing period',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics',
    type: UsageStatsDto,
  })
  async getUsageStats(@Param('orgId') orgId: string): Promise<UsageStatsDto> {
    return this.subscriptionManager.getUsageStats(orgId);
  }

  /**
   * Get customer portal session URL
   */
  @Post(':orgId/portal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get customer portal URL',
    description: 'Generate a Stripe customer portal session URL for managing subscription',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiQuery({
    name: 'returnUrl',
    description: 'URL to redirect to after portal session',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Portal session URL',
    type: PortalSessionResponseDto,
  })
  async getPortalSession(
    @Param('orgId') orgId: string,
    @Query('returnUrl') returnUrl: string,
  ): Promise<PortalSessionResponseDto> {
    return this.subscriptionManager.getPortalSession(orgId, returnUrl);
  }
}
