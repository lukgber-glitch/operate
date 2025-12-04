/**
 * Merchant Category Codes (MCC) Mapping
 * Maps standard MCC codes to transaction categories
 */

import { TransactionCategory } from './types';

export interface MCCDefinition {
  code: string;
  description: string;
  category: TransactionCategory;
  confidenceBoost?: number; // Additional confidence if MCC matches
}

/**
 * MCC Code to Category Mapping
 * Based on ISO 18245 standard merchant category codes
 */
export const MCC_CATEGORY_MAP: Record<string, MCCDefinition> = {
  // Office Supplies & Stationery
  '5942': {
    code: '5942',
    description: 'Book Stores',
    category: TransactionCategory.OFFICE_SUPPLIES,
    confidenceBoost: 0.1,
  },
  '5943': {
    code: '5943',
    description: 'Stationery, Office Supplies',
    category: TransactionCategory.OFFICE_SUPPLIES,
    confidenceBoost: 0.15,
  },
  '5044': {
    code: '5044',
    description: 'Office Equipment',
    category: TransactionCategory.EQUIPMENT,
    confidenceBoost: 0.15,
  },

  // Travel & Transportation
  '3000-3299': {
    code: '3000-3299',
    description: 'Airlines',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.1,
  },
  '3501-3836': {
    code: '3501-3836',
    description: 'Hotels, Motels, Resorts',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.1,
  },
  '4111': {
    code: '4111',
    description: 'Transportation - Suburban and Local Commuter',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.05,
  },
  '4112': {
    code: '4112',
    description: 'Passenger Railways',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.05,
  },
  '4121': {
    code: '4121',
    description: 'Taxicabs and Limousines',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.05,
  },
  '4131': {
    code: '4131',
    description: 'Bus Lines',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.05,
  },
  '4214': {
    code: '4214',
    description: 'Truck and Utility Trailer Rentals',
    category: TransactionCategory.VEHICLE_BUSINESS,
    confidenceBoost: 0.1,
  },
  '4215': {
    code: '4215',
    description: 'Courier Services',
    category: TransactionCategory.PROFESSIONAL_SERVICES,
    confidenceBoost: 0.1,
  },
  '7512': {
    code: '7512',
    description: 'Car Rental',
    category: TransactionCategory.TRAVEL_BUSINESS,
    confidenceBoost: 0.1,
  },
  '7513': {
    code: '7513',
    description: 'Truck/Utility Trailer Rentals',
    category: TransactionCategory.VEHICLE_BUSINESS,
    confidenceBoost: 0.1,
  },

  // Restaurants & Dining
  '5812': {
    code: '5812',
    description: 'Eating Places, Restaurants',
    category: TransactionCategory.MEALS_BUSINESS,
    confidenceBoost: 0.05,
  },
  '5813': {
    code: '5813',
    description: 'Drinking Places (Bars, Taverns)',
    category: TransactionCategory.MEALS_BUSINESS,
    confidenceBoost: 0.05,
  },
  '5814': {
    code: '5814',
    description: 'Fast Food Restaurants',
    category: TransactionCategory.MEALS_BUSINESS,
    confidenceBoost: 0.05,
  },

  // Software & Technology
  '5045': {
    code: '5045',
    description: 'Computer, Computer Peripheral Equipment, Software',
    category: TransactionCategory.EQUIPMENT,
    confidenceBoost: 0.15,
  },
  '5734': {
    code: '5734',
    description: 'Computer Software Stores',
    category: TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
    confidenceBoost: 0.15,
  },
  '7372': {
    code: '7372',
    description: 'Computer Programming, Data Processing',
    category: TransactionCategory.SOFTWARE_SUBSCRIPTIONS,
    confidenceBoost: 0.15,
  },
  '7379': {
    code: '7379',
    description: 'Computer Maintenance and Repair',
    category: TransactionCategory.PROFESSIONAL_SERVICES,
    confidenceBoost: 0.1,
  },

  // Professional Services
  '8111': {
    code: '8111',
    description: 'Legal Services, Attorneys',
    category: TransactionCategory.PROFESSIONAL_SERVICES,
    confidenceBoost: 0.2,
  },
  '8931': {
    code: '8931',
    description: 'Accounting, Auditing, Bookkeeping Services',
    category: TransactionCategory.PROFESSIONAL_SERVICES,
    confidenceBoost: 0.2,
  },
  '7311': {
    code: '7311',
    description: 'Advertising Services',
    category: TransactionCategory.MARKETING,
    confidenceBoost: 0.15,
  },
  '7333': {
    code: '7333',
    description: 'Commercial Photography, Art and Graphics',
    category: TransactionCategory.MARKETING,
    confidenceBoost: 0.1,
  },
  '7399': {
    code: '7399',
    description: 'Business Services',
    category: TransactionCategory.PROFESSIONAL_SERVICES,
    confidenceBoost: 0.05,
  },

  // Utilities & Communications
  '4812': {
    code: '4812',
    description: 'Telecommunication Equipment and Sales',
    category: TransactionCategory.UTILITIES,
    confidenceBoost: 0.1,
  },
  '4814': {
    code: '4814',
    description: 'Telecommunication Services',
    category: TransactionCategory.UTILITIES,
    confidenceBoost: 0.15,
  },
  '4899': {
    code: '4899',
    description: 'Cable and Other Pay Television',
    category: TransactionCategory.UTILITIES,
    confidenceBoost: 0.1,
  },
  '4900': {
    code: '4900',
    description: 'Utilities - Electric, Gas, Water, Sanitary',
    category: TransactionCategory.UTILITIES,
    confidenceBoost: 0.2,
  },

  // Insurance
  '6300': {
    code: '6300',
    description: 'Insurance Sales, Underwriting',
    category: TransactionCategory.INSURANCE_BUSINESS,
    confidenceBoost: 0.15,
  },

  // Fuel & Vehicle
  '5541': {
    code: '5541',
    description: 'Service Stations (with or without Ancillary Services)',
    category: TransactionCategory.VEHICLE_BUSINESS,
    confidenceBoost: 0.1,
  },
  '5542': {
    code: '5542',
    description: 'Automated Fuel Dispensers',
    category: TransactionCategory.VEHICLE_BUSINESS,
    confidenceBoost: 0.1,
  },
  '7538': {
    code: '7538',
    description: 'Automotive Service Shops',
    category: TransactionCategory.VEHICLE_BUSINESS,
    confidenceBoost: 0.1,
  },

  // Miscellaneous
  '6012': {
    code: '6012',
    description: 'Financial Institutions',
    category: TransactionCategory.TRANSFER_INTERNAL,
    confidenceBoost: 0.1,
  },
  '9311': {
    code: '9311',
    description: 'Tax Payments',
    category: TransactionCategory.TAX_PAYMENT,
    confidenceBoost: 0.2,
  },
};

/**
 * Get category from MCC code
 */
export function getCategoryFromMCC(mccCode: string): TransactionCategory | null {
  const definition = MCC_CATEGORY_MAP[mccCode];
  return definition ? definition.category : null;
}

/**
 * Get confidence boost from MCC code
 */
export function getMCCConfidenceBoost(mccCode: string): number {
  const definition = MCC_CATEGORY_MAP[mccCode];
  return definition?.confidenceBoost || 0;
}

/**
 * Check if MCC code matches expected category
 */
export function mccMatchesCategory(
  mccCode: string,
  category: TransactionCategory,
): boolean {
  const mccCategory = getCategoryFromMCC(mccCode);
  return mccCategory === category;
}
