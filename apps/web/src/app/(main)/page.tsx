import { Metadata } from 'next';
import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'Operate - Your AI Business Assistant',
  description: 'Chat with your AI assistant to manage invoices, expenses, taxes, and more.',
};

/**
 * ChatHomePage - Main landing page with chat interface
 *
 * This is the primary entry point after authentication.
 * Users interact with the AI assistant to manage their business operations.
 */
export default function ChatHomePage() {
  return <ChatInterface />;
}
