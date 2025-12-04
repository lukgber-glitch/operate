/**
 * Indian States and Union Territories Configuration
 * Task: W29-T4 - India GST configuration
 *
 * All 28 states and 8 Union Territories with GST state codes (01-38)
 */

export interface IndianState {
  code: string; // GST state code (01-38)
  name: string;
  capital: string;
  type: 'STATE' | 'UNION_TERRITORY';
  region: string;
  languages: string[];
  registrationThreshold?: {
    goods: number;
    services: number;
  };
}

/**
 * Geographic Regions of India
 */
export const INDIA_REGIONS = {
  NORTH: 'North India',
  SOUTH: 'South India',
  EAST: 'East India',
  WEST: 'West India',
  CENTRAL: 'Central India',
  NORTHEAST: 'Northeast India',
} as const;

/**
 * All 28 States of India
 * GST State Codes: 01-38 (some codes reserved/unused)
 */
export const INDIA_STATES: readonly IndianState[] = [
  // Jammu and Kashmir - 01
  {
    code: '01',
    name: 'Jammu and Kashmir',
    capital: 'Srinagar (Summer), Jammu (Winter)',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.NORTH,
    languages: ['Urdu', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Himachal Pradesh - 02
  {
    code: '02',
    name: 'Himachal Pradesh',
    capital: 'Shimla (Summer), Dharamshala (Winter)',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'English', 'Punjabi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Punjab - 03
  {
    code: '03',
    name: 'Punjab',
    capital: 'Chandigarh',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Punjabi', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Chandigarh - 04
  {
    code: '04',
    name: 'Chandigarh',
    capital: 'Chandigarh',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'Punjabi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Uttarakhand - 05
  {
    code: '05',
    name: 'Uttarakhand',
    capital: 'Dehradun (Winter), Gairsain (Summer)',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'English'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Haryana - 06
  {
    code: '06',
    name: 'Haryana',
    capital: 'Chandigarh',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'Punjabi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Delhi - 07
  {
    code: '07',
    name: 'Delhi',
    capital: 'New Delhi',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'English', 'Punjabi', 'Urdu'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Rajasthan - 08
  {
    code: '08',
    name: 'Rajasthan',
    capital: 'Jaipur',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Uttar Pradesh - 09
  {
    code: '09',
    name: 'Uttar Pradesh',
    capital: 'Lucknow',
    type: 'STATE',
    region: INDIA_REGIONS.NORTH,
    languages: ['Hindi', 'Urdu', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Bihar - 10
  {
    code: '10',
    name: 'Bihar',
    capital: 'Patna',
    type: 'STATE',
    region: INDIA_REGIONS.EAST,
    languages: ['Hindi', 'Urdu', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Sikkim - 11
  {
    code: '11',
    name: 'Sikkim',
    capital: 'Gangtok',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['Nepali', 'English', 'Hindi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Arunachal Pradesh - 12
  {
    code: '12',
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['English', 'Hindi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Nagaland - 13
  {
    code: '13',
    name: 'Nagaland',
    capital: 'Kohima',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['English', 'Hindi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Manipur - 14
  {
    code: '14',
    name: 'Manipur',
    capital: 'Imphal',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['Meitei', 'English', 'Hindi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Mizoram - 15
  {
    code: '15',
    name: 'Mizoram',
    capital: 'Aizawl',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['Mizo', 'English', 'Hindi'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Tripura - 16
  {
    code: '16',
    name: 'Tripura',
    capital: 'Agartala',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['Bengali', 'English', 'Kokborok'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Meghalaya - 17
  {
    code: '17',
    name: 'Meghalaya',
    capital: 'Shillong',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['English', 'Khasi', 'Garo'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // Assam - 18
  {
    code: '18',
    name: 'Assam',
    capital: 'Dispur',
    type: 'STATE',
    region: INDIA_REGIONS.NORTHEAST,
    languages: ['Assamese', 'Bengali', 'English'],
    registrationThreshold: {
      goods: 2_000_000, // Special category state
      services: 1_000_000,
    },
  },

  // West Bengal - 19
  {
    code: '19',
    name: 'West Bengal',
    capital: 'Kolkata',
    type: 'STATE',
    region: INDIA_REGIONS.EAST,
    languages: ['Bengali', 'English', 'Hindi', 'Urdu'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Jharkhand - 20
  {
    code: '20',
    name: 'Jharkhand',
    capital: 'Ranchi',
    type: 'STATE',
    region: INDIA_REGIONS.EAST,
    languages: ['Hindi', 'English', 'Santali'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Odisha - 21
  {
    code: '21',
    name: 'Odisha',
    capital: 'Bhubaneswar',
    type: 'STATE',
    region: INDIA_REGIONS.EAST,
    languages: ['Odia', 'English', 'Hindi'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Chhattisgarh - 22
  {
    code: '22',
    name: 'Chhattisgarh',
    capital: 'Raipur',
    type: 'STATE',
    region: INDIA_REGIONS.CENTRAL,
    languages: ['Hindi', 'Chhattisgarhi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Madhya Pradesh - 23
  {
    code: '23',
    name: 'Madhya Pradesh',
    capital: 'Bhopal',
    type: 'STATE',
    region: INDIA_REGIONS.CENTRAL,
    languages: ['Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Gujarat - 24
  {
    code: '24',
    name: 'Gujarat',
    capital: 'Gandhinagar',
    type: 'STATE',
    region: INDIA_REGIONS.WEST,
    languages: ['Gujarati', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Daman and Diu (now merged with Dadra and Nagar Haveli) - 25
  {
    code: '25',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    capital: 'Daman',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.WEST,
    languages: ['Gujarati', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Dadra and Nagar Haveli - 26 (merged into 25)
  // Code 26 is now used for Dadra and Nagar Haveli and Daman and Diu (after merger)

  // Maharashtra - 27
  {
    code: '27',
    name: 'Maharashtra',
    capital: 'Mumbai',
    type: 'STATE',
    region: INDIA_REGIONS.WEST,
    languages: ['Marathi', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Andhra Pradesh (before bifurcation) - 28
  // Karnataka - 29
  {
    code: '29',
    name: 'Karnataka',
    capital: 'Bengaluru',
    type: 'STATE',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Kannada', 'English', 'Hindi'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Goa - 30
  {
    code: '30',
    name: 'Goa',
    capital: 'Panaji',
    type: 'STATE',
    region: INDIA_REGIONS.WEST,
    languages: ['Konkani', 'Marathi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Lakshadweep - 31
  {
    code: '31',
    name: 'Lakshadweep',
    capital: 'Kavaratti',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Malayalam', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Kerala - 32
  {
    code: '32',
    name: 'Kerala',
    capital: 'Thiruvananthapuram',
    type: 'STATE',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Malayalam', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Tamil Nadu - 33
  {
    code: '33',
    name: 'Tamil Nadu',
    capital: 'Chennai',
    type: 'STATE',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Tamil', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Puducherry - 34
  {
    code: '34',
    name: 'Puducherry',
    capital: 'Puducherry',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Tamil', 'English', 'French'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Andaman and Nicobar Islands - 35
  {
    code: '35',
    name: 'Andaman and Nicobar Islands',
    capital: 'Port Blair',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Hindi', 'English', 'Bengali', 'Tamil'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Telangana - 36
  {
    code: '36',
    name: 'Telangana',
    capital: 'Hyderabad',
    type: 'STATE',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Telugu', 'Urdu', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Andhra Pradesh (after bifurcation) - 37
  {
    code: '37',
    name: 'Andhra Pradesh',
    capital: 'Amaravati',
    type: 'STATE',
    region: INDIA_REGIONS.SOUTH,
    languages: ['Telugu', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Ladakh - 38
  {
    code: '38',
    name: 'Ladakh',
    capital: 'Leh (Summer), Kargil (Winter)',
    type: 'UNION_TERRITORY',
    region: INDIA_REGIONS.NORTH,
    languages: ['Ladakhi', 'Hindi', 'English'],
    registrationThreshold: {
      goods: 4_000_000,
      services: 2_000_000,
    },
  },

  // Code 97 - Other Territory (for special cases)
  // Code 99 - Centre Jurisdiction (for central government)
] as const;

/**
 * Special Category States
 * Lower GST registration thresholds
 */
export const INDIA_SPECIAL_CATEGORY_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
  'Himachal Pradesh',
  'Uttarakhand',
] as const;

/**
 * Union Territories
 */
export const INDIA_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

/**
 * State Code Lookup
 */
export const INDIA_STATE_LOOKUP = {
  byCode: (code: string): IndianState | undefined => {
    return INDIA_STATES.find(s => s.code === code);
  },

  byName: (name: string): IndianState | undefined => {
    return INDIA_STATES.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
  },

  byRegion: (region: string): IndianState[] => {
    return INDIA_STATES.filter(s => s.region === region);
  },

  getStates: (): IndianState[] => {
    return INDIA_STATES.filter(s => s.type === 'STATE');
  },

  getUTs: (): IndianState[] => {
    return INDIA_STATES.filter(s => s.type === 'UNION_TERRITORY');
  },

  getSpecialCategory: (): IndianState[] => {
    return INDIA_STATES.filter(s =>
      INDIA_SPECIAL_CATEGORY_STATES.includes(s.name as any)
    );
  },

  getAll: (): readonly IndianState[] => {
    return INDIA_STATES;
  },
} as const;

/**
 * GST State Codes - Quick Reference
 */
export const INDIA_GST_STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Dadra and Nagar Haveli and Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu', // After merger
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
} as const;

/**
 * Major Cities by State
 * For business registration and tax office purposes
 */
export const INDIA_MAJOR_CITIES = {
  '07': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini'], // Delhi
  '27': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'], // Maharashtra
  '29': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'], // Karnataka
  '33': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'], // Tamil Nadu
  '36': ['Hyderabad', 'Warangal', 'Nizamabad'], // Telangana
  '24': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'], // Gujarat
  '19': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'], // West Bengal
  '32': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'], // Kerala
  '09': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad'], // UP
  '03': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'], // Punjab
  '08': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'], // Rajasthan
  '23': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'], // Madhya Pradesh
  '06': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala'], // Haryana
  '10': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'], // Bihar
  '37': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'], // Andhra Pradesh
  '21': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'], // Odisha
  '22': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'], // Chhattisgarh
  '20': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'], // Jharkhand
  '18': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'], // Assam
  '30': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'], // Goa
  '04': ['Chandigarh'], // Chandigarh
  '34': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'], // Puducherry
} as const;

/**
 * State-wise Tax Administration
 */
export const INDIA_STATE_TAX_DEPARTMENTS = {
  departmentName: (stateCode: string): string => {
    const stateName = INDIA_GST_STATE_CODES[stateCode as keyof typeof INDIA_GST_STATE_CODES];
    return `${stateName} State GST Department`;
  },

  /**
   * Common department structure across states
   */
  structure: {
    commissioner: 'State GST Commissioner',
    additionalCommissioner: 'Additional Commissioner',
    jointCommissioner: 'Joint Commissioner',
    deputyCommissioner: 'Deputy Commissioner',
    assistantCommissioner: 'Assistant Commissioner',
    stateGSTOfficer: 'State GST Officer',
  },
} as const;
