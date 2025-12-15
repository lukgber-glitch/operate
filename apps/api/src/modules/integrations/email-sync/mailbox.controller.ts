import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { MailboxService } from './mailbox.service';
import { EmailMailboxPurpose } from '@prisma/client';

@ApiTags('Email Mailboxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email/mailboxes')
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  @Get()
  @ApiOperation({ summary: 'Get all mailboxes for organization' })
  async getMailboxes(@Req() req: any) {
    return this.mailboxService.getMailboxes(req.user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new mailbox configuration' })
  async createMailbox(
    @Req() req: any,
    @Body() body: {
      connectionId: string;
      email: string;
      displayName?: string;
      purpose: EmailMailboxPurpose;
      foldersToScan?: string[];
      labelIds?: string[];
      folderIds?: string[];
    },
  ) {
    return this.mailboxService.createMailbox({
      ...body,
      orgId: req.user.orgId,
      userId: req.user.sub,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update mailbox configuration' })
  async updateMailbox(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      displayName?: string;
      purpose?: EmailMailboxPurpose;
      foldersToScan?: string[];
      labelIds?: string[];
      folderIds?: string[];
      isActive?: boolean;
    },
  ) {
    return this.mailboxService.updateMailbox(id, req.user.orgId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete mailbox' })
  async deleteMailbox(@Req() req: any, @Param('id') id: string) {
    return this.mailboxService.deleteMailbox(id, req.user.orgId);
  }

  @Get('forwarding')
  @ApiOperation({ summary: 'Get forwarding inboxes' })
  async getForwardingInboxes(@Req() req: any) {
    return this.mailboxService.getForwardingInboxes(req.user.orgId);
  }

  @Post('forwarding')
  @ApiOperation({ summary: 'Create forwarding inbox' })
  async createForwardingInbox(
    @Req() req: any,
    @Body() body: { purpose?: EmailMailboxPurpose },
  ) {
    return this.mailboxService.getOrCreateForwardingInbox(
      req.user.orgId,
      body.purpose || 'BILLS_INVOICES',
    );
  }
}
