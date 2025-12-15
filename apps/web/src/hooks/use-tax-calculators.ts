'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Country-specific rates and configurations
export const COUNTRY_CONFIGS = {
  AT: {
    name: 'Austria',
    currency: 'EUR',
    commuterRate: 0.38, // €0.38 per km
    publicTransportDeduction: true,
    homeOfficeDailyRate: 3, // €3 per day
    homeOfficeMaxDays: 100,
    perDiemDomestic: {
      fullDay: 26.40,
      partialDay: 13.20,
    },
    perDiemInternational: {
      fullDay: 40,
      partialDay: 20,
    },
    mileageRates: {
      car: 0.42,
      electricCar: 0.50,
      motorcycle: 0.24,
      bicycle: 0.38,
    },
    trainingDeductionRate: 1.0, // 100% deductible
  },
  DE: {
    name: 'Germany',
    currency: 'EUR',
    commuterRate: 0.30, // €0.30 per km
    publicTransportDeduction: true,
    homeOfficeDailyRate: 5, // €5 per day (2023 rate)
    homeOfficeMaxDays: 120,
    perDiemDomestic: {
      fullDay: 28,
      partialDay: 14,
    },
    perDiemInternational: {
      fullDay: 35,
      partialDay: 17.50,
    },
    mileageRates: {
      car: 0.30,
      electricCar: 0.30,
      motorcycle: 0.20,
      bicycle: 0.30,
    },
    trainingDeductionRate: 1.0,
  },
  UK: {
    name: 'United Kingdom',
    currency: 'GBP',
    commuterRate: 0, // No commuter deduction in UK
    publicTransportDeduction: false,
    homeOfficeDailyRate: 6, // £6 per week
    homeOfficeMaxDays: 52, // weekly rate
    perDiemDomestic: {
      fullDay: 25,
      partialDay: 10,
    },
    perDiemInternational: {
      fullDay: 35,
      partialDay: 15,
    },
    mileageRates: {
      car: 0.45, // First 10,000 miles
      electricCar: 0.45,
      motorcycle: 0.24,
      bicycle: 0.20,
    },
    trainingDeductionRate: 1.0,
  },
  ES: {
    name: 'Spain',
    currency: 'EUR',
    commuterRate: 0.19, // €0.19 per km
    publicTransportDeduction: true,
    homeOfficeDailyRate: 2, // €2 per day
    homeOfficeMaxDays: 150, // max €300/year
    perDiemDomestic: {
      fullDay: 53.34,
      partialDay: 26.67,
    },
    perDiemInternational: {
      fullDay: 91.35,
      partialDay: 48.08,
    },
    mileageRates: {
      car: 0.19,
      electricCar: 0.19,
      motorcycle: 0.19,
      bicycle: 0.19,
    },
    trainingDeductionRate: 1.0,
  },
  FR: {
    name: 'France',
    currency: 'EUR',
    commuterRate: 0.25, // €0.25 per km (barème kilométrique)
    publicTransportDeduction: true,
    homeOfficeDailyRate: 2.50, // €2.50 per day
    homeOfficeMaxDays: 232, // max €580/year
    perDiemDomestic: {
      fullDay: 19.40,
      partialDay: 9.70,
    },
    perDiemInternational: {
      fullDay: 21,
      partialDay: 10.50,
    },
    mileageRates: {
      car: 0.25,
      electricCar: 0.25,
      motorcycle: 0.12,
      bicycle: 0.25,
    },
    trainingDeductionRate: 1.0,
  },
  IT: {
    name: 'Italy',
    currency: 'EUR',
    commuterRate: 0.19, // €0.19 per km (limited)
    publicTransportDeduction: true,
    homeOfficeDailyRate: 0, // No flat rate in Italy
    homeOfficeMaxDays: 0, // Room-based only
    perDiemDomestic: {
      fullDay: 46.48,
      partialDay: 23.24,
    },
    perDiemInternational: {
      fullDay: 77.47,
      partialDay: 38.73,
    },
    mileageRates: {
      car: 0.35, // Based on ACI tables
      electricCar: 0.35,
      motorcycle: 0.20,
      bicycle: 0.19,
    },
    trainingDeductionRate: 1.0,
  },
  NL: {
    name: 'Netherlands',
    currency: 'EUR',
    commuterRate: 0.23, // €0.23 per km (max 40km one-way)
    publicTransportDeduction: true,
    homeOfficeDailyRate: 2, // €2 per day (werkkostenregeling)
    homeOfficeMaxDays: 250,
    perDiemDomestic: {
      fullDay: 40,
      partialDay: 20,
    },
    perDiemInternational: {
      fullDay: 50,
      partialDay: 25,
    },
    mileageRates: {
      car: 0.23,
      electricCar: 0.23,
      motorcycle: 0.23,
      bicycle: 0.23,
    },
    trainingDeductionRate: 1.0,
  },
  SV: {
    name: 'Sweden',
    currency: 'SEK',
    commuterRate: 2.50, // 2.50 SEK/km (€0.22) for distance >5km
    publicTransportDeduction: true,
    homeOfficeDailyRate: 6.67, // 200 SEK/month (€17) divided by 30 days
    homeOfficeMaxDays: 250,
    perDiemDomestic: {
      fullDay: 260, // 260 SEK (€23)
      partialDay: 130,
    },
    perDiemInternational: {
      fullDay: 350,
      partialDay: 175,
    },
    mileageRates: {
      car: 2.50,
      electricCar: 2.50,
      motorcycle: 2.50,
      bicycle: 2.50,
    },
    trainingDeductionRate: 1.0,
  },
  JP: {
    name: 'Japan',
    currency: 'JPY',
    commuterRate: 15, // ¥15/km (€0.09) or actual train cost
    publicTransportDeduction: true,
    homeOfficeDailyRate: 500, // ¥500/day (€3)
    homeOfficeMaxDays: 100,
    perDiemDomestic: {
      fullDay: 2500, // ¥2,500 (€15)
      partialDay: 1250,
    },
    perDiemInternational: {
      fullDay: 5000,
      partialDay: 2500,
    },
    mileageRates: {
      car: 15,
      electricCar: 15,
      motorcycle: 15,
      bicycle: 15,
    },
    trainingDeductionRate: 1.0,
  },
  SA: {
    name: 'Saudi Arabia',
    currency: 'SAR',
    commuterRate: 0, // No personal income tax
    publicTransportDeduction: false,
    homeOfficeDailyRate: 0,
    homeOfficeMaxDays: 0,
    perDiemDomestic: {
      fullDay: 0,
      partialDay: 0,
    },
    perDiemInternational: {
      fullDay: 0,
      partialDay: 0,
    },
    mileageRates: {
      car: 0,
      electricCar: 0,
      motorcycle: 0,
      bicycle: 0,
    },
    trainingDeductionRate: 0, // Business deductions only, handled separately
    noPersonalIncomeTax: true, // Special flag for UI
    message: 'Saudi Arabia does not have personal income tax. Tax calculators are for business expense tracking only.',
  },
  IN: {
    name: 'India',
    currency: 'INR',
    commuterRate: 24, // ₹24/km (€0.26) or conveyance allowance
    publicTransportDeduction: true,
    homeOfficeDailyRate: 0, // No specific provision
    homeOfficeMaxDays: 0,
    perDiemDomestic: {
      fullDay: 900, // ₹900 (€10)
      partialDay: 450,
    },
    perDiemInternational: {
      fullDay: 2000,
      partialDay: 1000,
    },
    mileageRates: {
      car: 24,
      electricCar: 24,
      motorcycle: 12,
      bicycle: 24,
    },
    trainingDeductionRate: 1.0, // 100% deductible under Section 80C
  },
};

export type Country = keyof typeof COUNTRY_CONFIGS;

interface CommuterCalculation {
  distance: number;
  workingDays: number;
  usePublicTransport: boolean;
  publicTransportCost?: number;
  annualDeduction: number;
  taxSavings: number;
}

interface HomeOfficeCalculation {
  type: 'flat' | 'room';
  daysWorked?: number;
  roomSize?: number;
  totalHomeSize?: number;
  monthlyRent?: number;
  monthsUsed?: number;
  exclusiveUse?: boolean;
  annualDeduction: number;
  taxSavings: number;
}

interface PerDiemCalculation {
  startDate: string;
  endDate: string;
  international: boolean;
  fullDays: number;
  partialDays: number;
  totalDeduction: number;
  taxSavings: number;
}

interface MileageCalculation {
  distance: number;
  vehicleType: 'car' | 'electricCar' | 'motorcycle' | 'bicycle';
  deduction: number;
  taxSavings: number;
}

interface TrainingCalculation {
  courseName: string;
  provider: string;
  totalCost: number;
  trainingType: string;
  deductiblePercentage: number;
  deduction: number;
  taxSavings: number;
}

export function useTaxCalculators(country: Country = 'AT') {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const config = COUNTRY_CONFIGS[country];

  // Default tax rate for savings calculation (can be customized)
  const estimatedTaxRate = 0.30; // 30%

  const calculateCommuter = (
    distance: number,
    workingDays: number,
    usePublicTransport: boolean,
    publicTransportCost?: number
  ): CommuterCalculation => {
    let annualDeduction = 0;

    if (usePublicTransport && publicTransportCost && config.publicTransportDeduction) {
      annualDeduction = publicTransportCost * 12;
    } else {
      annualDeduction = distance * 2 * workingDays * config.commuterRate;
    }

    return {
      distance,
      workingDays,
      usePublicTransport,
      publicTransportCost,
      annualDeduction,
      taxSavings: annualDeduction * estimatedTaxRate,
    };
  };

  const calculateHomeOfficeFlat = (daysWorked: number): HomeOfficeCalculation => {
    const maxDays = config.homeOfficeMaxDays;
    const effectiveDays = Math.min(daysWorked, maxDays);
    const annualDeduction = effectiveDays * config.homeOfficeDailyRate;

    return {
      type: 'flat',
      daysWorked,
      annualDeduction,
      taxSavings: annualDeduction * estimatedTaxRate,
    };
  };

  const calculateHomeOfficeRoom = (
    roomSize: number,
    totalHomeSize: number,
    monthlyRent: number,
    monthsUsed: number,
    exclusiveUse: boolean
  ): HomeOfficeCalculation => {
    const percentage = roomSize / totalHomeSize;
    const deductionMultiplier = exclusiveUse ? 1.0 : 0.5;
    const annualDeduction = monthlyRent * monthsUsed * percentage * deductionMultiplier;

    return {
      type: 'room',
      roomSize,
      totalHomeSize,
      monthlyRent,
      monthsUsed,
      exclusiveUse,
      annualDeduction,
      taxSavings: annualDeduction * estimatedTaxRate,
    };
  };

  const calculatePerDiem = (
    startDate: string,
    endDate: string,
    international: boolean
  ): PerDiemCalculation => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // First and last days are partial, rest are full
    const fullDays = Math.max(0, totalDays - 2);
    const partialDays = totalDays > 0 ? Math.min(2, totalDays) : 0;

    const rates = international ? config.perDiemInternational : config.perDiemDomestic;
    const totalDeduction = fullDays * rates.fullDay + partialDays * rates.partialDay;

    return {
      startDate,
      endDate,
      international,
      fullDays,
      partialDays,
      totalDeduction,
      taxSavings: totalDeduction * estimatedTaxRate,
    };
  };

  const calculateMileage = (
    distance: number,
    vehicleType: 'car' | 'electricCar' | 'motorcycle' | 'bicycle'
  ): MileageCalculation => {
    const rate = config.mileageRates[vehicleType];
    const deduction = distance * rate;

    return {
      distance,
      vehicleType,
      deduction,
      taxSavings: deduction * estimatedTaxRate,
    };
  };

  const calculateTraining = (
    courseName: string,
    provider: string,
    totalCost: number,
    trainingType: string
  ): TrainingCalculation => {
    const deductiblePercentage = config.trainingDeductionRate;
    const deduction = totalCost * deductiblePercentage;

    return {
      courseName,
      provider,
      totalCost,
      trainingType,
      deductiblePercentage,
      deduction,
      taxSavings: deduction * estimatedTaxRate,
    };
  };

  const saveAsDeduction = async (calculation: any, type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/tax/deductions/from-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          calculation,
          country,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save deduction');
      }

      toast({
        title: 'Success',
        description: 'Deduction entry created successfully',
      });

      return await response.json();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save deduction entry',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    config,
    isLoading,
    calculateCommuter,
    calculateHomeOfficeFlat,
    calculateHomeOfficeRoom,
    calculatePerDiem,
    calculateMileage,
    calculateTraining,
    saveAsDeduction,
  };
}
