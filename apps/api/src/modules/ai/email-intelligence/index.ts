/**
 * Email Intelligence Module Exports
 */

export * from './email-classifier.service';
export * from './entity-extractor.service';
export * from './relationship-tracker.service';
export * from './email-aggregator.service';
export * from './bill-creator.service';
export * from './email-intelligence.module';

// Export types separately to avoid conflicts
export type {
  EmailClassification,
  EmailPriority,
  SuggestedAction,
  ClassificationResult,
  ClassificationResultWithId,
  ClassificationOptions,
} from './types/email-classification.types';

export type {
  CompanyRole,
  ExtractedCompany,
  ExtractedContact,
  ExtractedAmount,
  ExtractedDate,
  ExtractedAddress,
  ExtractedEntities,
  EmailSignature,
  EmailInput as EntityEmailInput, // Rename to avoid conflict
  AIEntityExtractionResponse,
} from './types/extracted-entities.types';

export type {
  RelationshipMetrics,
  CommunicationFrequency,
  CommunicationTrend,
  PaymentBehavior,
  HealthStatus,
  AlertPriority,
  RelationshipAlert,
  AtRiskRelationship,
  RelationshipSummary,
  EmailMessage as RelationshipEmailMessage, // Rename to avoid conflict
} from './types/relationship-metrics.types';

export type {
  CompanyAggregation,
  EmailContact,
  ImportResult,
  ImportError,
  AggregationSummary,
  AggregationOptions,
} from './types/aggregation.types';

export * from './prompts/classification-prompt';
export * from './prompts/extraction-prompt';
export * from './parsers/signature-parser';
