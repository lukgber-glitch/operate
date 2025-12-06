import { Metadata } from 'next';

import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'Chat | Operate',
  description: 'Chat with your AI business assistant',
};

/**
 * Full-page Chat Interface
 *
 * This is the primary chat-first interface for the application.
 * Features:
 * - Full-screen chat experience
 * - Conversation history sidebar
 * - AI-powered suggestions
 * - Voice input support
 * - File attachments
 */
export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface className="h-full" />
    </div>
  );
}
