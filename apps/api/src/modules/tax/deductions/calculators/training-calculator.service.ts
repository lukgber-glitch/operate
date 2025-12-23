import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  TrainingCalculatorInput,
  DeductionResultDto,
  CalculationBreakdown,
  TrainingType,
} from '../dto/calculators';

/**
 * Training/education deduction rules
 */
interface TrainingRules {
  // Deductibility by training type
  professionalDevelopment: number; // % deductible (0-100)
  degreeProgram: number;
  certification: number;
  languageCourse: number;
  conference: number;
  workshop: number;
  // Limits
  annualMaximum?: number;
  requiresEmployerConnection?: boolean;
  requiresJobRelation?: boolean;
  currency: string;
  legalReference: string;
  year: number;
  notes?: string;
}

/**
 * Default training rules by country (2024)
 */
const DEFAULT_TRAINING_RULES: Record<string, TrainingRules> = {
  DE: {
    // Germany
    professionalDevelopment: 100, // Fully deductible if job-related
    degreeProgram: 100, // First degree not deductible, second degree fully deductible
    certification: 100,
    languageCourse: 100, // If job-related
    conference: 100,
    workshop: 100,
    annualMaximum: undefined, // No limit for Werbungskosten
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: '§ 9 Abs. 1 Satz 3 Nr. 7 EStG (Fortbildung)',
    year: 2024,
    notes: 'First degree (Erstausbildung) limited to €6,000/year as Sonderausgaben',
  },
  AT: {
    // Austria
    professionalDevelopment: 100,
    degreeProgram: 100,
    certification: 100,
    languageCourse: 50, // Partially deductible
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: '§ 16 Abs. 1 EStG',
    year: 2024,
  },
  UK: {
    // United Kingdom
    professionalDevelopment: 100,
    degreeProgram: 0, // Generally not deductible
    certification: 100,
    languageCourse: 100, // If wholly for business
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'GBP',
    legalReference: 'ITEPA 2003 Section 250',
    year: 2024,
  },
  FR: {
    // France
    professionalDevelopment: 100,
    degreeProgram: 50,
    certification: 100,
    languageCourse: 100,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: 'Article 83 du CGI',
    year: 2024,
  },
  ES: {
    // Spain
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 50,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: 'Artículo 19 LIRPF',
    year: 2024,
  },
  IT: {
    // Italy
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 50,
    conference: 100,
    workshop: 100,
    annualMaximum: 10000,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: 'Articolo 10 TUIR',
    year: 2024,
  },
  NL: {
    // Netherlands
    professionalDevelopment: 100,
    degreeProgram: 100,
    certification: 100,
    languageCourse: 100,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'EUR',
    legalReference: 'Artikel 6.27 Wet IB',
    year: 2024,
  },
  SE: {
    // Sweden
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 50,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'SEK',
    legalReference: '12 kap. 1-2 § IL',
    year: 2024,
  },
  JP: {
    // Japan
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 100,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'JPY',
    legalReference: '所得税法第57条',
    year: 2024,
  },
  SA: {
    // Saudi Arabia
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 50,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'SAR',
    legalReference: 'Income Tax Law Article 13',
    year: 2024,
  },
  IN: {
    // India
    professionalDevelopment: 100,
    degreeProgram: 0,
    certification: 100,
    languageCourse: 50,
    conference: 100,
    workshop: 100,
    annualMaximum: undefined,
    requiresEmployerConnection: false,
    requiresJobRelation: true,
    currency: 'INR',
    legalReference: 'Section 10(14) Income Tax Act',
    year: 2024,
  },
};

/**
 * Training Calculator Service
 * Calculates tax deduction for professional training and education expenses
 */
@Injectable()
export class TrainingCalculatorService {
  private readonly logger = new Logger(TrainingCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate training/education deduction
   */
  async calculate(input: TrainingCalculatorInput): Promise<DeductionResultDto> {
    const { countryCode, amount, trainingType, taxRate } = input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating training deduction: ${countryCode}, ${trainingType}, ${amount}`,
    );

    const rules = await this.getEducationRules(countryCode, taxYear);

    // Get deductibility percentage for training type
    let deductiblePercentage: number;
    let trainingTypeName: string;

    switch (trainingType) {
      case TrainingType.PROFESSIONAL_DEVELOPMENT:
        deductiblePercentage = rules.professionalDevelopment;
        trainingTypeName = 'Professional Development';
        break;
      case TrainingType.DEGREE_PROGRAM:
        deductiblePercentage = rules.degreeProgram;
        trainingTypeName = 'Degree Program';
        break;
      case TrainingType.CERTIFICATION:
        deductiblePercentage = rules.certification;
        trainingTypeName = 'Certification';
        break;
      case TrainingType.LANGUAGE_COURSE:
        deductiblePercentage = rules.languageCourse;
        trainingTypeName = 'Language Course';
        break;
      case TrainingType.CONFERENCE:
        deductiblePercentage = rules.conference;
        trainingTypeName = 'Conference';
        break;
      case TrainingType.WORKSHOP:
        deductiblePercentage = rules.workshop;
        trainingTypeName = 'Workshop';
        break;
      default:
        deductiblePercentage = rules.professionalDevelopment;
        trainingTypeName = 'Training';
    }

    if (deductiblePercentage === 0) {
      throw new Error(
        `${trainingTypeName} expenses are not deductible in ${countryCode}`,
      );
    }

    const breakdown: CalculationBreakdown[] = [];

    breakdown.push({
      step: 'Training type',
      value: 0,
      note: trainingTypeName,
    });

    breakdown.push({
      step: 'Total expense amount',
      value: amount,
      unit: rules.currency,
    });

    // Calculate deductible amount
    let deductibleAmount = amount * (deductiblePercentage / 100);

    if (deductiblePercentage < 100) {
      breakdown.push({
        step: `${deductiblePercentage}% deductible`,
        value: deductibleAmount,
        unit: rules.currency,
        note: `${amount} ${rules.currency} × ${deductiblePercentage}%`,
      });
    } else {
      breakdown.push({
        step: 'Fully deductible (100%)',
        value: deductibleAmount,
        unit: rules.currency,
      });
    }

    // Apply annual maximum if exists
    if (rules.annualMaximum && deductibleAmount > rules.annualMaximum) {
      breakdown.push({
        step: 'Annual maximum cap',
        value: rules.annualMaximum,
        unit: rules.currency,
        note: `Reduced from ${deductibleAmount.toFixed(2)} ${rules.currency}`,
      });
      deductibleAmount = rules.annualMaximum;
    }

    const effectiveTaxRate = taxRate || 40;
    const taxSavings = deductibleAmount * (effectiveTaxRate / 100);

    const requirements: string[] = [
      'Keep receipts and proof of payment',
      'Training must be related to your current profession or business',
    ];

    if (rules.requiresEmployerConnection) {
      requirements.push('Training should be connected to your employment');
    }

    if (rules.requiresJobRelation) {
      requirements.push('Training must maintain or improve skills for your current job');
    }

    requirements.push('Keep course descriptions, certificates, and attendance records');

    if (trainingType === TrainingType.DEGREE_PROGRAM) {
      requirements.push('For degree programs, check if it qualifies as continuing education');
    }

    if (trainingType === TrainingType.LANGUAGE_COURSE) {
      requirements.push('Language courses must be primarily for business purposes');
    }

    const warnings: string[] = [];

    if (rules.annualMaximum) {
      warnings.push(
        `Annual maximum deduction: ${rules.annualMaximum} ${rules.currency}`,
      );
    }

    if (trainingType === TrainingType.DEGREE_PROGRAM && deductiblePercentage === 0) {
      warnings.push('First degree programs typically not deductible or limited');
      warnings.push('Second/further degrees may be fully deductible');
    }

    if (deductiblePercentage < 100) {
      warnings.push(
        `Only ${deductiblePercentage}% of ${trainingTypeName.toLowerCase()} expenses are deductible`,
      );
    }

    warnings.push('Employer reimbursements reduce your deductible amount');
    warnings.push('Travel and accommodation for training may be separately deductible');

    if (rules.notes) {
      warnings.push(rules.notes);
    }

    return {
      originalAmount: amount,
      deductibleAmount,
      deductiblePercentage,
      currency: rules.currency,
      taxSavingsEstimate: taxSavings,
      taxRate: effectiveTaxRate,
      breakdown,
      legalReference: rules.legalReference,
      requirements,
      warnings,
      metadata: {
        trainingType,
        taxYear,
        requiresJobRelation: rules.requiresJobRelation,
      },
    };
  }

  /**
   * Get education rules for a country
   */
  async getEducationRules(
    countryCode: string,
    taxYear: number,
  ): Promise<TrainingRules> {
    try {
      const config = await this.prisma.countryTaxConfig.findUnique({
        where: { countryId: countryCode },
      });

      if (config) {
        this.logger.debug(
          `Country config found for ${countryCode}, using defaults`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not load country config for ${countryCode}: ${error.message}`,
      );
    }

    const rules = DEFAULT_TRAINING_RULES[countryCode];
    if (!rules) {
      this.logger.warn(
        `No training rules for ${countryCode}, using Germany as fallback`,
      );
      return DEFAULT_TRAINING_RULES.DE;
    }

    return rules;
  }
}
