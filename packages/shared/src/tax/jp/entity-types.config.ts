/**
 * Japanese Business Entity Types (法人格 - Hōjinkaku)
 * Corporate forms and business structures in Japan
 * Task: W27-T4 - Japanese tax configuration
 */

export interface EntityType {
  code: string;
  name: string;
  nameJapanese: string;
  abbreviation?: string;
  abbreviationJapanese?: string;
  description: string;
  characteristics: string[];
  minimumCapital?: number;
  minimumShareholders?: number;
  liabilityType: 'Limited' | 'Unlimited' | 'Mixed';
  taxTreatment: string;
  commonUse: string;
}

/**
 * Japanese Corporate Entity Types
 */
export const JAPAN_ENTITY_TYPES: readonly EntityType[] = [
  {
    code: 'KK',
    name: 'Kabushiki Kaisha',
    nameJapanese: '株式会社',
    abbreviation: 'K.K.',
    abbreviationJapanese: '株',
    description: 'Stock Company (equivalent to Corporation/Limited Company)',
    characteristics: [
      'Most common corporate form for medium to large businesses',
      'Shares can be publicly traded',
      'Limited liability for shareholders',
      'Flexible capital structure',
      'Suitable for raising capital',
    ],
    minimumCapital: 1, // ¥1 minimum (practically ¥5-10 million common)
    minimumShareholders: 1,
    liabilityType: 'Limited',
    taxTreatment: 'Corporate tax rate applies (approximately 23.2% for large corporations)',
    commonUse: 'Large and medium-sized businesses, publicly traded companies',
  },
  {
    code: 'GK',
    name: 'Godo Kaisha',
    nameJapanese: '合同会社',
    abbreviation: 'G.K.',
    abbreviationJapanese: '合',
    description: 'Limited Liability Company (similar to US LLC)',
    characteristics: [
      'Simpler structure than K.K.',
      'Limited liability for all members',
      'More flexible management structure',
      'Lower setup and maintenance costs',
      'Cannot be publicly traded',
      'Popular for subsidiaries of foreign companies',
    ],
    minimumCapital: 1, // ¥1 minimum
    minimumShareholders: 1,
    liabilityType: 'Limited',
    taxTreatment: 'Corporate tax rate applies (same as K.K.)',
    commonUse: 'Small to medium businesses, foreign subsidiaries (e.g., Apple Japan G.K., Amazon Japan G.K.)',
  },
  {
    code: 'YK',
    name: 'Yugen Kaisha',
    nameJapanese: '有限会社',
    abbreviation: 'Y.K.',
    abbreviationJapanese: '有',
    description: 'Limited Company (legacy entity, no longer establishable)',
    characteristics: [
      'Abolished in 2006, existing entities grandfathered',
      'Treated as K.K. under current law',
      'Limited liability',
      'Maximum 50 shareholders',
      'No new Y.K. can be formed',
    ],
    minimumCapital: 3_000_000, // ¥3 million (legacy requirement)
    minimumShareholders: 1,
    liabilityType: 'Limited',
    taxTreatment: 'Treated as K.K. for tax purposes',
    commonUse: 'Legacy entity (grandfathered from pre-2006)',
  },
  {
    code: 'GS',
    name: 'Gomei Kaisha',
    nameJapanese: '合名会社',
    abbreviation: 'G.S.',
    description: 'General Partnership Company',
    characteristics: [
      'All partners have unlimited liability',
      'Rare in modern business',
      'Partners personally liable for company debts',
      'Simple management structure',
    ],
    minimumCapital: 0,
    minimumShareholders: 2,
    liabilityType: 'Unlimited',
    taxTreatment: 'Corporate tax applies',
    commonUse: 'Very rare, mostly legacy entities',
  },
  {
    code: 'GH',
    name: 'Goshi Kaisha',
    nameJapanese: '合資会社',
    abbreviation: 'G.H.',
    description: 'Limited Partnership Company',
    characteristics: [
      'Mix of limited and unlimited liability partners',
      'At least one general partner (unlimited liability)',
      'At least one limited partner (limited liability)',
      'Uncommon in modern business',
    ],
    minimumCapital: 0,
    minimumShareholders: 2,
    liabilityType: 'Mixed',
    taxTreatment: 'Corporate tax applies',
    commonUse: 'Rare, mostly legacy entities',
  },
  {
    code: 'IE',
    name: 'Individual Enterprise',
    nameJapanese: '個人事業主',
    abbreviation: 'IE',
    abbreviationJapanese: '個',
    description: 'Sole Proprietorship',
    characteristics: [
      'Simplest business structure',
      'Owner personally liable',
      'No separate legal entity',
      'Easiest to establish',
      'Most common for small businesses and freelancers',
    ],
    minimumCapital: 0,
    minimumShareholders: 1,
    liabilityType: 'Unlimited',
    taxTreatment: 'Individual income tax (progressive rates 5%-45%)',
    commonUse: 'Freelancers, consultants, small shops, self-employed',
  },
  {
    code: 'NPO',
    name: 'Non-Profit Organization',
    nameJapanese: '特定非営利活動法人',
    abbreviation: 'NPO',
    abbreviationJapanese: 'NPO',
    description: 'Specified Non-Profit Corporation',
    characteristics: [
      'Non-profit legal entity',
      'Must serve public interest',
      'Tax benefits available',
      'Cannot distribute profits to members',
      'Requires government approval',
    ],
    minimumCapital: 0,
    minimumShareholders: 10, // Minimum 10 members
    liabilityType: 'Limited',
    taxTreatment: 'Exempt from corporate tax on non-profit activities',
    commonUse: 'Charities, community organizations, advocacy groups',
  },
  {
    code: 'SO',
    name: 'Shinan Hojin',
    nameJapanese: '一般社団法人',
    description: 'General Incorporated Association',
    characteristics: [
      'Can be for-profit or non-profit',
      'No capital required',
      'Limited liability',
      'Flexible structure',
    ],
    minimumCapital: 0,
    minimumShareholders: 2,
    liabilityType: 'Limited',
    taxTreatment: 'Corporate tax applies unless qualified as non-profit',
    commonUse: 'Professional associations, industry groups, foundations',
  },
  {
    code: 'ZF',
    name: 'Zaidan Hojin',
    nameJapanese: '一般財団法人',
    description: 'General Incorporated Foundation',
    characteristics: [
      'Asset-based organization',
      'Requires minimum endowment',
      'No members, only board',
      'Often used for charitable purposes',
    ],
    minimumCapital: 3_000_000, // ¥3 million endowment
    minimumShareholders: 0, // No members required
    liabilityType: 'Limited',
    taxTreatment: 'Corporate tax applies unless qualified as public interest',
    commonUse: 'Foundations, endowments, charitable organizations',
  },
  {
    code: 'KY',
    name: 'Kyodo Kumiai',
    nameJapanese: '協同組合',
    description: 'Cooperative',
    characteristics: [
      'Member-owned organization',
      'Democratic control (one member, one vote)',
      'Serves members\' common interests',
      'Various types (agricultural, consumer, credit, etc.)',
    ],
    minimumCapital: 0,
    minimumShareholders: 4, // Minimum members vary by type
    liabilityType: 'Limited',
    taxTreatment: 'Special cooperative tax rates apply',
    commonUse: 'Agricultural cooperatives, credit unions, consumer cooperatives',
  },
] as const;

/**
 * Foreign Company Structures in Japan
 */
export const JAPAN_FOREIGN_ENTITY_TYPES = {
  BRANCH: {
    code: 'BR',
    name: 'Branch Office',
    nameJapanese: '支店',
    description: 'Foreign company branch (not a separate legal entity)',
    characteristics: [
      'Not a separate legal entity',
      'Parent company directly liable',
      'Must register with Legal Affairs Bureau',
      'Can conduct business activities',
      'Simpler than establishing subsidiary',
    ],
    taxTreatment: 'Taxed on Japan-sourced income',
    commonUse: 'Foreign companies testing market, limited operations',
  },
  REP_OFFICE: {
    code: 'RO',
    name: 'Representative Office',
    nameJapanese: '駐在員事務所',
    description: 'Liaison office (cannot conduct business)',
    characteristics: [
      'Cannot conduct revenue-generating activities',
      'Limited to market research and liaison',
      'No business registration required',
      'Simplest foreign presence',
    ],
    taxTreatment: 'Generally not taxable (no business activity)',
    commonUse: 'Market research, liaison, preparatory activities',
  },
  SUBSIDIARY: {
    code: 'SUB',
    name: 'Subsidiary',
    nameJapanese: '子会社',
    description: 'Locally incorporated entity (usually G.K. or K.K.)',
    characteristics: [
      'Separate legal entity',
      'Limited liability for parent',
      'Can be K.K. or G.K.',
      'Full business capabilities',
      'Most common for serious market entry',
    ],
    taxTreatment: 'Full corporate tax on worldwide income (if tax resident)',
    commonUse: 'Foreign companies with significant Japan operations',
  },
} as const;

/**
 * Corporate Number (法人番号 - Hojin Bango)
 * 13-digit identifier for all legal entities
 */
export const JAPAN_CORPORATE_NUMBER = {
  length: 13,
  name: '法人番号',
  nameEnglish: 'Corporate Number',
  description: 'Unique 13-digit identifier for all corporations and organizations',
  format: '0000000000000', // 13 digits
  checkDigit: {
    algorithm: 'Modulus 9',
    position: 1, // First digit is check digit
  },
  authority: 'National Tax Agency',
  publicDatabase: 'https://www.houjin-bangou.nta.go.jp/',
  mandatory: true,
  assignedTo: [
    'All corporations',
    'NPOs',
    'Government agencies',
    'Local governments',
    'Other organizations required to file tax returns',
  ],
  notAssignedTo: [
    'Individual enterprises (sole proprietors)',
    'Foreign entities without Japan presence',
  ],
} as const;

/**
 * Invoice Registration Number (適格請求書発行事業者登録番号)
 * T + 13 digits for Qualified Invoice System
 */
export const JAPAN_INVOICE_REGISTRATION_NUMBER = {
  format: 'T0000000000000', // 'T' + 13 digits
  prefix: 'T',
  totalLength: 14, // 'T' + 13 digits
  corporateNumberLength: 13,
  name: '登録番号',
  nameEnglish: 'Invoice Registration Number',
  description: 'Qualified invoice issuer registration number',
  effectiveDate: '2023-10-01',
  structure: {
    prefix: 'T (fixed)',
    corporateNumber: '13-digit corporate number',
    individualPrefix: null, // Individuals get T + 13 digit number
  },
  verification: 'Can be verified on NTA public database',
  publicDatabase: 'https://www.invoice-kohyo.nta.go.jp/',
} as const;

/**
 * Common business suffixes in Japanese company names
 */
export const JAPAN_COMPANY_SUFFIXES = [
  { japanese: '株式会社', romaji: 'Kabushiki Kaisha', abbreviation: 'K.K.' },
  { japanese: '合同会社', romaji: 'Godo Kaisha', abbreviation: 'G.K.' },
  { japanese: '有限会社', romaji: 'Yugen Kaisha', abbreviation: 'Y.K.' },
  { japanese: '合資会社', romaji: 'Goshi Kaisha', abbreviation: 'G.H.' },
  { japanese: '合名会社', romaji: 'Gomei Kaisha', abbreviation: 'G.S.' },
  { japanese: '一般社団法人', romaji: 'Ippan Shadan Hojin', abbreviation: null },
  { japanese: '一般財団法人', romaji: 'Ippan Zaidan Hojin', abbreviation: null },
  { japanese: '特定非営利活動法人', romaji: 'Tokutei Hieiri Katsudo Hojin', abbreviation: 'NPO' },
] as const;

/**
 * Entity type lookup by code
 */
export const getEntityTypeByCode = (code: string): EntityType | undefined => {
  return JAPAN_ENTITY_TYPES.find(et => et.code === code);
};

/**
 * Check if entity type has limited liability
 */
export const hasLimitedLiability = (code: string): boolean => {
  const entity = getEntityTypeByCode(code);
  return entity?.liabilityType === 'Limited';
};

/**
 * Get all entity types suitable for foreign investment
 */
export const getForeignInvestmentEntities = (): EntityType[] => {
  return JAPAN_ENTITY_TYPES.filter(et =>
    et.code === 'KK' || et.code === 'GK'
  );
};
