/**
 * Organization-related types for the Operate platform
 */

export interface OrganizationBasic {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface OrganizationSettings {
  dateFormat?: string;
  numberFormat?: string;
  fiscalYearStart?: string;
  [key: string]: any;
}
