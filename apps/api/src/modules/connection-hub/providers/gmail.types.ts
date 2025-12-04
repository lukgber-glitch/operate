/**
 * Gmail OAuth Service Types
 * Type definitions for Gmail API OAuth integration
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
 * Gmail User Profile
 */
export interface GmailProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

/**
 * Gmail Message List Response
 */
export interface MessageList {
  messages: MessageListItem[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

/**
 * Gmail Message List Item
 */
export interface MessageListItem {
  id: string;
  threadId: string;
}

/**
 * Gmail Message
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: MessagePart;
  sizeEstimate: number;
  raw?: string;
}

/**
 * Gmail Message Part
 */
export interface MessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: MessageHeader[];
  body?: MessageBody;
  parts?: MessagePart[];
}

/**
 * Gmail Message Header
 */
export interface MessageHeader {
  name: string;
  value: string;
}

/**
 * Gmail Message Body
 */
export interface MessageBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

/**
 * Gmail Label
 */
export interface Label {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

/**
 * Gmail Label List Response
 */
export interface LabelListResponse {
  labels: Label[];
}

/**
 * Gmail API Error Response
 */
export interface GmailErrorResponse {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}
