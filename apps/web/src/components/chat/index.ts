/**
 * Chat Component Exports
 * Comprehensive AI assistant chat interface
 *
 * Performance Optimizations:
 * - Memoized components (ChatMessage)
 * - Error boundaries for graceful error handling
 * - Lazy loading ready (use dynamic imports)
 */

// Phase 3: Chat-Centric Landing Components
export { ChatLanding } from './ChatLanding';
export { ChatCentralPanel } from './ChatCentralPanel';
export { SuggestionPills } from './SuggestionPills';

// New enhanced components
export { ChatBubble } from './ChatBubble';
export { ChatContainer } from './ChatContainer';
export { ChatHeader } from './ChatHeader';
export { ChatInput } from './ChatInput';
export { ChatInterface } from './ChatInterface';
export { ChatMessage, LoadingMessage } from './ChatMessage';
export { GreetingHeader } from './GreetingHeader';

// Error handling
export { ChatErrorBoundary, useChatErrorHandler } from './ChatErrorBoundary';
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

// Entity preview sidebar
export {
  EntityPreviewSidebar,
  useEntityPreview,
  type EntityPreviewData,
  type EntityAction,
  type EntityType,
} from './EntityPreviewSidebar';
