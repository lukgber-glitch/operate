/**
 * Gmail Integration DTOs
 * Export all DTOs from a single entry point
 */

// Auth DTOs
export {
  GenerateGmailAuthUrlDto,
  GmailAuthUrlResponseDto,
  GmailCallbackQueryDto,
  GmailConnectionInfoDto,
  GmailDisconnectResponseDto,
  GmailTestConnectionResponseDto,
} from './gmail-auth.dto';

// Message DTOs
export {
  ListMessagesDto,
  SearchInvoiceEmailsDto,
  GetMessageDto,
  GetAttachmentDto,
  GmailHeaderDto,
  GmailMessageBodyDto,
  GmailMessagePartDto,
  GmailMessageDto,
  GmailListMessagesResponseDto,
  GmailAttachmentDto,
} from './gmail-message.dto';
