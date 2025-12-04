/**
 * Process Documentation Types
 * Type definitions for GoBD-compliant Verfahrensdokumentation
 */

import { ProcessDocumentationStatus } from '@prisma/client';

/**
 * Complete Process Documentation Structure
 * Verfahrensdokumentation as required by GoBD §146 AO
 */
export interface ProcessDocumentation {
  id?: string;
  tenantId: string;
  version: number;
  status: ProcessDocumentationStatus;
  sections: ProcessDocumentationSections;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * All required sections of Verfahrensdokumentation
 */
export interface ProcessDocumentationSections {
  generalDescription: GeneralDescription;
  userDocumentation: UserDocumentation;
  technicalDocumentation: TechnicalDocumentation;
  operationsDocumentation: OperationsDocumentation;
  internalControls: InternalControls;
}

/**
 * Section 1: Allgemeine Beschreibung (General Description)
 * Company info and system overview
 */
export interface GeneralDescription {
  // Company information
  companyInfo: {
    name: string;
    legalForm: string;
    address: string;
    taxNumber?: string;
    vatId?: string;
    registrationNumber?: string;
    industry: string;
    employees?: number;
  };

  // System overview
  systemInfo: {
    name: string;
    version: string;
    vendor: string;
    purpose: string;
    implementationDate: Date;
    lastUpdateDate?: Date;
    operatingSystem: string;
    database: string;
  };

  // Scope of documentation
  scope: {
    coveredProcesses: string[];
    coveredDepartments: string[];
    taxRelevantData: string[];
    retentionPeriods: Record<string, number>; // Category -> years
  };
}

/**
 * Section 2: Anwenderdokumentation (User Documentation)
 * How users operate the system
 */
export interface UserDocumentation {
  // User roles and permissions
  roles: UserRole[];

  // Business processes
  processes: BusinessProcess[];

  // User workflows
  workflows: Workflow[];

  // Training materials
  training: {
    manualAvailable: boolean;
    trainingRequired: boolean;
    trainingFrequency?: string;
    lastTrainingDate?: Date;
  };
}

/**
 * User role definition
 */
export interface UserRole {
  roleName: string;
  description: string;
  responsibilities: string[];
  permissions: string[];
  requiredQualifications?: string[];
  userCount?: number;
}

/**
 * Business process description
 */
export interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  owner: string;
  steps: ProcessStep[];
  inputs: string[];
  outputs: string[];
  frequency: string;
  controls: string[];
  taxRelevance: boolean;
}

/**
 * Process step
 */
export interface ProcessStep {
  step: number;
  description: string;
  actor: string; // Role or person
  system?: string; // System component involved
  duration?: string;
  validation?: string;
  documentation?: string;
}

/**
 * User workflow
 */
export interface Workflow {
  name: string;
  description: string;
  triggerEvent: string;
  steps: string[];
  expectedOutcome: string;
  errorHandling: string;
}

/**
 * Section 3: Technische Systemdokumentation (Technical Documentation)
 * Architecture, data flow, and technical specifications
 */
export interface TechnicalDocumentation {
  // System architecture
  architecture: {
    overview: string;
    components: SystemComponent[];
    infrastructure: string;
    hosting: string;
    scalability: string;
  };

  // Data flow
  dataFlow: {
    description: string;
    diagrams?: string[]; // Mermaid syntax or URLs
    inputSources: string[];
    outputDestinations: string[];
    dataTransformations: string[];
  };

  // Interfaces
  interfaces: SystemInterface[];

  // Data structure
  dataStructure: {
    databaseSchema: string;
    keyTables: string[];
    dataRetention: string;
    archiveFormat: string;
  };

  // Security
  security: {
    encryption: {
      atRest: boolean;
      inTransit: boolean;
      algorithm: string;
    };
    authentication: {
      method: string;
      mfaEnabled: boolean;
      sessionManagement: string;
    };
    authorization: {
      model: string; // RBAC, ABAC, etc.
      accessControl: string;
    };
    auditLogging: {
      enabled: boolean;
      immutability: boolean;
      hashChain: boolean;
      retention: number; // years
    };
  };
}

/**
 * System component
 */
export interface SystemComponent {
  name: string;
  type: string; // API, Frontend, Database, Worker, etc.
  description: string;
  technology: string;
  version: string;
  dependencies?: string[];
}

/**
 * System interface
 */
export interface SystemInterface {
  name: string;
  type: string; // REST API, WebSocket, File Import, etc.
  description: string;
  protocol: string;
  dataFormat: string;
  authentication: string;
  rateLimit?: string;
}

/**
 * Section 4: Betriebsdokumentation (Operations Documentation)
 * Backup, security, and maintenance procedures
 */
export interface OperationsDocumentation {
  // Backup procedures
  backup: {
    strategy: string;
    frequency: string;
    retention: string;
    storageLocation: string;
    encryptionEnabled: boolean;
    testFrequency: string;
    lastTest?: Date;
    restoreProcedure: string;
  };

  // Monitoring
  monitoring: {
    systemMonitoring: boolean;
    alerting: boolean;
    logManagement: string;
    performanceMetrics: string[];
  };

  // Maintenance
  maintenance: {
    schedule: string;
    updateProcedure: string;
    downtimePolicy: string;
    notificationProcess: string;
  };

  // Disaster recovery
  disasterRecovery: {
    plan: string;
    rto: string; // Recovery Time Objective
    rpo: string; // Recovery Point Objective
    backupSite?: string;
    lastTest?: Date;
  };

  // Data protection (GDPR)
  dataProtection: {
    dataProtectionOfficer?: string;
    gdprCompliant: boolean;
    privacyPolicy: string;
    dataSubjectRights: string[];
    breachNotificationProcedure: string;
  };
}

/**
 * Section 5: Internes Kontrollsystem (Internal Controls)
 * Segregation of duties, approval workflows, and controls
 */
export interface InternalControls {
  // Segregation of duties
  segregationOfDuties: {
    implemented: boolean;
    description: string;
    criticalFunctions: SoDRule[];
  };

  // Approval workflows
  approvalWorkflows: ApprovalWorkflow[];

  // Access controls
  accessControls: {
    userProvisioning: string;
    accessReview: {
      frequency: string;
      lastReview?: Date;
    };
    privilegedAccessManagement: string;
    passwordPolicy: {
      minLength: number;
      complexity: boolean;
      expiryDays?: number;
      history?: number;
    };
  };

  // Change management
  changeManagement: {
    processDocumented: boolean;
    approvalRequired: boolean;
    testingRequired: boolean;
    rollbackProcedure: string;
    changeLog: boolean;
  };

  // Compliance checks
  complianceChecks: ComplianceCheck[];
}

/**
 * Segregation of Duties rule
 */
export interface SoDRule {
  function1: string;
  function2: string;
  reason: string;
  implementation: string;
}

/**
 * Approval workflow
 */
export interface ApprovalWorkflow {
  process: string;
  triggerConditions: string[];
  approvers: string[]; // Roles
  levels: number;
  timeout?: string;
  escalation?: string;
}

/**
 * Compliance check
 */
export interface ComplianceCheck {
  name: string;
  description: string;
  frequency: string;
  responsibility: string;
  lastPerformed?: Date;
  nextScheduled?: Date;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  format: 'pdf' | 'html' | 'docx';
  fileSize?: number;
  error?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  completionPercentage: number; // 0-100
  missingSections: string[];
  missingFields: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Template data for generating documentation
 */
export interface TemplateData {
  company: any;
  system: any;
  roles: any[];
  processes: any[];
  [key: string]: any;
}

/**
 * Options for generating documentation
 */
export interface GenerateOptions {
  tenantId: string;
  autoPopulate?: boolean; // Auto-populate from organisation settings
  includeDefaults?: boolean; // Include default German templates
  language?: 'de' | 'en';
}

/**
 * Options for updating a section
 */
export interface UpdateSectionOptions {
  tenantId: string;
  section: keyof ProcessDocumentationSections;
  content: any;
  autoIncrement?: boolean; // Auto-increment version
}

/**
 * Process documentation status transitions
 */
export const STATUS_TRANSITIONS: Record<ProcessDocumentationStatus, ProcessDocumentationStatus[]> = {
  [ProcessDocumentationStatus.DRAFT]: [ProcessDocumentationStatus.REVIEW, ProcessDocumentationStatus.ARCHIVED],
  [ProcessDocumentationStatus.REVIEW]: [ProcessDocumentationStatus.DRAFT, ProcessDocumentationStatus.APPROVED, ProcessDocumentationStatus.ARCHIVED],
  [ProcessDocumentationStatus.APPROVED]: [ProcessDocumentationStatus.ARCHIVED],
  [ProcessDocumentationStatus.ARCHIVED]: [],
};
