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
export {
  MessageActions,
  detectContextualActions,
  type ActionType,
  type MessageAction,
} from './MessageActions';
export { TypingIndicator } from './TypingIndicator';

// Legacy exports for backward compatibility
export { ChatButton } from './ChatButton';
export { ChatPanel } from './ChatPanel';
