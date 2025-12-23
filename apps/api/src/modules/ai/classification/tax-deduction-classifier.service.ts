/**
 * Tax Deduction Classifier Service
 * Specialized service for classifying tax deductions with auto-approval
 */

import { Injectable, Logger } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { AutoApproveService } from '../../automation/auto-approve.service';
import { EventsGateway } from '../../../websocket/events.gateway';
import { AutomationEvent, AutomationEventPayload, TaxEvent, TaxEventPayload } from '@operate/shared';

export interface TaxDeductionInput {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: Date | string;
  category?: string;
  invoiceNumber?: string;
  supplierId?: string;
}

export interface TaxDeductionResult {
  deductionId: string;
  category: string;
  deductionPercentage: number;
  deductibleAmount: number;
  confidence: number;
  reasoning: string;
  autoApproved: boolean;
  taxYear: number;
  requiresDocumentation: boolean;
  complianceNotes?: string[];
}

/**
 * Tax deduction rules by category
 * These are example rates - actual rates vary by country and should be configurable
 */
const TAX_DEDUCTION_RULES: Record<string, { percentage: number; maxAmount?: number }> = {
  office_supplies: { percentage: 100 },
  travel_business: { percentage: 100 },
  meals_business: { percentage: 70 }, // Often limited to 70% in many countries
  software_subscriptions: { percentage: 100 },
  professional_services: { percentage: 100 },
  marketing: { percentage: 100 },
  utilities: { percentage: 100 },
  rent: { percentage: 100 },
  equipment: { percentage: 100 },
  insurance_business: { percentage: 100 },
  vehicle_business: { percentage: 100 },
  personal: { percentage: 0 }, // Not deductible
  unknown: { percentage: 0 }, // Cannot determine deductibility
};

@Injectable()
export class TaxDeductionClassifierService {
  private readonly logger = new Logger(TaxDeductionClassifierService.name);

  constructor(
    private readonly classificationService: ClassificationService,
    private readonly autoApproveService: AutoApproveService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Classify a tax deduction with auto-approval workflow
   */
  async classifyDeduction(
    organisationId: string,
    deduction: TaxDeductionInput,
  ): Promise<TaxDeductionResult> {
    this.logger.log(`Classifying tax deduction ${deduction.id} for org ${organisationId}`);

    // Classify the transaction
    const classification = await this.classificationService.classifyTransaction({
      id: deduction.id,
      description: deduction.description,
      amount: deduction.amount,
      currency: deduction.currency,
      date: deduction.date instanceof Date ? deduction.date.toISOString() : deduction.date,
      counterparty: deduction.supplierId,
    });

    // Determine deduction percentage based on category
    const deductionRule = TAX_DEDUCTION_RULES[classification.category] || { percentage: 0 };
    const deductionPercentage = deductionRule.percentage;
    const deductibleAmount = (Math.abs(deduction.amount) * deductionPercentage) / 100;

    // Check if should auto-approve
    const decision = await this.autoApproveService.shouldAutoApprove({
      organisationId,
      feature: 'tax',
      confidenceScore: classification.confidence,
      amount: Math.abs(deduction.amount),
    });

    // Execute auto-approval if applicable
    if (decision.autoApprove) {
      await this.autoApproveService.executeAutoApproval({
        organisationId,
        feature: 'tax_deduction',
        entityType: 'deduction',
        entityId: deduction.id,
        confidenceScore: classification.confidence,
        inputData: {
          description: deduction.description,
          amount: deduction.amount,
          category: classification.category,
          deductionPercentage,
          deductibleAmount,
        },
      });
    }

    // Determine if documentation is required
    const requiresDocumentation = this.requiresDocumentation(
      Math.abs(deduction.amount),
      classification.category,
    );

    // Generate compliance notes
    const complianceNotes = this.generateComplianceNotes(
      classification.category,
      Math.abs(deduction.amount),
      deductionPercentage,
    );

    // Get tax year from date
    const taxYear = this.getTaxYear(deduction.date);

    // Emit tax deduction event
    this.emitTaxDeductionEvent(
      organisationId,
      deduction.id,
      decision.autoApprove,
      deductionPercentage,
      taxYear,
    );

    return {
      deductionId: deduction.id,
      category: classification.category,
      deductionPercentage,
      deductibleAmount,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      autoApproved: decision.autoApprove,
      taxYear,
      requiresDocumentation,
      complianceNotes: complianceNotes.length > 0 ? complianceNotes : undefined,
    };
  }

  /**
   * Classify multiple deductions in batch
   */
  async classifyDeductionBatch(
    organisationId: string,
    deductions: TaxDeductionInput[],
  ): Promise<TaxDeductionResult[]> {
    this.logger.log(
      `Batch classifying ${deductions.length} tax deductions for org ${organisationId}`,
    );

    const results = await Promise.all(
      deductions.map((deduction) =>
        this.classifyDeduction(organisationId, deduction),
      ),
    );

    // Calculate totals
    const totalDeductible = results.reduce(
      (sum, r) => sum + r.deductibleAmount,
      0,
    );
    const autoApprovedCount = results.filter((r) => r.autoApproved).length;

    this.logger.log(
      `Batch complete: ${results.length} deductions, ${autoApprovedCount} auto-approved, total deductible: ${totalDeductible}`,
    );

    return results;
  }

  /**
   * Determine if documentation is required
   */
  private requiresDocumentation(amount: number, category: string): boolean {
    // High-value deductions always require documentation
    if (amount > 1000) {
      return true;
    }

    // Certain categories always require documentation
    const categoriesRequiringDocs = [
      'equipment',
      'professional_services',
      'rent',
      'vehicle_business',
    ];

    return categoriesRequiringDocs.includes(category);
  }

  /**
   * Generate compliance notes for the deduction
   */
  private generateComplianceNotes(
    category: string,
    amount: number,
    deductionPercentage: number,
  ): string[] {
    const notes: string[] = [];

    if (deductionPercentage === 0) {
      notes.push('This expense is not tax-deductible');
    }

    if (category === 'meals_business' && deductionPercentage < 100) {
      notes.push(
        `Business meals are typically ${deductionPercentage}% deductible`,
      );
    }

    if (amount > 10000) {
      notes.push(
        'High-value deduction - ensure proper documentation and approval',
      );
    }

    if (category === 'vehicle_business') {
      notes.push(
        'Vehicle expenses may require mileage logs and business use percentage calculation',
      );
    }

    if (category === 'equipment' && amount > 800) {
      notes.push(
        'Equipment over depreciation threshold may need to be capitalized and depreciated',
      );
    }

    return notes;
  }

  /**
   * Get tax year from date
   */
  private getTaxYear(date: Date | string): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getFullYear();
  }

  /**
   * Emit tax deduction event via WebSocket
   */
  private emitTaxDeductionEvent(
    organisationId: string,
    deductionId: string,
    autoApproved: boolean,
    deductionPercentage: number,
    taxYear: number,
  ): void {
    try {
      const payload: AutomationEventPayload = {
        organizationId: organisationId,
        entityType: 'tax_deduction',
        entityId: deductionId,
        feature: 'tax_deduction',
        action: autoApproved ? 'AUTO_APPROVED' : 'CLASSIFIED',
        autoApproved,
        timestamp: new Date(),
        metadata: {
          deductionPercentage,
          taxYear,
        },
      };

      this.eventsGateway.emitToOrganization(
        organisationId,
        AutomationEvent.TAX_DEDUCTION_SUGGESTED,
        payload,
      );

      this.logger.debug(
        `Emitted tax deduction event for ${deductionId} (${deductionPercentage}% deductible)`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit tax deduction event for ${deductionId}: ${error.message}`,
      );
    }
  }
}
