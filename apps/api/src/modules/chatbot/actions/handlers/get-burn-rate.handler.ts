/**
 * Get Burn Rate Action Handler
 * Handles burn rate queries via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { CashFlowPredictorService } from '../../../ai/bank-intelligence/cash-flow-predictor.service';

@Injectable()
export class GetBurnRateHandler extends BaseActionHandler {
  constructor(private cashFlowPredictor: CashFlowPredictorService) {
    super('GetBurnRateHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_BURN_RATE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'reports:generate')) {
        return this.error(
          'You do not have permission to view burn rate',
          'PERMISSION_DENIED',
        );
      }

      // Get runway analysis (includes burn rate)
      const runway = await this.cashFlowPredictor.calculateRunway(
        context.organizationId,
      );

      // Format currency
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);

      // Calculate daily burn rate
      const dailyBurnRate = runway.monthlyBurnRate / 30;

      // Build message
      let message = `🔥 **Burn Rate Analyse**\n\n`;
      message += `**Monatliche Burn Rate:** ${formatCurrency(runway.monthlyBurnRate)}\n`;
      message += `**Tägliche Burn Rate:** ${formatCurrency(dailyBurnRate)}\n\n`;

      message += `**Details:**\n`;
      message += `• Durchschnittliche Einnahmen: ${formatCurrency(runway.averageMonthlyIncome)}/Monat\n`;
      message += `• Durchschnittliche Ausgaben: ${formatCurrency(runway.monthlyBurnRate)}/Monat\n`;
      message += `• Netto pro Monat: ${formatCurrency(runway.netMonthlyChange)}/Monat\n\n`;

      // Add context
      if (runway.netMonthlyChange < 0) {
        const burnPercentage = Math.abs(
          (runway.monthlyBurnRate / runway.currentBalance) * 100,
        );
        message += `📉 Sie verbrennen derzeit ${burnPercentage.toFixed(1)}% Ihres Guthabens pro Monat.\n\n`;

        if (runway.runwayMonths < 3) {
          message += `⚠️ **WARNUNG:** Bei dieser Rate haben Sie nur noch ${runway.runwayMonths.toFixed(1)} Monate Runway.\n\n`;
        }
      } else {
        message += `✅ Ihre Einnahmen übersteigen die Ausgaben. Sie sind profitabel!\n\n`;
      }

      // Add actionable insights
      message += `**Wie Sie Burn Rate reduzieren können:**\n`;
      message += `• Überprüfen Sie wiederkehrende Ausgaben\n`;
      message += `• Verhandeln Sie bessere Konditionen mit Lieferanten\n`;
      message += `• Identifizieren Sie unnötige Abonnements\n`;
      message += `• Optimieren Sie Betriebskosten\n`;

      this.logger.log(
        `Burn rate analysis generated for user ${context.userId}`,
      );

      return this.success(message, undefined, 'BurnRateAnalysis', {
        monthlyBurnRate: runway.monthlyBurnRate,
        dailyBurnRate,
        averageMonthlyIncome: runway.averageMonthlyIncome,
        netMonthlyChange: runway.netMonthlyChange,
        currentBalance: runway.currentBalance,
        burnPercentage:
          Math.abs((runway.monthlyBurnRate / runway.currentBalance) * 100),
        isProfitable: runway.netMonthlyChange >= 0,
      });
    } catch (error) {
      this.logger.error('Failed to get burn rate:', error);
      return this.error(
        'Failed to generate burn rate analysis',
        error.message || 'Unknown error',
      );
    }
  }
}
