/**
 * Relationship Metrics Types
 * Track customer/vendor relationship health based on email patterns
 */

export interface EmailMessage {
  subject: string;
  body: string;
  from: string;
  to: string;
  cc?: string[];
  date?: Date;
}

/**
 * Communication frequency classification
 */
export enum CommunicationFrequency {
  DAILY = 'DAILY', // Multiple emails per day
  WEEKLY = 'WEEKLY', // Several emails per week
  MONTHLY = 'MONTHLY', // A few emails per month
  SPORADIC = 'SPORADIC', // Infrequent, irregular contact
  DORMANT = 'DORMANT', // No recent contact (90+ days)
}

/**
 * Communication trend over time
 */
export enum CommunicationTrend {
  INCREASING = 'INCREASING', // More frequent communication
  STABLE = 'STABLE', // Consistent pattern
  DECREASING = 'DECREASING', // Less frequent communication
}

/**
 * Payment behavior classification (for customers)
 */
export enum PaymentBehavior {
  EARLY = 'EARLY', // Pays before due date
  ON_TIME = 'ON_TIME', // Pays within 5 days of due date
  LATE = 'LATE', // Pays 6-30 days after due date
  VERY_LATE = 'VERY_LATE', // Pays 30+ days after due date
  UNKNOWN = 'UNKNOWN', // No payment data available
}

/**
 * Relationship health status
 */
export enum HealthStatus {
  EXCELLENT = 'EXCELLENT', // 80-100 score
  GOOD = 'GOOD', // 60-79 score
  NEEDS_ATTENTION = 'NEEDS_ATTENTION', // 40-59 score
  AT_RISK = 'AT_RISK', // 20-39 score
  DORMANT = 'DORMANT', // 0-19 score OR 90+ days no contact
}

/**
 * Alert priority levels
 */
export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Relationship alert
 */
export interface RelationshipAlert {
  type: string; // e.g., 'DORMANT_RELATIONSHIP', 'DECREASING_ENGAGEMENT', 'LATE_PAYMENT_PATTERN'
  message: string;
  priority: AlertPriority;
}

/**
 * Complete relationship metrics for a customer or vendor
 */
export interface RelationshipMetrics {
  // Communication metrics
  totalEmails: number;
  emailsSent: number; // Emails we sent to them
  emailsReceived: number; // Emails we received from them
  avgResponseTime: number; // Average response time in hours
  lastContactDate: Date;
  daysSinceLastContact: number;

  // Engagement patterns
  communicationFrequency: CommunicationFrequency;
  trend: CommunicationTrend;

  // Financial metrics (for customers only)
  totalInvoiced?: number;
  totalPaid?: number;
  avgPaymentDays?: number; // Average days to pay invoices
  paymentBehavior?: PaymentBehavior;

  // Health assessment
  healthScore: number; // 0-100
  healthStatus: HealthStatus;

  // Alerts and warnings
  alerts: RelationshipAlert[];

  // Metadata
  lastCalculated: Date;
}

/**
 * At-risk relationship with suggested action
 */
export interface AtRiskRelationship {
  entityId: string;
  entityType: 'CUSTOMER' | 'VENDOR';
  entityName: string;
  metrics: RelationshipMetrics;
  suggestedAction: string;
}

/**
 * Summary of all relationships in an organization
 */
export interface RelationshipSummary {
  excellent: number;
  good: number;
  needsAttention: number;
  atRisk: number;
  dormant: number;
  totalRelationships: number;
}

/**
 * Communication statistics for trend calculation
 */
export interface CommunicationStats {
  period: 'LAST_30_DAYS' | 'PREVIOUS_30_DAYS' | 'LAST_90_DAYS';
  emailCount: number;
  startDate: Date;
  endDate: Date;
}
