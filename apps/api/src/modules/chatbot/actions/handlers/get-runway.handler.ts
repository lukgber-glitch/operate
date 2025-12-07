/**
 * Get Runway Action Handler
 * Handles runway analysis queries via chatbot
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
import { format } from 'date-fns';

@Injectable()
export class GetRunwayHandler extends BaseActionHandler {
  constructor(private cashFlowPredictor: CashFlowPredictorService) {
    super('GetRunwayHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_RUNWAY;
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
          'You do not have permission to view runway analysis',
          'PERMISSION_DENIED',
        );
      }

      // Get runway analysis
      const runway = await this.cashFlowPredictor.calculateRunway(
        context.organizationId,
      );

      // Format currency
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);

      // Build message
      let message = `📊 **Runway-Analyse**\n\n`;
      message += `Bei aktuellem Burn Rate von **${formatCurrency(runway.monthlyBurnRate)}/Monat**:\n\n`;

      if (runway.runwayMonths === 999 || runway.runwayMonths > 100) {
        message += `✅ **Runway:** ∞ (Profitabel)\n`;
        message += `**Status:** Gesund - Einnahmen übersteigen Ausgaben\n\n`;
      } else {
        const statusEmoji =
          runway.status === 'critical'
            ? '🔴'
            : runway.status === 'caution'
              ? '⚠️'
              : '✅';
        message += `${statusEmoji} **Runway:** ${runway.runwayMonths.toFixed(1)} Monate`;
        if (runway.runwayDate) {
          message += ` (ca. ${format(runway.runwayDate, 'MMMM yyyy')})`;
        }
        message += `\n`;

        const statusText =
          runway.status === 'critical'
            ? 'KRITISCH'
            : runway.status === 'caution'
              ? 'Vorsicht'
              : 'Gesund';
        message += `**Status:** ${statusText}\n\n`;
      }

      // Add financial details
      message += `**Finanzdetails:**\n`;
      message += `• Aktueller Kontostand: ${formatCurrency(runway.currentBalance)}\n`;
      message += `• Durchschnittliche Einnahmen: ${formatCurrency(runway.averageMonthlyIncome)}/Monat\n`;
      message += `• Durchschnittliche Ausgaben: ${formatCurrency(runway.monthlyBurnRate)}/Monat\n`;
      message += `• Netto pro Monat: ${formatCurrency(runway.netMonthlyChange)}/Monat\n\n`;

      // Add recommendations
      if (runway.recommendations.length > 0) {
        message += `**Empfehlungen:**\n`;
        runway.recommendations.forEach((rec) => {
          message += `• ${rec}\n`;
        });
      }

      this.logger.log(
        `Runway analysis generated for user ${context.userId}`,
      );

      return this.success(message, undefined, 'RunwayAnalysis', {
        currentBalance: runway.currentBalance,
        monthlyBurnRate: runway.monthlyBurnRate,
        averageMonthlyIncome: runway.averageMonthlyIncome,
        netMonthlyChange: runway.netMonthlyChange,
        runwayMonths: runway.runwayMonths,
        runwayDate: runway.runwayDate,
        status: runway.status,
        recommendations: runway.recommendations,
      });
    } catch (error) {
      this.logger.error('Failed to get runway:', error);
      return this.error(
        'Failed to generate runway analysis',
        error.message || 'Unknown error',
      );
    }
  }
}
