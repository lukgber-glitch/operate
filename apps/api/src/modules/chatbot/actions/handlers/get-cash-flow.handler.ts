/**
 * Get Cash Flow Action Handler
 * Handles cash flow queries via chatbot
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
export class GetCashFlowHandler extends BaseActionHandler {
  constructor(private cashFlowPredictor: CashFlowPredictorService) {
    super('GetCashFlowHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_CASH_FLOW;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'days',
        type: 'number',
        required: false,
        description: 'Number of days to forecast (default: 30)',
        default: 30,
        validation: (value) => value > 0 && value <= 365,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'reports:generate')) {
        return this.error(
          'You do not have permission to view cash flow',
          'PERMISSION_DENIED',
        );
      }

      const days = params.days || 30;

      // Get cash flow forecast
      const forecast = await this.cashFlowPredictor.predictCashFlow(
        context.organizationId,
        days,
      );

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
      let message = `💰 **Aktuelle Finanzübersicht**\n\n`;
      message += `**Kontostand:** ${formatCurrency(forecast.currentBalance)}\n`;
      message += `**Burn Rate:** ${formatCurrency(runway.monthlyBurnRate)}/Monat\n`;
      message += `**Runway:** ${runway.runwayMonths === 999 ? '∞' : runway.runwayMonths.toFixed(1)} Monate\n`;
      message += `**Prognose (${days} Tage):** ${formatCurrency(forecast.projectedBalance)}\n\n`;

      // Add status indicator
      if (runway.status === 'critical') {
        message += `⚠️ **KRITISCH:** Runway ist gefährlich niedrig!\n\n`;
      } else if (runway.status === 'caution') {
        message += `⚡ **Hinweis:** Runway unter 6 Monaten. Bitte Einnahmen und Ausgaben prüfen.\n\n`;
      } else {
        message += `✅ **Status:** Finanzielle Lage stabil.\n\n`;
      }

      // Add summary
      message += `**Zusammenfassung:**\n`;
      message += `• Erwartete Einnahmen: ${formatCurrency(forecast.summary.totalInflows)}\n`;
      message += `• Erwartete Ausgaben: ${formatCurrency(forecast.summary.totalOutflows)}\n`;
      message += `• Netto-Veränderung: ${formatCurrency(forecast.summary.netChange)}\n\n`;

      // Add alerts
      if (forecast.alerts.length > 0) {
        message += `**Warnungen:**\n`;
        forecast.alerts.slice(0, 3).forEach((alert) => {
          const emoji =
            alert.severity === 'critical'
              ? '🔴'
              : alert.severity === 'warning'
                ? '⚠️'
                : 'ℹ️';
          message += `${emoji} ${alert.message}\n`;
        });
        message += '\n';
      }

      // Add lowest point warning
      if (forecast.lowestPoint.isCritical) {
        message += `**Niedrigster Punkt:**\n`;
        message += `📉 ${formatCurrency(forecast.lowestPoint.projectedBalance)} am ${format(forecast.lowestPoint.date, 'dd.MM.yyyy')}\n`;
        if (forecast.lowestPoint.riskFactors.length > 0) {
          message += `Risikofaktoren:\n`;
          forecast.lowestPoint.riskFactors.slice(0, 2).forEach((factor) => {
            message += `• ${factor}\n`;
          });
        }
        message += '\n';
      }

      // Add recommendations
      if (runway.recommendations.length > 0) {
        message += `**Empfehlungen:**\n`;
        runway.recommendations.slice(0, 3).forEach((rec) => {
          message += `• ${rec}\n`;
        });
      }

      this.logger.log(
        `Cash flow summary generated for user ${context.userId}`,
      );

      return this.success(message, undefined, 'CashFlowSummary', {
        currentBalance: forecast.currentBalance,
        projectedBalance: forecast.projectedBalance,
        burnRate: runway.monthlyBurnRate,
        runwayMonths: runway.runwayMonths,
        netChange: forecast.summary.netChange,
        status: runway.status,
        alerts: forecast.alerts,
        lowestPoint: forecast.lowestPoint,
        confidence: forecast.confidence,
      });
    } catch (error) {
      this.logger.error('Failed to get cash flow:', error);
      return this.error(
        'Failed to generate cash flow overview',
        error.message || 'Unknown error',
      );
    }
  }
}
