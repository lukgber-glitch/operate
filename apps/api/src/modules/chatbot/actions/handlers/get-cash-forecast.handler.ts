/**
 * Get Cash Forecast Action Handler
 * Handles detailed cash flow forecast queries via chatbot
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
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

@Injectable()
export class GetCashForecastHandler extends BaseActionHandler {
  constructor(private cashFlowPredictor: CashFlowPredictorService) {
    super('GetCashForecastHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_CASH_FORECAST;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'days',
        type: 'number',
        required: false,
        description: 'Number of days to forecast (default: 30, max: 90)',
        default: 30,
        validation: (value) => value > 0 && value <= 90,
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
          'You do not have permission to view cash forecast',
          'PERMISSION_DENIED',
        );
      }

      const days = Math.min(params.days || 30, 90);

      // Get cash flow forecast
      const forecast = await this.cashFlowPredictor.predictCashFlow(
        context.organizationId,
        days,
      );

      // Format currency
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);

      // Build message
      let message = `📈 **Cash Flow Prognose (${days} Tage)**\n\n`;
      message += `**Ausgangslage:**\n`;
      message += `• Aktueller Stand: ${formatCurrency(forecast.currentBalance)}\n`;
      message += `• Prognostizierter Stand: ${formatCurrency(forecast.projectedBalance)}\n`;
      message += `• Veränderung: ${formatCurrency(forecast.summary.netChange)}\n`;
      message += `• Konfidenz: ${forecast.confidence}%\n\n`;

      // Show upcoming major events
      message += `**Wichtige Events:**\n\n`;

      // Get next 7 days with significant activity
      const significantDays = forecast.dailyProjections
        .filter(
          (day) =>
            day.items.length > 0 &&
            (Math.abs(day.inflows) > 1000 || Math.abs(day.outflows) > 1000),
        )
        .slice(0, 7);

      if (significantDays.length > 0) {
        significantDays.forEach((day) => {
          const dateStr = format(day.date, 'dd.MM.yyyy (EEEE)', {
            locale: de,
          });
          message += `**${dateStr}**\n`;

          if (day.inflows > 0) {
            message += `  💰 Einnahmen: ${formatCurrency(day.inflows)}\n`;
          }
          if (day.outflows > 0) {
            message += `  💸 Ausgaben: ${formatCurrency(day.outflows)}\n`;
          }

          message += `  📊 Saldo: ${formatCurrency(day.closingBalance)}\n`;

          // Show major items
          const majorItems = day.items
            .filter((item) => item.amount > 1000)
            .slice(0, 2);
          if (majorItems.length > 0) {
            majorItems.forEach((item) => {
              message += `     • ${item.description} (${formatCurrency(item.amount)})\n`;
            });
          }
          message += `\n`;
        });
      } else {
        message += `Keine größeren Transaktionen in den nächsten ${days} Tagen erwartet.\n\n`;
      }

      // Show weekly summary
      message += `**Wöchentliche Übersicht:**\n`;
      const weeks = Math.ceil(days / 7);
      for (let i = 0; i < Math.min(weeks, 4); i++) {
        const weekStart = i * 7;
        const weekEnd = Math.min(weekStart + 7, days);
        const weekProjections = forecast.dailyProjections.slice(
          weekStart,
          weekEnd,
        );

        const weekInflows = weekProjections.reduce(
          (sum, day) => sum + day.inflows,
          0,
        );
        const weekOutflows = weekProjections.reduce(
          (sum, day) => sum + day.outflows,
          0,
        );
        const weekNet = weekInflows - weekOutflows;

        const weekLabel = `Woche ${i + 1}`;
        const netEmoji = weekNet >= 0 ? '✅' : '⚠️';
        message += `${netEmoji} **${weekLabel}:** ${formatCurrency(weekNet)} (Einnahmen: ${formatCurrency(weekInflows)}, Ausgaben: ${formatCurrency(weekOutflows)})\n`;
      }
      message += `\n`;

      // Add alerts if any
      if (forecast.alerts.length > 0) {
        message += `**⚠️ Warnungen:**\n`;
        forecast.alerts.slice(0, 3).forEach((alert) => {
          const emoji =
            alert.severity === 'critical'
              ? '🔴'
              : alert.severity === 'warning'
                ? '⚠️'
                : 'ℹ️';
          message += `${emoji} ${alert.message}\n`;
          if (alert.actionRequired) {
            message += `   → ${alert.actionRequired}\n`;
          }
        });
      }

      this.logger.log(
        `Cash forecast (${days} days) generated for user ${context.userId}`,
      );

      return this.success(message, undefined, 'CashForecast', {
        days,
        currentBalance: forecast.currentBalance,
        projectedBalance: forecast.projectedBalance,
        netChange: forecast.summary.netChange,
        confidence: forecast.confidence,
        totalInflows: forecast.summary.totalInflows,
        totalOutflows: forecast.summary.totalOutflows,
        significantDays: significantDays.map((day) => ({
          date: day.date,
          inflows: day.inflows,
          outflows: day.outflows,
          closingBalance: day.closingBalance,
          items: day.items.slice(0, 3),
        })),
        alerts: forecast.alerts,
        lowestPoint: forecast.lowestPoint,
      });
    } catch (error) {
      this.logger.error('Failed to get cash forecast:', error);
      return this.error(
        'Failed to generate cash flow forecast',
        error.message || 'Unknown error',
      );
    }
  }
}
