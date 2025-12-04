/**
 * US State Economic Nexus Thresholds
 * Based on South Dakota v. Wayfair (2018) and state-specific rules
 * Updated as of 2024
 */

export interface StateNexusThreshold {
  state: string;
  stateName: string;
  salesThreshold: number | null; // Annual sales threshold in USD
  transactionThreshold: number | null; // Annual transaction count threshold
  operator: 'OR' | 'AND'; // Whether thresholds are OR'd or AND'd
  effectiveDate: string; // When the law took effect
  isTaxHoliday: boolean; // Whether state has sales tax holidays
  isOriginBased: boolean; // Origin vs destination-based sourcing
  notes?: string;
}

/**
 * Complete US state nexus threshold data
 * States with null for both thresholds have no economic nexus laws (or special cases)
 */
export const US_STATE_THRESHOLDS: Record<string, StateNexusThreshold> = {
  AL: {
    state: 'AL',
    stateName: 'Alabama',
    salesThreshold: 250000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2018-10-01',
    isTaxHoliday: true,
    isOriginBased: false,
    notes: 'Sales threshold only',
  },
  AK: {
    state: 'AK',
    stateName: 'Alaska',
    salesThreshold: null,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: 'N/A',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'No state sales tax',
  },
  AZ: {
    state: 'AZ',
    stateName: 'Arizona',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  AR: {
    state: 'AR',
    stateName: 'Arkansas',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  CA: {
    state: 'CA',
    stateName: 'California',
    salesThreshold: 500000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-04-01',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'Higher threshold than most states',
  },
  CO: {
    state: 'CO',
    stateName: 'Colorado',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-06-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  CT: {
    state: 'CT',
    stateName: 'Connecticut',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'AND',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'Both thresholds must be met (AND)',
  },
  DE: {
    state: 'DE',
    stateName: 'Delaware',
    salesThreshold: null,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: 'N/A',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'No state sales tax',
  },
  FL: {
    state: 'FL',
    stateName: 'Florida',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2021-07-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  GA: {
    state: 'GA',
    stateName: 'Georgia',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2020-01-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  HI: {
    state: 'HI',
    stateName: 'Hawaii',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2018-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  ID: {
    state: 'ID',
    stateName: 'Idaho',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-06-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  IL: {
    state: 'IL',
    stateName: 'Illinois',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  IN: {
    state: 'IN',
    stateName: 'Indiana',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  IA: {
    state: 'IA',
    stateName: 'Iowa',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-01-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  KS: {
    state: 'KS',
    stateName: 'Kansas',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2021-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  KY: {
    state: 'KY',
    stateName: 'Kentucky',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  LA: {
    state: 'LA',
    stateName: 'Louisiana',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2020-07-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  ME: {
    state: 'ME',
    stateName: 'Maine',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  MD: {
    state: 'MD',
    stateName: 'Maryland',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  MA: {
    state: 'MA',
    stateName: 'Massachusetts',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  MI: {
    state: 'MI',
    stateName: 'Michigan',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  MN: {
    state: 'MN',
    stateName: 'Minnesota',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  MS: {
    state: 'MS',
    stateName: 'Mississippi',
    salesThreshold: 250000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-09-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  MO: {
    state: 'MO',
    stateName: 'Missouri',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2023-01-01',
    isTaxHoliday: true,
    isOriginBased: true,
    notes: 'Origin-based sourcing',
  },
  MT: {
    state: 'MT',
    stateName: 'Montana',
    salesThreshold: null,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: 'N/A',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'No state sales tax',
  },
  NE: {
    state: 'NE',
    stateName: 'Nebraska',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-04-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  NV: {
    state: 'NV',
    stateName: 'Nevada',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  NH: {
    state: 'NH',
    stateName: 'New Hampshire',
    salesThreshold: null,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: 'N/A',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'No state sales tax',
  },
  NJ: {
    state: 'NJ',
    stateName: 'New Jersey',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2018-11-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  NM: {
    state: 'NM',
    stateName: 'New Mexico',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  NY: {
    state: 'NY',
    stateName: 'New York',
    salesThreshold: 500000,
    transactionThreshold: 100,
    operator: 'AND',
    effectiveDate: '2019-06-01',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'Both thresholds must be met (AND)',
  },
  NC: {
    state: 'NC',
    stateName: 'North Carolina',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-11-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  ND: {
    state: 'ND',
    stateName: 'North Dakota',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  OH: {
    state: 'OH',
    stateName: 'Ohio',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-08-01',
    isTaxHoliday: true,
    isOriginBased: true,
    notes: 'Origin-based sourcing',
  },
  OK: {
    state: 'OK',
    stateName: 'Oklahoma',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-11-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  OR: {
    state: 'OR',
    stateName: 'Oregon',
    salesThreshold: null,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: 'N/A',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'No state sales tax',
  },
  PA: {
    state: 'PA',
    stateName: 'Pennsylvania',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  RI: {
    state: 'RI',
    stateName: 'Rhode Island',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  SC: {
    state: 'SC',
    stateName: 'South Carolina',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-11-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  SD: {
    state: 'SD',
    stateName: 'South Dakota',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2016-05-01',
    isTaxHoliday: false,
    isOriginBased: false,
    notes: 'First state to implement economic nexus (South Dakota v. Wayfair)',
  },
  TN: {
    state: 'TN',
    stateName: 'Tennessee',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  TX: {
    state: 'TX',
    stateName: 'Texas',
    salesThreshold: 500000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: true,
    isOriginBased: true,
    notes: 'Higher threshold than most states, origin-based sourcing',
  },
  UT: {
    state: 'UT',
    stateName: 'Utah',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-01-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  VT: {
    state: 'VT',
    stateName: 'Vermont',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  VA: {
    state: 'VA',
    stateName: 'Virginia',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-07-01',
    isTaxHoliday: true,
    isOriginBased: false,
  },
  WA: {
    state: 'WA',
    stateName: 'Washington',
    salesThreshold: 100000,
    transactionThreshold: null,
    operator: 'OR',
    effectiveDate: '2018-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  WV: {
    state: 'WV',
    stateName: 'West Virginia',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-01-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  WI: {
    state: 'WI',
    stateName: 'Wisconsin',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-10-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
  WY: {
    state: 'WY',
    stateName: 'Wyoming',
    salesThreshold: 100000,
    transactionThreshold: 200,
    operator: 'OR',
    effectiveDate: '2019-02-01',
    isTaxHoliday: false,
    isOriginBased: false,
  },
};

/**
 * Helper function to get threshold info for a state
 */
export function getStateThreshold(stateCode: string): StateNexusThreshold | null {
  return US_STATE_THRESHOLDS[stateCode.toUpperCase()] || null;
}

/**
 * Get all states with economic nexus laws
 */
export function getStatesWithNexusLaws(): StateNexusThreshold[] {
  return Object.values(US_STATE_THRESHOLDS).filter(
    state => state.salesThreshold !== null || state.transactionThreshold !== null,
  );
}

/**
 * Get states without sales tax
 */
export function getStatesWithoutSalesTax(): StateNexusThreshold[] {
  return Object.values(US_STATE_THRESHOLDS).filter(
    state => state.salesThreshold === null && state.transactionThreshold === null,
  );
}

/**
 * Check if a state is approaching economic nexus threshold
 * @param stateCode Two-letter state code
 * @param currentSales Current year-to-date sales
 * @param currentTransactions Current year-to-date transaction count
 * @param warningPercent Percentage of threshold to trigger warning (default 80%)
 */
export function isApproachingThreshold(
  stateCode: string,
  currentSales: number,
  currentTransactions: number,
  warningPercent: number = 0.8,
): {
  isApproaching: boolean;
  exceedsThreshold: boolean;
  salesPercent: number | null;
  transactionsPercent: number | null;
  message: string;
} {
  const threshold = getStateThreshold(stateCode);

  if (!threshold || (threshold.salesThreshold === null && threshold.transactionThreshold === null)) {
    return {
      isApproaching: false,
      exceedsThreshold: false,
      salesPercent: null,
      transactionsPercent: null,
      message: 'No economic nexus threshold for this state',
    };
  }

  const salesPercent = threshold.salesThreshold
    ? currentSales / threshold.salesThreshold
    : null;

  const transactionsPercent = threshold.transactionThreshold
    ? currentTransactions / threshold.transactionThreshold
    : null;

  let exceedsThreshold = false;
  let isApproaching = false;

  if (threshold.operator === 'OR') {
    // Either threshold exceeds
    exceedsThreshold =
      (salesPercent !== null && salesPercent >= 1.0) ||
      (transactionsPercent !== null && transactionsPercent >= 1.0);

    // Either threshold approaching
    isApproaching =
      (salesPercent !== null && salesPercent >= warningPercent) ||
      (transactionsPercent !== null && transactionsPercent >= warningPercent);
  } else {
    // Both thresholds must exceed (AND)
    exceedsThreshold =
      (salesPercent !== null && salesPercent >= 1.0) &&
      (transactionsPercent !== null && transactionsPercent >= 1.0);

    // Both thresholds approaching
    isApproaching =
      (salesPercent !== null && salesPercent >= warningPercent) &&
      (transactionsPercent !== null && transactionsPercent >= warningPercent);
  }

  let message = '';
  if (exceedsThreshold) {
    message = `Economic nexus threshold exceeded in ${threshold.stateName}`;
  } else if (isApproaching) {
    message = `Approaching economic nexus threshold in ${threshold.stateName} (${Math.round(warningPercent * 100)}%)`;
  }

  return {
    isApproaching,
    exceedsThreshold,
    salesPercent,
    transactionsPercent,
    message,
  };
}
