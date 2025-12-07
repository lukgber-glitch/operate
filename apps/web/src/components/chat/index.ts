/**
 * Chat Component Exports
 * Comprehensive AI assistant chat interface
 */

// New enhanced components
export { ChatBubble } from './ChatBubble';
export { ChatContainer } from './ChatContainer';
export { ChatHeader } from './ChatHeader';
export { ChatInput } from './ChatInput';
export { ChatInterface } from './ChatInterface';
export { ChatMessage, LoadingMessage } from './ChatMessage';
export { GreetingHeader } from './GreetingHeader';
export {
  MessageActions,
  detectContextualActions,
  type ActionType,
  type MessageAction,
} from './MessageActions';
export { TypingIndicator } from './TypingIndicator';
export { VoiceInput } from './VoiceInput';

// Chat prompt suggestions for user guidance
export {
  ChatPromptSuggestions,
  ChatPromptPills,
  CHAT_PROMPTS,
  type ChatPrompt,
  type PromptCategory,
} from './ChatPromptSuggestions';

// Invoice preview component
export { InvoicePreview, InvoicePreviewCompact } from './InvoicePreview';

// Action and insight cards
export { ActionResultCard } from './ActionResultCard';
export { TransactionInsight } from './TransactionInsight';
export { CustomerCard } from './CustomerCard';

// Legacy exports for backward compatibility
export { ChatButton } from './ChatButton';
export { ChatPanel } from './ChatPanel';

// Document viewer
export { DocumentViewer, type DocumentViewerProps } from './DocumentViewer';
