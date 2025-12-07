/**
 * Chat Scenario Extension
 * Adds "what-if" scenario planning capabilities to the chat service
 */

import { Injectable, Logger } from '@nestjs/common';
import { ScenarioPlanningService, Scenario, ScenarioResult } from '../reports/scenario/scenario-planning.service';

/**
 * Pattern matching for scenario questions in German and English
 */
const SCENARIO_PATTERNS = [
  // Hiring scenarios
  /was.*wenn.*(?:ich|wir).*(\d+).*(?:entwickler|mitarbeiter|person|leute).*(?:einstell|anstell|einzustell).*?(?:für|mit|zu|je|pro)?.*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i,
  /what.*if.*(?:i|we).*hire.*(\d+).*(?:developer|employee|person|people).*?(?:at|for)?.*?(\d+(?:[.,]\d+)?)/i,

  // Salary scenarios
  /was.*wenn.*gehalt.*(?:um)?.*?(\d+)\s*(?:%|prozent)?/i,
  /what.*if.*salary.*(\d+)\s*(?:%|percent)?/i,

  // Customer loss scenarios
  /was.*wenn.*(?:ich|wir).*(?:kunde|kunden|customer).*(?:verlier|verloren)/i,
  /what.*if.*lose.*customer/i,

  // Revenue change scenarios
  /was.*wenn.*umsatz.*(?:um)?.*?(\d+)\s*(?:%|prozent)?.*(?:steig|wächst|erhöh|mehr)/i,
  /was.*wenn.*umsatz.*(?:um)?.*?(\d+)\s*(?:%|prozent)?.*(?:sink|fall|weniger|reduzier)/i,
  /what.*if.*revenue.*(?:increase|grow).*(\d+)\s*(?:%|percent)?/i,
  /what.*if.*revenue.*(?:decrease|drop|fall).*(\d+)\s*(?:%|percent)?/i,

  // Cost saving scenarios
  /was.*wenn.*(?:kosten|ausgaben).*(?:um)?.*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?.*(?:spar|reduzier|einspar|weniger)/i,
  /what.*if.*(?:cost|expense).*save.*(\d+(?:[.,]\d+)?)/i,

  // Investment scenarios
  /was.*wenn.*investition.*(?:von|über)?.*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i,
  /what.*if.*invest.*(\d+(?:[.,]\d+)?)/i,

  // New expense scenarios
  /was.*wenn.*neue.*(?:ausgabe|kosten).*(?:von|über)?.*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i,
  /what.*if.*new.*(?:expense|cost).*(\d+(?:[.,]\d+)?)/i,
];

export interface ChatScenarioResponse {
  text: string;
  data?: ScenarioResult;
  visualization?: {
    type: 'comparison_chart' | 'runway_chart';
    baseline: any;
    projected: any;
  };
}

@Injectable()
export class ChatScenarioExtension {
  private readonly logger = new Logger(ChatScenarioExtension.name);

  constructor(private scenarioService: ScenarioPlanningService) {}

  /**
   * Check if message is a scenario question
   */
  isScenarioQuery(message: string): boolean {
    return SCENARIO_PATTERNS.some(pattern => pattern.test(message));
  }

  /**
   * Process scenario query and return formatted response
   */
  async processScenarioQuery(message: string, orgId: string): Promise<ChatScenarioResponse> {
    this.logger.log(`Processing scenario query: ${message.substring(0, 50)}...`);

    // Parse the scenario from natural language
    const scenario = this.parseScenarioFromMessage(message);

    if (!scenario) {
      return {
        text: 'Ich konnte das Szenario nicht verstehen. Bitte formuliere es wie:\n\n' +
              '• "Was wenn ich 2 Entwickler für €5.000/Monat einstelle?"\n' +
              '• "Was wenn der Umsatz um 20% steigt?"\n' +
              '• "Was wenn wir €3.000 monatlich an Kosten einsparen?"\n' +
              '• "Was wenn wir eine Investition von €50.000 tätigen?"',
      };
    }

    try {
      const result = await this.scenarioService.calculateScenario(orgId, scenario);

      return {
        text: this.formatScenarioResult(result),
        data: result,
        visualization: {
          type: 'comparison_chart',
          baseline: result.baseline,
          projected: result.projected,
        },
      };
    } catch (error) {
      this.logger.error('Error processing scenario:', error);
      return {
        text: 'Entschuldigung, ich konnte das Szenario nicht berechnen. Bitte stelle sicher, dass ausreichend Finanzdaten vorhanden sind.',
      };
    }
  }

  /**
   * Parse scenario from natural language message
   */
  private parseScenarioFromMessage(message: string): Scenario | null {
    const lowerMessage = message.toLowerCase();

    // Parse hiring scenario
    const hireMatch = message.match(/(\d+)\s*(?:entwickler|mitarbeiter|person|leute|developer|employee|people).*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i);
    if (hireMatch && (lowerMessage.includes('einstell') || lowerMessage.includes('anstell') || lowerMessage.includes('hire'))) {
      const count = parseInt(hireMatch[1]);
      const salary = parseFloat(hireMatch[2].replace(',', '.').replace('.', '')) || parseFloat(hireMatch[2].replace(',', ''));

      return {
        name: 'Neue Einstellung',
        description: `${count} neue Mitarbeiter für €${salary}/Monat`,
        changes: {
          newHires: {
            count,
            monthlySalary: salary,
          },
        },
      };
    }

    // Parse revenue change (increase)
    const revenueIncreaseMatch = message.match(/umsatz.*?(\d+)\s*(?:%|prozent)?.*(?:steig|wächst|erhöh|mehr)/i);
    if (revenueIncreaseMatch) {
      const percent = parseInt(revenueIncreaseMatch[1]);
      return {
        name: 'Umsatzsteigerung',
        description: `Umsatz um ${percent}% erhöhen`,
        changes: {
          revenueChangePercent: percent,
        },
      };
    }

    // Parse revenue change (decrease)
    const revenueDecreaseMatch = message.match(/umsatz.*?(\d+)\s*(?:%|prozent)?.*(?:sink|fall|weniger|reduzier)/i);
    if (revenueDecreaseMatch) {
      const percent = parseInt(revenueDecreaseMatch[1]);
      return {
        name: 'Umsatzrückgang',
        description: `Umsatz um ${percent}% reduzieren`,
        changes: {
          revenueChangePercent: -percent,
        },
      };
    }

    // Parse English revenue scenarios
    const enRevenueIncreaseMatch = message.match(/revenue.*(?:increase|grow).*(\d+)\s*(?:%|percent)?/i);
    if (enRevenueIncreaseMatch) {
      const percent = parseInt(enRevenueIncreaseMatch[1]);
      return {
        name: 'Revenue Increase',
        description: `Increase revenue by ${percent}%`,
        changes: {
          revenueChangePercent: percent,
        },
      };
    }

    // Parse cost saving scenario
    const costSaveMatch = message.match(/(?:kosten|ausgaben|cost|expense).*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?.*(?:spar|reduzier|einspar|weniger|save)/i);
    if (costSaveMatch) {
      const amount = parseFloat(costSaveMatch[1].replace(',', '.').replace(/\./g, ''));
      return {
        name: 'Kosteneinsparung',
        description: `€${amount}/Monat einsparen`,
        changes: {
          removedExpense: { description: 'Kosteneinsparung', amount },
        },
      };
    }

    // Parse new expense scenario
    const newExpenseMatch = message.match(/(?:neue|new).*(?:ausgabe|kosten|expense|cost).*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i);
    if (newExpenseMatch) {
      const amount = parseFloat(newExpenseMatch[1].replace(',', '.').replace(/\./g, ''));
      return {
        name: 'Neue Ausgabe',
        description: `€${amount}/Monat zusätzliche Kosten`,
        changes: {
          newMonthlyExpense: { description: 'Neue Ausgabe', amount },
        },
      };
    }

    // Parse investment scenario (one-time expense)
    const investmentMatch = message.match(/investition.*?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)?/i);
    if (investmentMatch) {
      const amount = parseFloat(investmentMatch[1].replace(',', '.').replace(/\./g, ''));
      return {
        name: 'Investition',
        description: `Einmalige Investition von €${amount}`,
        changes: {
          oneTimeExpense: amount,
        },
      };
    }

    return null;
  }

  /**
   * Format scenario result as readable German text
   */
  private formatScenarioResult(result: ScenarioResult): string {
    const { baseline, projected, impact, recommendation, riskLevel } = result;

    const riskEmoji = {
      low: '✅',
      medium: '⚡',
      high: '⚠️',
      critical: '🚨',
    }[riskLevel];

    let response = `${riskEmoji} **Szenario-Analyse: ${result.scenario.name}**\n\n`;

    if (result.scenario.description) {
      response += `_${result.scenario.description}_\n\n`;
    }

    response += `**Aktuelle Situation:**\n`;
    response += `• Monatliche Einnahmen: €${baseline.monthlyIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}\n`;
    response += `• Monatliche Ausgaben: €${baseline.monthlyExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}\n`;
    response += `• Burn Rate: €${baseline.burnRate.toLocaleString('de-DE', { minimumFractionDigits: 2 })}/Monat\n`;
    response += `• Runway: ${baseline.runwayMonths === Infinity ? '∞' : baseline.runwayMonths.toFixed(1)} Monate\n\n`;

    response += `**Nach Änderung:**\n`;
    response += `• Monatliche Einnahmen: €${projected.monthlyIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}\n`;
    response += `• Monatliche Ausgaben: €${projected.monthlyExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}\n`;
    response += `• Burn Rate: €${projected.burnRate.toLocaleString('de-DE', { minimumFractionDigits: 2 })}/Monat\n`;
    response += `• Runway: ${projected.runwayMonths === Infinity ? '∞' : projected.runwayMonths.toFixed(1)} Monate\n\n`;

    response += `**Auswirkung:**\n`;
    const runwayChangeSign = impact.runwayChange > 0 ? '+' : '';
    const monthlyChangeSign = impact.monthlyNetChange > 0 ? '+' : '';

    if (baseline.runwayMonths !== Infinity && projected.runwayMonths !== Infinity) {
      response += `• Runway-Änderung: ${runwayChangeSign}${impact.runwayChange.toFixed(1)} Monate\n`;
    } else if (baseline.runwayMonths !== Infinity && projected.runwayMonths === Infinity) {
      response += `• Runway-Änderung: ∞ (profitabel!)\n`;
    } else {
      response += `• Runway-Änderung: Bleibt profitabel\n`;
    }

    response += `• Monatliche Änderung: ${monthlyChangeSign}€${Math.abs(impact.monthlyNetChange).toLocaleString('de-DE', { minimumFractionDigits: 2 })}\n`;

    if (impact.breakEvenMonths) {
      response += `• Break-Even in: ${impact.breakEvenMonths} Monaten\n`;
    }

    response += `\n**Empfehlung:**\n${recommendation}`;

    return response;
  }
}
