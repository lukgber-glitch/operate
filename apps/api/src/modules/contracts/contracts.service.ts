import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContractStatus, TemplateCategory } from '@prisma/client';
import {
  CreateContractDto,
  UpdateContractDto,
  SendContractDto,
  SignContractDto,
  CreateFromTemplateDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/contract.dto';
import * as crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CONTRACT METHODS
  // ============================================================================

  async findAll(organisationId: string, filters?: {
    status?: ContractStatus;
    clientId?: string;
  }) {
    return this.prisma.contract.findMany({
      where: {
        organisationId,
        ...filters,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organisationId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        template: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.organisationId !== organisationId) {
      throw new ForbiddenException('Access denied');
    }

    return contract;
  }

  async create(organisationId: string, dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        organisationId,
        title: dto.title,
        description: dto.description,
        content: dto.content,
        clientId: dto.clientId,
        templateId: dto.templateId,
        value: dto.value ? new Decimal(dto.value) : undefined,
        currency: dto.currency || 'EUR',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: ContractStatus.DRAFT,
      },
      include: {
        client: true,
        template: true,
      },
    });
  }

  async createFromTemplate(
    organisationId: string,
    dto: CreateFromTemplateDto,
  ) {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Verify access to template
    if (template.organisationId && template.organisationId !== organisationId) {
      throw new ForbiddenException('Access denied to template');
    }

    // Render template with variables
    const renderedContent = this.renderTemplate(template.content, dto.variables);

    // Get client info if provided
    let client = null;
    if (dto.clientId) {
      client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client || client.orgId !== organisationId) {
        throw new NotFoundException('Client not found');
      }
    }

    // Create contract
    return this.prisma.contract.create({
      data: {
        organisationId,
        templateId: template.id,
        clientId: dto.clientId,
        title: this.renderTemplate(template.name, dto.variables),
        description: template.description,
        content: renderedContent,
        currency: 'EUR',
        status: ContractStatus.DRAFT,
      },
      include: {
        client: true,
        template: true,
      },
    });
  }

  async update(id: string, organisationId: string, dto: UpdateContractDto) {
    const contract = await this.findOne(id, organisationId);

    // Prevent editing signed contracts
    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Cannot edit signed contracts');
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        clientId: dto.clientId,
        value: dto.value ? new Decimal(dto.value) : undefined,
        currency: dto.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
      include: {
        client: true,
        template: true,
      },
    });
  }

  async delete(id: string, organisationId: string) {
    const contract = await this.findOne(id, organisationId);

    // Prevent deleting signed contracts
    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Cannot delete signed contracts');
    }

    return this.prisma.contract.delete({
      where: { id },
    });
  }

  async send(id: string, organisationId: string, dto: SendContractDto) {
    const contract = await this.findOne(id, organisationId);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Contract must be in draft status');
    }

    // Generate unique signature token
    const signatureToken = crypto.randomBytes(32).toString('hex');

    return this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
        signerEmail: dto.signerEmail,
        signerName: dto.signerName,
        signatureToken,
        sentAt: new Date(),
      },
    });

    // TODO: Send email with signature link
    // const signatureUrl = `${process.env.FRONTEND_URL}/contracts/sign/${signatureToken}`;
  }

  async findByToken(token: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { signatureToken: token },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.SENT && contract.status !== ContractStatus.VIEWED) {
      throw new BadRequestException('Contract is not available for signature');
    }

    // Mark as viewed if first time
    if (contract.status === ContractStatus.SENT) {
      await this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.VIEWED,
          viewedAt: new Date(),
        },
      });
    }

    return contract;
  }

  async sign(token: string, dto: SignContractDto, ipAddress?: string) {
    const contract = await this.findByToken(token);

    if (contract.status !== ContractStatus.VIEWED && contract.status !== ContractStatus.SENT) {
      throw new BadRequestException('Contract is not available for signature');
    }

    // Verify signer email matches
    if (contract.signerEmail !== dto.signerEmail) {
      throw new BadRequestException('Signer email does not match');
    }

    return this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: ContractStatus.SIGNED,
        signatureData: dto.signatureData,
        signerIp: ipAddress,
        signedAt: new Date(),
      },
    });
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    // Add some default variables
    const today = new Date().toISOString().split('T')[0];
    const allVars = {
      today,
      ...variables,
    };

    // Replace {{variable}} with values
    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    return result;
  }

  async generatePdf(id: string, organisationId: string): Promise<Buffer> {
    const contract = await this.findOne(id, organisationId);

    // TODO: Implement PDF generation using puppeteer or pdfkit
    // For now, return a placeholder
    throw new BadRequestException('PDF generation not implemented yet');
  }

  // ============================================================================
  // TEMPLATE METHODS
  // ============================================================================

  async findAllTemplates(organisationId?: string) {
    return this.prisma.contractTemplate.findMany({
      where: {
        OR: [
          { isSystem: true },
          { organisationId },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async createTemplate(organisationId: string, dto: CreateTemplateDto) {
    return this.prisma.contractTemplate.create({
      data: {
        organisationId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        content: dto.content,
        variables: dto.variables || [],
        isSystem: false,
      },
    });
  }

  async updateTemplate(id: string, organisationId: string, dto: UpdateTemplateDto) {
    const template = await this.findTemplate(id);

    // Cannot edit system templates
    if (template.isSystem) {
      throw new BadRequestException('Cannot edit system templates');
    }

    // Verify ownership
    if (template.organisationId !== organisationId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.contractTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        content: dto.content,
        variables: dto.variables,
      },
    });
  }

  async deleteTemplate(id: string, organisationId: string) {
    const template = await this.findTemplate(id);

    // Cannot delete system templates
    if (template.isSystem) {
      throw new BadRequestException('Cannot delete system templates');
    }

    // Verify ownership
    if (template.organisationId !== organisationId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.contractTemplate.delete({
      where: { id },
    });
  }

  async seedSystemTemplates() {
    const templates = [
      {
        name: 'Freelance Service Agreement',
        description: 'Standard agreement for freelance services',
        category: TemplateCategory.FREELANCE,
        content: `FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into as of {{today}} between:

SERVICE PROVIDER: {{organisation.name}}
CLIENT: {{client.name}} ({{client.company}})

1. SERVICES
The Service Provider agrees to provide the following services:
{{service.description}}

2. COMPENSATION
Client agrees to pay Service Provider {{contract.value}} {{contract.currency}} for the services rendered.

3. TERM
This Agreement shall commence on {{contract.startDate}} and continue until completion of services or {{contract.endDate}}, whichever comes first.

4. INDEPENDENT CONTRACTOR
Service Provider is an independent contractor and not an employee of Client.

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

SIGNATURES
_________________________        _________________________
Service Provider                  Client
Date: {{today}}                  Date: `,
        variables: ['client.name', 'client.company', 'organisation.name', 'contract.value', 'contract.startDate', 'contract.endDate', 'service.description'],
      },
      {
        name: 'Non-Disclosure Agreement (NDA)',
        description: 'Standard mutual NDA',
        category: TemplateCategory.NDA,
        content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made as of {{today}} between:

PARTY 1: {{organisation.name}}
PARTY 2: {{client.name}} ({{client.company}})

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any data or information that is proprietary to either party.

2. OBLIGATIONS
Each party agrees to:
- Keep confidential information strictly confidential
- Not disclose to third parties without written consent
- Use confidential information only for the intended purpose

3. TERM
This Agreement shall remain in effect for a period of {{nda.term}} years from the date of signing.

4. REMEDIES
Breach of this Agreement may result in irreparable harm, and the non-breaching party shall be entitled to equitable relief.

SIGNATURES
_________________________        _________________________
{{organisation.name}}            {{client.name}}
Date: {{today}}                  Date: `,
        variables: ['client.name', 'client.company', 'organisation.name', 'nda.term'],
      },
      {
        name: 'Consulting Agreement',
        description: 'Professional consulting services agreement',
        category: TemplateCategory.CONSULTING,
        content: `CONSULTING SERVICES AGREEMENT

This Consulting Agreement ("Agreement") is entered into as of {{today}} between:

CONSULTANT: {{organisation.name}}
CLIENT: {{client.name}} ({{client.company}})

1. CONSULTING SERVICES
Consultant agrees to provide professional consulting services as described below:
{{consulting.scope}}

2. COMPENSATION
Client shall pay Consultant {{contract.value}} {{contract.currency}} as follows:
{{payment.terms}}

3. TERM AND TERMINATION
This Agreement shall commence on {{contract.startDate}} and continue until {{contract.endDate}}.
Either party may terminate with 30 days written notice.

4. DELIVERABLES
Consultant shall deliver:
{{deliverables.list}}

5. INTELLECTUAL PROPERTY
All work product created shall be the property of {{ip.owner}}.

6. WARRANTIES
Consultant warrants that services will be performed in a professional and workmanlike manner.

SIGNATURES
_________________________        _________________________
Consultant                       Client
Date: {{today}}                  Date: `,
        variables: ['client.name', 'client.company', 'organisation.name', 'contract.value', 'contract.startDate', 'contract.endDate', 'consulting.scope', 'payment.terms', 'deliverables.list', 'ip.owner'],
      },
      {
        name: 'Project Contract',
        description: 'Fixed-scope project agreement',
        category: TemplateCategory.PROJECT,
        content: `PROJECT CONTRACT

This Project Contract ("Agreement") is made as of {{today}} between:

CONTRACTOR: {{organisation.name}}
CLIENT: {{client.name}} ({{client.company}})

PROJECT: {{project.name}}

1. SCOPE OF WORK
{{project.scope}}

2. DELIVERABLES
{{project.deliverables}}

3. PROJECT TIMELINE
Start Date: {{contract.startDate}}
Completion Date: {{contract.endDate}}

4. PROJECT FEE
Total Project Fee: {{contract.value}} {{contract.currency}}

5. PAYMENT SCHEDULE
{{payment.schedule}}

6. MILESTONES
{{project.milestones}}

7. ACCEPTANCE CRITERIA
{{acceptance.criteria}}

8. CHANGE ORDERS
Any changes to scope must be agreed in writing and may affect timeline and budget.

SIGNATURES
_________________________        _________________________
Contractor                       Client
Date: {{today}}                  Date: `,
        variables: ['client.name', 'client.company', 'organisation.name', 'project.name', 'project.scope', 'project.deliverables', 'contract.value', 'contract.startDate', 'contract.endDate', 'payment.schedule', 'project.milestones', 'acceptance.criteria'],
      },
      {
        name: 'Retainer Agreement',
        description: 'Ongoing retainer services agreement',
        category: TemplateCategory.RETAINER,
        content: `RETAINER AGREEMENT

This Retainer Agreement ("Agreement") is entered into as of {{today}} between:

SERVICE PROVIDER: {{organisation.name}}
CLIENT: {{client.name}} ({{client.company}})

1. RETAINER SERVICES
Service Provider agrees to provide the following ongoing services:
{{retainer.services}}

2. RETAINER FEE
Client agrees to pay a monthly retainer fee of {{retainer.monthlyFee}} {{contract.currency}}.

3. INCLUDED HOURS
The retainer includes {{retainer.includedHours}} hours per month of service.

4. ADDITIONAL WORK
Work beyond included hours will be billed at {{retainer.hourlyRate}} {{contract.currency}} per hour.

5. TERM AND RENEWAL
Initial term: {{contract.startDate}} to {{contract.endDate}}
Auto-renewal: {{retainer.autoRenewal}}

6. PAYMENT TERMS
Payment due on the 1st of each month, in advance.

7. TERMINATION
Either party may terminate with 30 days written notice.

SIGNATURES
_________________________        _________________________
Service Provider                 Client
Date: {{today}}                  Date: `,
        variables: ['client.name', 'client.company', 'organisation.name', 'retainer.services', 'retainer.monthlyFee', 'contract.currency', 'retainer.includedHours', 'retainer.hourlyRate', 'contract.startDate', 'contract.endDate', 'retainer.autoRenewal'],
      },
    ];

    // Create templates if they don't exist
    for (const template of templates) {
      await this.prisma.contractTemplate.upsert({
        where: {
          id: `system-${template.category.toLowerCase()}`,
        },
        create: {
          id: `system-${template.category.toLowerCase()}`,
          ...template,
          isSystem: true,
        },
        update: {},
      });
    }

    return { message: 'System templates seeded successfully', count: templates.length };
  }
}
