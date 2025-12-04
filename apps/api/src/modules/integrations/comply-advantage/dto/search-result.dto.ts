import { RiskLevel, ScreeningStatus } from '../types/comply-advantage.types';

/**
 * DTO for screening search results
 */
export class SearchResultDto {
  id: string;
  searchId: string;
  entityType: string;
  entityName: string;
  dateOfBirth?: Date;
  countryCode?: string;
  userId?: string;
  organizationId: string;
  riskLevel: RiskLevel;
  matchCount: number;
  status: ScreeningStatus;
  lastScreenedAt: Date;
  nextReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  alerts?: AlertDto[];
}

/**
 * DTO for AML alert
 */
export class AlertDto {
  id: string;
  screeningId: string;
  alertType: string;
  matchName: string;
  matchScore: number;
  sourceList: string;
  sourceUrl?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
