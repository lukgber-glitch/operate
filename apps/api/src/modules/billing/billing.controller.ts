import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  BillingService,
  PlanTier,
  BillingCycle,
  SubscriptionResponse,
  CurrentUsage,
  BillingInvoice,
  PaymentMethod,
} from './billing.service';

/**
 * Billing Controller
 * Handles subscription management, usage tracking, and billing operations
 */
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Get current subscription
   * GET /billing/subscription
   */
  @Get('subscription')
  async getSubscription(@Req() req: Request & { user: any }): Promise<SubscriptionResponse> {
    return this.billingService.getSubscription(req.user.userId);
  }

  /**
   * Get current usage statistics
   * GET /billing/usage
   */
  @Get('usage')
  async getUsage(@Req() req: Request & { user: any }): Promise<CurrentUsage> {
    return this.billingService.getUsage(req.user.userId);
  }

  /**
   * Get payment methods
   * GET /billing/payment-methods
   */
  @Get('payment-methods')
  async getPaymentMethods(@Req() req: Request & { user: any }): Promise<PaymentMethod[]> {
    return this.billingService.getPaymentMethods(req.user.userId);
  }

  /**
   * Get billing invoices
   * GET /billing/invoices
   */
  @Get('invoices')
  async getInvoices(@Req() req: Request & { user: any }): Promise<{ invoices: BillingInvoice[] }> {
    const invoices = await this.billingService.getInvoices(req.user.userId);
    return { invoices };
  }

  /**
   * Change subscription plan
   * POST /billing/subscription/change-plan
   */
  @Post('subscription/change-plan')
  async changePlan(
    @Req() req: Request & { user: any },
    @Body() body: { planTier: PlanTier; billingCycle: BillingCycle },
  ): Promise<SubscriptionResponse> {
    return this.billingService.changePlan(
      req.user.userId,
      body.planTier,
      body.billingCycle,
    );
  }

  /**
   * Cancel subscription
   * POST /billing/subscription/cancel
   */
  @Post('subscription/cancel')
  async cancelSubscription(@Req() req: Request & { user: any }): Promise<SubscriptionResponse> {
    return this.billingService.cancelSubscription(req.user.userId);
  }

  /**
   * Resume subscription
   * POST /billing/subscription/resume
   */
  @Post('subscription/resume')
  async resumeSubscription(@Req() req: Request & { user: any }): Promise<SubscriptionResponse> {
    return this.billingService.resumeSubscription(req.user.userId);
  }

  /**
   * Add payment method
   * POST /billing/payment-methods
   */
  @Post('payment-methods')
  async addPaymentMethod(
    @Req() req: Request & { user: any },
    @Body() body: { paymentMethodId: string },
  ): Promise<PaymentMethod> {
    return this.billingService.addPaymentMethod(
      req.user.userId,
      body.paymentMethodId,
    );
  }

  /**
   * Remove payment method
   * DELETE /billing/payment-methods/:id
   */
  @Delete('payment-methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePaymentMethod(
    @Req() req: Request & { user: any },
    @Param('id') paymentMethodId: string,
  ): Promise<void> {
    return this.billingService.removePaymentMethod(
      req.user.userId,
      paymentMethodId,
    );
  }

  /**
   * Set default payment method
   * POST /billing/payment-methods/:id/default
   */
  @Post('payment-methods/:id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefaultPaymentMethod(
    @Req() req: Request & { user: any },
    @Param('id') paymentMethodId: string,
  ): Promise<void> {
    return this.billingService.setDefaultPaymentMethod(
      req.user.userId,
      paymentMethodId,
    );
  }
}
