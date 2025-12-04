/**
 * Outlook OAuth Service Types
 * Type definitions for Microsoft Graph API OAuth integration
 */

/**
 * OAuth 2.0 Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Outlook User Profile
 */
export interface OutlookProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  mobilePhone?: string;
  officeLocation?: string;
}

/**
 * Outlook Message List Response
 */
export interface MessageList {
  value: OutlookMessage[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

/**
 * Outlook Message
 */
export interface OutlookMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  receivedDateTime: string;
  sentDateTime?: string;
  hasAttachments: boolean;
  internetMessageId: string;
  subject: string;
  bodyPreview: string;
  importance: 'low' | 'normal' | 'high';
  isRead: boolean;
  isDraft: boolean;
  webLink: string;
  from: EmailAddress;
  toRecipients: EmailAddress[];
  ccRecipients?: EmailAddress[];
  bccRecipients?: EmailAddress[];
  replyTo?: EmailAddress[];
  body: ItemBody;
  sender?: EmailAddress;
  conversationId?: string;
  conversationIndex?: string;
  flag?: FollowupFlag;
  categories?: string[];
}

/**
 * Email Address
 */
export interface EmailAddress {
  emailAddress: {
    name: string;
    address: string;
  };
}

/**
 * Item Body
 */
export interface ItemBody {
  contentType: 'text' | 'html';
  content: string;
}

/**
 * Followup Flag
 */
export interface FollowupFlag {
  flagStatus: 'notFlagged' | 'complete' | 'flagged';
  startDateTime?: DateTimeTimeZone;
  dueDateTime?: DateTimeTimeZone;
  completedDateTime?: DateTimeTimeZone;
}

/**
 * DateTime with TimeZone
 */
export interface DateTimeTimeZone {
  dateTime: string;
  timeZone: string;
}

/**
 * Outlook Folder
 */
export interface MailFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount: number;
  unreadItemCount: number;
  totalItemCount: number;
  isHidden: boolean;
}

/**
 * Mail Folder List Response
 */
export interface MailFolderListResponse {
  value: MailFolder[];
  '@odata.nextLink'?: string;
}

/**
 * Microsoft Graph API Error Response
 */
export interface GraphErrorResponse {
  error: {
    code: string;
    message: string;
    innerError?: {
      date: string;
      'request-id': string;
      'client-request-id': string;
    };
  };
}

/**
 * Send Mail Request
 */
export interface SendMailRequest {
  message: {
    subject: string;
    body: ItemBody;
    toRecipients: EmailAddress[];
    ccRecipients?: EmailAddress[];
    bccRecipients?: EmailAddress[];
    importance?: 'low' | 'normal' | 'high';
  };
  saveToSentItems?: boolean;
}
