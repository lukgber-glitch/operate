/**
 * ComplyAdvantage API Types
 * For AML (Anti-Money Laundering) screening and compliance
 */

/**
 * Search type for AML screening
 */
export enum SearchType {
  PERSON = 'person',
  COMPANY = 'company',
}

/**
 * Match types in screening results
 */
export enum MatchType {
  PEP = 'pep', // Politically Exposed Person
  SANCTION = 'sanction',
  WATCHLIST = 'watchlist',
  ADVERSE_MEDIA = 'adverse_media',
}

/**
 * Risk levels
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Screening status
 */
export enum ScreeningStatus {
  CLEAR = 'clear', // No matches found
  POTENTIAL_MATCH = 'potential_match', // Possible matches found
  CONFIRMED_MATCH = 'confirmed_match', // Match confirmed after review
  PENDING_REVIEW = 'pending_review', // Awaiting manual review
}

/**
 * Alert status
 */
export enum AlertStatus {
  OPEN = 'open',
  REVIEWED = 'reviewed',
  ESCALATED = 'escalated',
  DISMISSED = 'dismissed',
  CONFIRMED = 'confirmed',
}

/**
 * Monitoring frequency
 */
export enum MonitoringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Source lists for sanctions and watchlists
 */
export enum SourceList {
  UN = 'UN', // United Nations
  OFAC = 'OFAC', // US Office of Foreign Assets Control
  EU = 'EU', // European Union
  UK_HMT = 'UK-HMT', // UK Her Majesty's Treasury
  INTERPOL = 'INTERPOL',
  FBI = 'FBI',
  FATF = 'FATF', // Financial Action Task Force
}

/**
 * ComplyAdvantage API Configuration
 */
export interface ComplyAdvantageConfig {
  apiKey: string;
  apiUrl: string;
  webhookSecret?: string;
  environment: 'production' | 'sandbox';
  mockMode: boolean;
  timeout?: number;
}

/**
 * Search request payload
 */
export interface SearchRequest {
  search_term: string;
  search_type: SearchType;
  filters?: {
    types?: MatchType[];
    birth_year?: number;
    country_codes?: string[];
    remove_deceased?: boolean;
  };
  exact_match?: boolean;
  fuzziness?: number; // 0.0 to 1.0
  client_ref?: string;
}

/**
 * Search response from ComplyAdvantage API
 */
export interface SearchResponse {
  id: string;
  ref: string;
  searcher_id: string;
  search_term: string;
  filters: Record<string, any>;
  match_status: 'no_match' | 'potential_match' | 'false_positive' | 'true_positive';
  total_hits: number;
  data: {
    hits: ScreeningHit[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Individual screening hit/match
 */
export interface ScreeningHit {
  id: string;
  match_types: MatchType[];
  match_status: string;
  score: number; // Match confidence 0-100
  entity: {
    id: string;
    name: string;
    aliases?: string[];
    date_of_birth?: string;
    countries_of_residence?: string[];
    countries_of_nationality?: string[];
  };
  sources: ScreeningSource[];
  fields: Record<string, any>[];
}

/**
 * Screening source (sanctions list, watchlist, etc.)
 */
export interface ScreeningSource {
  name: string;
  types: MatchType[];
  aml_types: string[];
  listing_started_utc?: string;
  listing_ended_utc?: string;
  url?: string;
  keyword?: string;
}

/**
 * Monitoring request
 */
export interface MonitoringRequest {
  search_id: string;
  frequency: MonitoringFrequency;
}

/**
 * Monitoring response
 */
export interface MonitoringResponse {
  id: string;
  search_id: string;
  status: 'active' | 'inactive';
  frequency: MonitoringFrequency;
  created_at: string;
  updated_at: string;
}

/**
 * Webhook payload for screening updates
 */
export interface WebhookPayload {
  event_type: 'search_updated' | 'monitoring_match' | 'new_source_added';
  search_id: string;
  monitoring_id?: string;
  created_at: string;
  data: {
    new_hits?: ScreeningHit[];
    updated_hits?: ScreeningHit[];
    removed_hits?: string[];
  };
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * API Error from ComplyAdvantage
 */
export interface ComplyAdvantageApiError {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  action: 'search_created' | 'monitoring_started' | 'alert_reviewed' | 'webhook_received';
  userId?: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
