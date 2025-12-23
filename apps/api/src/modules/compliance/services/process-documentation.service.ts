/**
 * Process Documentation Service
 * Generates and manages GoBD-compliant Verfahrensdokumentation
 *
 * Features:
 * - Auto-generation from organisation settings
 * - German template-based documentation
 * - Version management
 * - Export to HTML/PDF/DOCX
 * - Completeness validation
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProcessDocumentationStatus, Prisma } from '@prisma/client';
import {
  ProcessDocumentation,
  ProcessDocumentationSections,
  GeneralDescription,
  UserDocumentation,
  TechnicalDocumentation,
  OperationsDocumentation,
  InternalControls,
  ExportResult,
  ValidationResult,
  GenerateOptions,
  UpdateSectionOptions,
  STATUS_TRANSITIONS,
} from '../types/process-documentation.types';
import {
  GENERAL_DESCRIPTION_TEMPLATE_DE,
  GENERAL_DESCRIPTION_CONTENT_DE,
  getGeneralDescriptionPlaceholders,
  USER_DOCUMENTATION_TEMPLATE_DE,
  USER_DOCUMENTATION_CONTENT_DE,
  getUserDocumentationPlaceholders,
  TECHNICAL_DOCUMENTATION_TEMPLATE_DE,
  TECHNICAL_DOCUMENTATION_CONTENT_DE,
  getTechnicalDocumentationPlaceholders,
  OPERATIONS_DOCUMENTATION_TEMPLATE_DE,
  OPERATIONS_DOCUMENTATION_CONTENT_DE,
  getOperationsDocumentationPlaceholders,
  INTERNAL_CONTROLS_TEMPLATE_DE,
  INTERNAL_CONTROLS_CONTENT_DE,
  getInternalControlsPlaceholders,
} from '../templates/verfahrensdokumentation';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createWriteStream } from 'fs';

@Injectable()
export class ProcessDocumentationService {
  private readonly logger = new Logger(ProcessDocumentationService.name);
  private readonly exportBaseDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.exportBaseDir = process.env.PROCESS_DOC_EXPORT_DIR || './exports/process-docs';
  }

  /**
   * Generate complete process documentation for a tenant
   *
   * @param tenantId - Tenant ID
   * @param options - Generation options
   * @returns Complete ProcessDocumentation
   */
  async generateDocumentation(tenantId: string, options?: GenerateOptions): Promise<ProcessDocumentation> {
    this.logger.log(`Generating process documentation for tenant ${tenantId}`);

    // Check if organisation exists
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: tenantId },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation ${tenantId} not found`);
    }

    // Auto-populate sections from organisation data
    const sections = await this.autoPopulateSections(tenantId, organisation, options);

    // Check if documentation already exists
    const existingDoc = await this.prisma.processDocumentation.findFirst({
      where: {
        tenantId,
        status: { not: ProcessDocumentationStatus.ARCHIVED },
      },
      orderBy: { version: 'desc' },
    });

    let version = 1;
    if (existingDoc) {
      // Archive old version
      await this.prisma.processDocumentation.update({
        where: { id: existingDoc.id },
        data: { status: ProcessDocumentationStatus.ARCHIVED },
      });
      version = existingDoc.version + 1;
    }

    // Create new documentation
    const doc = await this.prisma.processDocumentation.create({
      data: {
        tenantId,
        version,
        status: ProcessDocumentationStatus.DRAFT,
        sections: sections as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Created process documentation v${version} for tenant ${tenantId}`);

    return this.mapToProcessDocumentation(doc);
  }

  /**
   * Update a specific section of process documentation
   *
   * @param tenantId - Tenant ID
   * @param section - Section key
   * @param content - Section content
   * @returns void
   */
  async updateSection(tenantId: string, section: string, content: any): Promise<void> {
    this.logger.log(`Updating section "${section}" for tenant ${tenantId}`);

    const doc = await this.getLatestDocumentation(tenantId);

    if (!doc) {
      throw new NotFoundException(`No process documentation found for tenant ${tenantId}`);
    }

    // Validate section exists
    const validSections = ['generalDescription', 'userDocumentation', 'technicalDocumentation', 'operationsDocumentation', 'internalControls'];
    if (!validSections.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    // Update section
    const sections = doc.sections as Prisma.InputJsonValue;
    sections[section] = content;

    await this.prisma.processDocumentation.update({
      where: { id: doc.id },
      data: {
        sections: sections as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Updated section "${section}" for tenant ${tenantId}`);
  }

  /**
   * Get process documentation for a tenant
   *
   * @param tenantId - Tenant ID
   * @param version - Specific version (optional, defaults to latest)
   * @returns ProcessDocumentation
   */
  async getDocumentation(tenantId: string, version?: number): Promise<ProcessDocumentation> {
    let doc;

    if (version) {
      doc = await this.prisma.processDocumentation.findFirst({
        where: { tenantId, version },
      });
    } else {
      doc = await this.getLatestDocumentation(tenantId);
    }

    if (!doc) {
      throw new NotFoundException(`Process documentation not found for tenant ${tenantId}`);
    }

    return this.mapToProcessDocumentation(doc);
  }

  /**
   * Export process documentation in specified format
   *
   * @param tenantId - Tenant ID
   * @param format - Export format (pdf, html, docx)
   * @returns ExportResult
   */
  async exportDocumentation(tenantId: string, format: 'pdf' | 'html' | 'docx'): Promise<ExportResult> {
    this.logger.log(`Exporting process documentation for tenant ${tenantId} as ${format}`);

    const doc = await this.getDocumentation(tenantId);

    // Create export directory
    const exportDir = join(this.exportBaseDir, tenantId);
    await fs.mkdir(exportDir, { recursive: true });

    switch (format) {
      case 'html':
        return this.exportAsHTML(doc, exportDir);
      case 'pdf':
        return this.exportAsPDF(doc, exportDir);
      case 'docx':
        return this.exportAsDOCX(doc, exportDir);
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * Validate completeness of process documentation
   *
   * @param tenantId - Tenant ID
   * @returns ValidationResult
   */
  async validateCompleteness(tenantId: string): Promise<ValidationResult> {
    this.logger.debug(`Validating completeness for tenant ${tenantId}`);

    const doc = await this.getLatestDocumentation(tenantId);

    if (!doc) {
      return {
        valid: false,
        completionPercentage: 0,
        missingSections: ['All sections missing'],
        missingFields: [],
        warnings: [],
        errors: ['No process documentation found'],
      };
    }

    const sections = doc.sections as unknown as ProcessDocumentationSections;
    const missingSections: string[] = [];
    const missingFields: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let totalFields = 0;
    let completedFields = 0;

    // Validate General Description
    if (!sections.generalDescription) {
      missingSections.push('generalDescription');
    } else {
      const gd = sections.generalDescription;
      totalFields += 9;
      if (gd.companyInfo?.name) completedFields++;
      if (gd.companyInfo?.address) completedFields++;
      if (gd.companyInfo?.industry) completedFields++;
      if (gd.systemInfo?.name) completedFields++;
      if (gd.systemInfo?.version) completedFields++;
      if (gd.systemInfo?.purpose) completedFields++;
      if (gd.scope?.coveredProcesses?.length > 0) completedFields++;
      if (gd.scope?.coveredDepartments?.length > 0) completedFields++;
      if (gd.scope?.taxRelevantData?.length > 0) completedFields++;

      if (!gd.companyInfo?.name) missingFields.push('generalDescription.companyInfo.name');
      if (!gd.companyInfo?.taxNumber && !gd.companyInfo?.vatId) {
        warnings.push('Steuernummer oder USt-IdNr. sollte angegeben werden');
      }
    }

    // Validate User Documentation
    if (!sections.userDocumentation) {
      missingSections.push('userDocumentation');
    } else {
      const ud = sections.userDocumentation;
      totalFields += 3;
      if (ud.roles?.length > 0) completedFields++;
      if (ud.processes?.length > 0) completedFields++;
      if (ud.workflows?.length > 0) completedFields++;

      if (ud.roles?.length < 3) {
        warnings.push('Mindestens 3 Benutzerrollen sollten definiert sein');
      }
      if (ud.processes?.length < 2) {
        warnings.push('Mindestens 2 Geschäftsprozesse sollten dokumentiert sein');
      }
    }

    // Validate Technical Documentation
    if (!sections.technicalDocumentation) {
      missingSections.push('technicalDocumentation');
    } else {
      const td = sections.technicalDocumentation;
      totalFields += 4;
      if (td.architecture?.components?.length > 0) completedFields++;
      if (td.dataFlow?.description) completedFields++;
      if (td.interfaces?.length > 0) completedFields++;
      if (td.security?.encryption?.atRest !== undefined) completedFields++;

      if (!td.security?.auditLogging?.enabled) {
        errors.push('Audit-Logging muss aktiviert sein (GoBD-Anforderung)');
      }
    }

    // Validate Operations Documentation
    if (!sections.operationsDocumentation) {
      missingSections.push('operationsDocumentation');
    } else {
      const od = sections.operationsDocumentation;
      totalFields += 4;
      if (od.backup?.strategy) completedFields++;
      if (od.monitoring?.systemMonitoring) completedFields++;
      if (od.maintenance?.schedule) completedFields++;
      if (od.disasterRecovery?.plan) completedFields++;

      if (!od.backup?.frequency) {
        errors.push('Backup-Frequenz muss definiert sein');
      }
    }

    // Validate Internal Controls
    if (!sections.internalControls) {
      missingSections.push('internalControls');
    } else {
      const ic = sections.internalControls;
      totalFields += 4;
      if (ic.segregationOfDuties?.implemented) completedFields++;
      if (ic.approvalWorkflows?.length > 0) completedFields++;
      if (ic.accessControls?.userProvisioning) completedFields++;
      if (ic.complianceChecks?.length > 0) completedFields++;

      if (!ic.segregationOfDuties?.implemented) {
        warnings.push('Funktionstrennung sollte implementiert sein');
      }
    }

    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    const valid = missingSections.length === 0 && errors.length === 0 && completionPercentage >= 80;

    return {
      valid,
      completionPercentage,
      missingSections,
      missingFields,
      warnings,
      errors,
    };
  }

  /**
   * Approve process documentation
   *
   * @param tenantId - Tenant ID
   * @param approvedBy - User ID who approves
   * @returns Updated ProcessDocumentation
   */
  async approveDocumentation(tenantId: string, approvedBy: string): Promise<ProcessDocumentation> {
    this.logger.log(`Approving process documentation for tenant ${tenantId} by user ${approvedBy}`);

    const doc = await this.getLatestDocumentation(tenantId);

    if (!doc) {
      throw new NotFoundException(`No process documentation found for tenant ${tenantId}`);
    }

    // Validate completeness
    const validation = await this.validateCompleteness(tenantId);
    if (!validation.valid) {
      throw new BadRequestException(`Documentation is not complete: ${validation.errors.join(', ')}`);
    }

    // Check status transition is allowed
    if (!STATUS_TRANSITIONS[doc.status]?.includes(ProcessDocumentationStatus.APPROVED)) {
      throw new BadRequestException(`Cannot approve documentation in status ${doc.status}`);
    }

    // Update status
    const updated = await this.prisma.processDocumentation.update({
      where: { id: doc.id },
      data: {
        status: ProcessDocumentationStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    this.logger.log(`Approved process documentation v${updated.version} for tenant ${tenantId}`);

    return this.mapToProcessDocumentation(updated);
  }

  /**
   * Auto-populate sections from organisation data
   */
  private async autoPopulateSections(
    tenantId: string,
    organisation: any,
    options?: GenerateOptions,
  ): Promise<ProcessDocumentationSections> {
    // General Description
    const generalDescription: GeneralDescription = {
      companyInfo: {
        name: organisation.name || '[Firmenname]',
        legalForm: organisation.companyType || 'GmbH',
        address: '[Adresse]',
        taxNumber: organisation.utrNumber || organisation.taxRegistrationNumber || '',
        vatId: organisation.vatNumber || '',
        registrationNumber: organisation.companyRegistrationNumber || '',
        industry: organisation.industry || '[Branche]',
        employees: 0,
      },
      systemInfo: {
        name: 'OPERATE',
        version: '1.0.0',
        vendor: 'OPERATE',
        purpose: 'Enterprise SaaS for SME operations',
        implementationDate: organisation.createdAt,
        lastUpdateDate: organisation.updatedAt,
        operatingSystem: 'Linux (Cloud)',
        database: 'PostgreSQL',
      },
      scope: {
        coveredProcesses: ['Invoicing', 'Expense Management', 'Banking', 'Tax Filing'],
        coveredDepartments: ['Finance', 'Operations', 'HR'],
        taxRelevantData: ['Invoices', 'Expenses', 'Bank Transactions', 'VAT Returns'],
        retentionPeriods: {
          TAX_RELEVANT: 10,
          BUSINESS: 6,
          CORRESPONDENCE: 6,
          HR: 10,
          LEGAL: 30,
          TEMPORARY: 1,
        },
      },
    };

    // User Documentation
    const userDocumentation: UserDocumentation = {
      roles: [],
      processes: [],
      workflows: [],
      training: {
        manualAvailable: false,
        trainingRequired: true,
        trainingFrequency: 'Quarterly',
      },
    };

    // Technical Documentation
    const technicalDocumentation: TechnicalDocumentation = {
      architecture: {
        overview: 'Microservices architecture with NestJS backend and Next.js frontend',
        components: [],
        infrastructure: 'Cloud-based (Cloudways/DigitalOcean)',
        hosting: 'Managed cloud hosting',
        scalability: 'Horizontal scaling via containers',
      },
      dataFlow: {
        description: 'Data flows through REST API endpoints with JWT authentication',
        inputSources: ['Web UI', 'API', 'Email', 'Banking APIs'],
        outputDestinations: ['Database', 'File Storage', 'Email', 'Tax Portals'],
        dataTransformations: ['OCR', 'Classification', 'Validation', 'Encryption'],
      },
      interfaces: [],
      dataStructure: {
        databaseSchema: 'PostgreSQL with Prisma ORM',
        keyTables: ['Invoice', 'Expense', 'BankTransaction', 'Document'],
        dataRetention: 'Per GoBD requirements',
        archiveFormat: 'Encrypted AES-256-GCM',
      },
      security: {
        encryption: {
          atRest: true,
          inTransit: true,
          algorithm: 'AES-256-GCM',
        },
        authentication: {
          method: 'JWT + OAuth 2.0',
          mfaEnabled: true,
          sessionManagement: 'Stateless JWT',
        },
        authorization: {
          model: 'RBAC',
          accessControl: 'Role-based with tenant isolation',
        },
        auditLogging: {
          enabled: true,
          immutability: true,
          hashChain: true,
          retention: 10,
        },
      },
    };

    // Operations Documentation
    const operationsDocumentation: OperationsDocumentation = {
      backup: {
        strategy: 'Daily automated backups',
        frequency: 'Daily',
        retention: '30 days',
        storageLocation: 'Cloud storage (encrypted)',
        encryptionEnabled: true,
        testFrequency: 'Monthly',
        restoreProcedure: 'Documented restore procedure',
      },
      monitoring: {
        systemMonitoring: true,
        alerting: true,
        logManagement: 'Centralized logging',
        performanceMetrics: ['Response Time', 'Error Rate', 'Uptime'],
      },
      maintenance: {
        schedule: 'Weekly maintenance windows',
        updateProcedure: 'Documented update procedure',
        downtimePolicy: 'Minimal downtime policy',
        notificationProcess: 'Email notifications',
      },
      disasterRecovery: {
        plan: 'Documented disaster recovery plan',
        rto: '4 hours',
        rpo: '1 hour',
      },
      dataProtection: {
        gdprCompliant: true,
        privacyPolicy: 'GDPR-compliant privacy policy',
        dataSubjectRights: ['Access', 'Rectification', 'Erasure', 'Portability'],
        breachNotificationProcedure: 'Within 72 hours',
      },
    };

    // Internal Controls
    const internalControls: InternalControls = {
      segregationOfDuties: {
        implemented: true,
        description: 'Separation of creation, approval, and execution',
        criticalFunctions: [],
      },
      approvalWorkflows: [],
      accessControls: {
        userProvisioning: 'Admin-approved provisioning',
        accessReview: {
          frequency: 'Quarterly',
        },
        privilegedAccessManagement: 'MFA required for privileged access',
        passwordPolicy: {
          minLength: 8,
          complexity: true,
          expiryDays: 90,
        },
      },
      changeManagement: {
        processDocumented: true,
        approvalRequired: true,
        testingRequired: true,
        rollbackProcedure: 'Git-based rollback',
        changeLog: true,
      },
      complianceChecks: [],
    };

    return {
      generalDescription,
      userDocumentation,
      technicalDocumentation,
      operationsDocumentation,
      internalControls,
    };
  }

  /**
   * Get latest documentation for a tenant
   */
  private async getLatestDocumentation(tenantId: string) {
    return this.prisma.processDocumentation.findFirst({
      where: {
        tenantId,
        status: { not: ProcessDocumentationStatus.ARCHIVED },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Export as HTML
   */
  private async exportAsHTML(doc: ProcessDocumentation, exportDir: string): Promise<ExportResult> {
    const fileName = `verfahrensdokumentation-v${doc.version}.html`;
    const filePath = join(exportDir, fileName);

    const sections = doc.sections;

    // Generate HTML content
    let html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verfahrensdokumentation - Version ${doc.version}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    h3 { color: #7f8c8d; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3498db; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .metadata { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
    .section { margin-bottom: 40px; }
    pre { background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="metadata">
    <h1>Verfahrensdokumentation gemäß GoBD</h1>
    <p><strong>Organisation:</strong> ${sections.generalDescription?.companyInfo?.name || '[Firmenname]'}</p>
    <p><strong>Version:</strong> ${doc.version}</p>
    <p><strong>Erstellt am:</strong> ${doc.createdAt.toLocaleDateString('de-DE')}</p>
    <p><strong>Status:</strong> ${doc.status}</p>
    ${doc.approvedBy ? `<p><strong>Genehmigt von:</strong> ${doc.approvedBy} am ${doc.approvedAt?.toLocaleDateString('de-DE')}</p>` : ''}
  </div>
`;

    // Section 1: General Description
    html += `<div class="section">`;
    const gdContent = this.substitutePlaceholders(
      GENERAL_DESCRIPTION_CONTENT_DE,
      getGeneralDescriptionPlaceholders(sections.generalDescription),
    );
    html += this.markdownToHTML(gdContent);
    html += `</div>`;

    // Section 2: User Documentation
    html += `<div class="section">`;
    const udContent = this.substitutePlaceholders(
      USER_DOCUMENTATION_CONTENT_DE,
      getUserDocumentationPlaceholders(sections.userDocumentation),
    );
    html += this.markdownToHTML(udContent);
    html += `</div>`;

    // Section 3: Technical Documentation
    html += `<div class="section">`;
    const tdContent = this.substitutePlaceholders(
      TECHNICAL_DOCUMENTATION_CONTENT_DE,
      getTechnicalDocumentationPlaceholders(sections.technicalDocumentation),
    );
    html += this.markdownToHTML(tdContent);
    html += `</div>`;

    // Section 4: Operations Documentation
    html += `<div class="section">`;
    const odContent = this.substitutePlaceholders(
      OPERATIONS_DOCUMENTATION_CONTENT_DE,
      getOperationsDocumentationPlaceholders(sections.operationsDocumentation),
    );
    html += this.markdownToHTML(odContent);
    html += `</div>`;

    // Section 5: Internal Controls
    html += `<div class="section">`;
    const icContent = this.substitutePlaceholders(
      INTERNAL_CONTROLS_CONTENT_DE,
      getInternalControlsPlaceholders(sections.internalControls),
    );
    html += this.markdownToHTML(icContent);
    html += `</div>`;

    html += `
</body>
</html>
`;

    await fs.writeFile(filePath, html, 'utf-8');

    const stats = await fs.stat(filePath);

    this.logger.log(`Exported process documentation as HTML: ${filePath}`);

    return {
      success: true,
      filePath,
      fileName,
      format: 'html',
      fileSize: stats.size,
    };
  }

  /**
   * Export as PDF (converts HTML to PDF)
   */
  private async exportAsPDF(doc: ProcessDocumentation, exportDir: string): Promise<ExportResult> {
    // First export as HTML
    const htmlResult = await this.exportAsHTML(doc, exportDir);

    // TODO: Convert HTML to PDF using puppeteer or similar
    // For now, return HTML with warning
    this.logger.warn('PDF export not yet implemented - returning HTML instead');

    return {
      ...htmlResult,
      format: 'pdf',
      error: 'PDF export not yet implemented - HTML file provided instead',
    };
  }

  /**
   * Export as DOCX
   */
  private async exportAsDOCX(doc: ProcessDocumentation, exportDir: string): Promise<ExportResult> {
    // TODO: Implement DOCX export using html-to-docx or similar
    // For now, export as HTML
    const htmlResult = await this.exportAsHTML(doc, exportDir);

    this.logger.warn('DOCX export not yet implemented - returning HTML instead');

    return {
      ...htmlResult,
      format: 'docx',
      error: 'DOCX export not yet implemented - HTML file provided instead',
    };
  }

  /**
   * Substitute placeholders in template
   */
  private substitutePlaceholders(template: string, placeholders: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }
    return result;
  }

  /**
   * Convert Markdown to HTML (simple implementation)
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Lists (simple)
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }

  /**
   * Map Prisma model to ProcessDocumentation type
   */
  private mapToProcessDocumentation(doc: any): ProcessDocumentation {
    return {
      id: doc.id,
      tenantId: doc.tenantId,
      version: doc.version,
      status: doc.status,
      sections: doc.sections as ProcessDocumentationSections,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
