/**
 * Complete Chat Interface with Offline Queue Integration
 * Example implementation showing all offline queue features
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useOfflineChat } from '@/hooks/useOfflineChat';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { OfflineIndicator } from './OfflineIndicator';
import { Send, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed' | 'queued';
}

export function ChatWithOffline() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isOnline, queuedCount, isSyncing } = useOfflineChat();
  const { sync, clearErrors, hasErrors, errorCount } = useOfflineQueue();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Prevent leaving with unsent messages
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (queuedCount > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsent messages. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queuedCount]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageId = `msg-${Date.now()}`;
    const content = input.trim();

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: messageId,
      content,
      role: 'user',
      timestamp: new Date(),
      status: isOnline ? 'sending' : 'queued',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput('');

    try {
      // Send through offline queue
      await sendMessage({
        conversationId: 'current-conversation-id',
        content,
        attachments: [],
      });

      // Update status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        )
      );

      // Simulate assistant response (in real app, would come from WebSocket/API)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            content: 'This is a simulated response',
            role: 'assistant',
            timestamp: new Date(),
            status: 'sent',
          },
        ]);
      }, 1000);
    } catch (error) {
      // Update status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const handleRetry = async () => {
    await sync();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chat Assistant</h1>
          <div className="flex items-center gap-2">
            {hasErrors && (
              <button
                onClick={clearErrors}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear Errors ({errorCount})
              </button>
            )}
            {queuedCount > 0 && (
              <button
                onClick={handleRetry}
                disabled={isSyncing}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Retry Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline Indicator */}
      <div className="px-4 py-2">
        <OfflineIndicator />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isOnline
                ? 'Type a message...'
                : 'Offline - message will be queued...'
            }
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSyncing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSyncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Queue Status */}
        {queuedCount > 0 && (
          <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {queuedCount} message{queuedCount !== 1 ? 's' : ''} queued
              {isSyncing && ' - syncing...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser ? 'bg-blue-600 text-white' : 'bg-white border'
        )}
      >
        <p className="text-sm">{message.content}</p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </span>

          {/* Status Indicator */}
          {message.status && (
            <StatusIcon status={message.status} isUser={isUser} />
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusIconProps {
  status: Message['status'];
  isUser: boolean;
}

function StatusIcon({ status, isUser }: StatusIconProps) {
  const iconClass = cn(
    'h-3 w-3',
    isUser ? 'text-white/70' : 'text-gray-500'
  );

  switch (status) {
    case 'sending':
      return (
        <div className="flex items-center gap-1">
          <Clock className={cn(iconClass, 'animate-pulse')} />
          <span className="text-xs opacity-70">Sending</span>
        </div>
      );

    case 'queued':
      return (
        <div className="flex items-center gap-1">
          <Clock className={iconClass} />
          <span className="text-xs opacity-70">Queued</span>
        </div>
      );

    case 'sent':
      return (
        <div className="flex items-center gap-1">
          <CheckCircle className={iconClass} />
          <span className="text-xs opacity-70">Sent</span>
        </div>
      );

    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <XCircle className={cn(iconClass, 'text-red-500')} />
          <span className="text-xs opacity-70 text-red-500">Failed</span>
        </div>
      );

    default:
      return null;
  }
}

// Export for use in other components
export { MessageBubble, StatusIcon };
