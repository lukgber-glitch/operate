/**
 * IMAP Module
 * NestJS module for IMAP email integration
 */

import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { ImapConnectionService } from './imap-connection.service';
import { ImapSyncService } from './imap-sync.service';
import { ImapParserService } from './imap-parser.service';
import { ImapController } from './imap.controller';
import { DatabaseModule } from '@operate/database';

@Module({
  imports: [DatabaseModule],
  controllers: [ImapController],
  providers: [
    ImapService,
    ImapConnectionService,
    ImapSyncService,
    ImapParserService,
  ],
  exports: [
    ImapService,
    ImapConnectionService,
    ImapSyncService,
    ImapParserService,
  ],
})
export class ImapModule {}
