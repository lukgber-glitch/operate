import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { KycVerificationService } from './services/kyc-verification.service';
import { KycDecisionService } from './services/kyc-decision.service';
import { KycWorkflowService } from './services/kyc-workflow.service';
import { KycReportingService } from './services/kyc-reporting.service';

/**
 * KYC Service Unit Tests
 * Tests the main KYC service facade
 */
describe('KycService', () => {
  let service: KycService;
  let verificationService: jest.Mocked<KycVerificationService>;
  let decisionService: jest.Mocked<KycDecisionService>;
  let workflowService: jest.Mocked<KycWorkflowService>;
  let reportingService: jest.Mocked<KycReportingService>;

  beforeEach(async () => {
    // Create mocks
    const mockVerificationService = {
      startVerification: jest.fn(),
      getVerificationStatus: jest.fn(),
      syncPersonaStatus: jest.fn(),
    };

    const mockDecisionService = {
      makeDecision: jest.fn(),
      processAutomatedDecision: jest.fn(),
      getDecisionHistory: jest.fn(),
    };

    const mockWorkflowService = {
      getRequirements: jest.fn(),
      getWorkflowConfig: jest.fn(),
      isExpiringSoon: jest.fn(),
      processWebhookEvent: jest.fn(),
    };

    const mockReportingService = {
      getStatistics: jest.fn(),
      getPendingReview: jest.fn(),
      getVerificationTrend: jest.fn(),
      getRiskDistribution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: KycVerificationService,
          useValue: mockVerificationService,
        },
        {
          provide: KycDecisionService,
          useValue: mockDecisionService,
        },
        {
          provide: KycWorkflowService,
          useValue: mockWorkflowService,
        },
        {
          provide: KycReportingService,
          useValue: mockReportingService,
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    verificationService = module.get(KycVerificationService);
    decisionService = module.get(KycDecisionService);
    workflowService = module.get(KycWorkflowService);
    reportingService = module.get(KycReportingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose verification service', () => {
    expect(service.verification).toBe(verificationService);
  });

  it('should expose decision service', () => {
    expect(service.decision).toBe(decisionService);
  });

  it('should expose workflow service', () => {
    expect(service.workflow).toBe(workflowService);
  });

  it('should expose reporting service', () => {
    expect(service.reporting).toBe(reportingService);
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await service.healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        services: {
          verification: true,
          decision: true,
          workflow: true,
          reporting: true,
        },
      });
    });
  });
});

/**
 * Example usage tests demonstrating the KYC workflow
 */
describe('KYC Workflow Examples', () => {
  it('should demonstrate complete KYC verification flow', async () => {
    // This is a documentation test showing expected workflow

    // 1. Start verification
    const startRequest = {
      userId: 'user-123',
      organisationId: 'org-456',
      level: 'enhanced' as const,
      provider: 'persona' as const,
    };

    // 2. Expected initial response
    const initialResponse = {
      id: 'verification-789',
      userId: 'user-123',
      organisationId: 'org-456',
      status: 'pending' as const,
      level: 'enhanced' as const,
      provider: 'persona' as const,
      providerRefId: 'inq_ABC123',
      embeddedUrl: 'https://withpersona.com/verify?inquiry-id=inq_ABC123&session-token=tok_XYZ',
      nextSteps: 'Complete the identity verification using the provided link',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 3. After user completes Persona flow, webhook triggers sync
    // Status updates to 'in_review'

    // 4. Automated decision engine evaluates
    const automatedDecision = {
      verificationId: 'verification-789',
      decision: 'approve' as const,
      riskScore: 15,
      riskLevel: 'low' as const,
    };

    // 5. Final status
    const finalStatus = {
      ...initialResponse,
      status: 'approved' as const,
      riskScore: 15,
      riskLevel: 'low' as const,
      reviewedAt: new Date(),
      reviewedBy: 'system',
      decisionReason: 'Automated decision: Auto-approve low risk',
    };

    expect(startRequest).toBeDefined();
    expect(initialResponse).toBeDefined();
    expect(automatedDecision).toBeDefined();
    expect(finalStatus).toBeDefined();
  });

  it('should demonstrate manual review workflow', async () => {
    // For higher risk verifications requiring manual review

    // 1. Verification in review
    const verification = {
      id: 'verification-456',
      status: 'in_review' as const,
      riskScore: 55,
      riskLevel: 'high' as const,
    };

    // 2. Reviewer makes decision
    const manualDecision = {
      verificationId: 'verification-456',
      decision: 'approve' as const,
      reason: 'Manual review: Identity confirmed through additional documentation',
    };

    // 3. Decision recorded
    const decisionRecord = {
      id: 'decision-789',
      verificationId: 'verification-456',
      decision: 'approve' as const,
      decidedBy: 'reviewer-123',
      decisionType: 'manual' as const,
      previousStatus: 'in_review' as const,
      newStatus: 'approved' as const,
      createdAt: new Date(),
    };

    expect(verification).toBeDefined();
    expect(manualDecision).toBeDefined();
    expect(decisionRecord).toBeDefined();
  });

  it('should demonstrate country-specific requirements', async () => {
    // Different requirements for different countries

    // Germany (DE) requirements
    const deRequirements = [
      {
        countryCode: 'DE',
        customerType: 'individual' as const,
        requirementType: 'government_id' as const,
        isRequired: true,
        acceptedDocs: ['passport', 'national_id', 'drivers_license'],
      },
      {
        countryCode: 'DE',
        customerType: 'individual' as const,
        requirementType: 'proof_of_address' as const,
        isRequired: true,
        acceptedDocs: ['utility_bill', 'bank_statement'],
      },
    ];

    // UK requirements (may differ)
    const gbRequirements = [
      {
        countryCode: 'GB',
        customerType: 'individual' as const,
        requirementType: 'government_id' as const,
        isRequired: true,
        acceptedDocs: ['passport', 'drivers_license'],
      },
    ];

    expect(deRequirements).toBeDefined();
    expect(gbRequirements).toBeDefined();
  });

  it('should demonstrate reporting capabilities', async () => {
    // Statistics for dashboard

    const statistics = {
      total: 1250,
      byStatus: {
        approved: 850,
        pending: 150,
        in_review: 100,
        rejected: 100,
        expired: 50,
      },
      byRiskLevel: {
        low: 900,
        medium: 250,
        high: 80,
        critical: 20,
      },
      byProvider: {
        persona: 1100,
        internal: 150,
      },
      averageProcessingTime: 24.5,
      pendingReview: 100,
      expiringIn30Days: 45,
      approvalRate: 68.0,
      rejectionRate: 8.0,
    };

    // Pending review queue
    const pendingReview = [
      {
        id: 'verification-1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        organisationName: 'Acme Corp',
        riskScore: 55,
        daysWaiting: 3,
      },
      {
        id: 'verification-2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        organisationName: 'TechCo',
        riskScore: 48,
        daysWaiting: 1,
      },
    ];

    expect(statistics).toBeDefined();
    expect(pendingReview).toHaveLength(2);
  });
});
