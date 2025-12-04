/**
 * Indian State Codes for GSTIN Validation
 *
 * @description
 * Mapping of GST state codes to Indian states and union territories.
 * State codes 01-38 are used in the first two digits of GSTIN.
 *
 * @see https://www.gst.gov.in/
 */

export interface StateCodeInfo {
  code: string;
  name: string;
  stateType: 'STATE' | 'UNION_TERRITORY';
  active: boolean;
}

/**
 * Comprehensive mapping of all Indian state and UT codes
 */
export const STATE_CODES: Record<string, StateCodeInfo> = {
  '01': { code: '01', name: 'Jammu and Kashmir', stateType: 'UNION_TERRITORY', active: true },
  '02': { code: '02', name: 'Himachal Pradesh', stateType: 'STATE', active: true },
  '03': { code: '03', name: 'Punjab', stateType: 'STATE', active: true },
  '04': { code: '04', name: 'Chandigarh', stateType: 'UNION_TERRITORY', active: true },
  '05': { code: '05', name: 'Uttarakhand', stateType: 'STATE', active: true },
  '06': { code: '06', name: 'Haryana', stateType: 'STATE', active: true },
  '07': { code: '07', name: 'Delhi', stateType: 'UNION_TERRITORY', active: true },
  '08': { code: '08', name: 'Rajasthan', stateType: 'STATE', active: true },
  '09': { code: '09', name: 'Uttar Pradesh', stateType: 'STATE', active: true },
  '10': { code: '10', name: 'Bihar', stateType: 'STATE', active: true },
  '11': { code: '11', name: 'Sikkim', stateType: 'STATE', active: true },
  '12': { code: '12', name: 'Arunachal Pradesh', stateType: 'STATE', active: true },
  '13': { code: '13', name: 'Nagaland', stateType: 'STATE', active: true },
  '14': { code: '14', name: 'Manipur', stateType: 'STATE', active: true },
  '15': { code: '15', name: 'Mizoram', stateType: 'STATE', active: true },
  '16': { code: '16', name: 'Tripura', stateType: 'STATE', active: true },
  '17': { code: '17', name: 'Meghalaya', stateType: 'STATE', active: true },
  '18': { code: '18', name: 'Assam', stateType: 'STATE', active: true },
  '19': { code: '19', name: 'West Bengal', stateType: 'STATE', active: true },
  '20': { code: '20', name: 'Jharkhand', stateType: 'STATE', active: true },
  '21': { code: '21', name: 'Odisha', stateType: 'STATE', active: true },
  '22': { code: '22', name: 'Chhattisgarh', stateType: 'STATE', active: true },
  '23': { code: '23', name: 'Madhya Pradesh', stateType: 'STATE', active: true },
  '24': { code: '24', name: 'Gujarat', stateType: 'STATE', active: true },
  '25': { code: '25', name: 'Daman and Diu', stateType: 'UNION_TERRITORY', active: true },
  '26': { code: '26', name: 'Dadra and Nagar Haveli', stateType: 'UNION_TERRITORY', active: true },
  '27': { code: '27', name: 'Maharashtra', stateType: 'STATE', active: true },
  '28': { code: '28', name: 'Andhra Pradesh (Old)', stateType: 'STATE', active: false }, // Pre-bifurcation
  '29': { code: '29', name: 'Karnataka', stateType: 'STATE', active: true },
  '30': { code: '30', name: 'Goa', stateType: 'STATE', active: true },
  '31': { code: '31', name: 'Lakshadweep', stateType: 'UNION_TERRITORY', active: true },
  '32': { code: '32', name: 'Kerala', stateType: 'STATE', active: true },
  '33': { code: '33', name: 'Tamil Nadu', stateType: 'STATE', active: true },
  '34': { code: '34', name: 'Puducherry', stateType: 'UNION_TERRITORY', active: true },
  '35': { code: '35', name: 'Andaman and Nicobar Islands', stateType: 'UNION_TERRITORY', active: true },
  '36': { code: '36', name: 'Telangana', stateType: 'STATE', active: true },
  '37': { code: '37', name: 'Andhra Pradesh', stateType: 'STATE', active: true },
  '38': { code: '38', name: 'Ladakh', stateType: 'UNION_TERRITORY', active: true },
  '97': { code: '97', name: 'Other Territory', stateType: 'UNION_TERRITORY', active: true },
  '99': { code: '99', name: 'Centre Jurisdiction', stateType: 'UNION_TERRITORY', active: true },
};

/**
 * Validate if a state code is valid and active
 *
 * @param code - Two-digit state code
 * @returns True if code is valid and active
 */
export function isValidStateCode(code: string): boolean {
  const stateInfo = STATE_CODES[code];
  return stateInfo !== undefined && stateInfo.active;
}

/**
 * Get state name from code
 *
 * @param code - Two-digit state code
 * @returns State name or null if invalid
 */
export function getStateName(code: string): string | null {
  const stateInfo = STATE_CODES[code];
  return stateInfo?.active ? stateInfo.name : null;
}

/**
 * Get all valid state codes
 *
 * @returns Array of valid state codes
 */
export function getValidStateCodes(): string[] {
  return Object.keys(STATE_CODES).filter(code => STATE_CODES[code]?.active);
}

/**
 * Get state info by code
 *
 * @param code - Two-digit state code
 * @returns State info or null if invalid
 */
export function getStateInfo(code: string): StateCodeInfo | null {
  const stateInfo = STATE_CODES[code];
  return stateInfo?.active ? stateInfo : null;
}
