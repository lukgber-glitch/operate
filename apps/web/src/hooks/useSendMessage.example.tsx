/**
 * useSendMessage Hook - Usage Examples
 *
 * This file demonstrates various ways to use the useSendMessage hook
 * for optimistic message sending with rollback capabilities.
 */

'use client';

import { useSendMessage } from './useSendMessage';
import type { ChatMessage } from '@/types/chat';

/**
 * Example 1: Basic Usage
 * Simple message sending with optimistic updates
 */
export function BasicExample({ conversationId }: { conversationId: string }) {
  const { sendMessage, isSending, pendingMessages } = useSendMessage(conversationId);

  const handleSend = async (content: string) => {
    const message = await sendMessage(content);
    if (message) {
      console.log('Message sent successfully:', message);
    }
  };

  return (
    <div>
      <button onClick={() => handleSend('Hello!')} disabled={isSending}>
        Send Message
      </button>
      {pendingMessages.length > 0 && <div>Sending {pendingMessages.length} messages...</div>}
    </div>
  );
}

/**
 * Example 2: With Callbacks
 * Handle success and error events
 */
export function WithCallbacksExample({ conversationId }: { conversationId: string }) {
  const { sendMessage, failedMessages } = useSendMessage(conversationId, {
    onSuccess: (message) => {
      console.log('Message sent:', message);
      // Update UI, show toast, etc.
    },
    onError: (error, tempId) => {
      console.error('Send failed:', error, tempId);
      // Show error notification
    },
    onRetrySuccess: (message, tempId) => {
      console.log('Retry successful:', message, tempId);
      // Show success notification
    },
    maxRetries: 3,
  });

  return (
    <div>
      {failedMessages.map((msg) => (
        <div key={msg.tempId} className="error-message">
          <p>{msg.content}</p>
          <p className="error">{msg.error}</p>
          <p>Retry attempts: {msg.retryCount}/3</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 3: With Attachments
 * Send messages with file attachments
 */
export function WithAttachmentsExample({ conversationId }: { conversationId: string }) {
  const { sendMessage, isSending } = useSendMessage(conversationId);

  const handleFileUpload = async (files: FileList) => {
    const attachments = Array.from(files);
    const message = await sendMessage('Here are the files you requested', attachments);

    if (message) {
      console.log('Message with attachments sent:', message);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        disabled={isSending}
      />
    </div>
  );
}

/**
 * Example 4: Retry Failed Messages
 * Show retry UI for failed messages
 */
export function RetryExample({ conversationId }: { conversationId: string }) {
  const { failedMessages, retryMessage, cancelMessage, clearFailedMessages } =
    useSendMessage(conversationId);

  return (
    <div>
      {failedMessages.length > 0 && (
        <div className="failed-messages-panel">
          <h3>Failed Messages</h3>
          <button onClick={clearFailedMessages}>Clear All</button>

          {failedMessages.map((msg) => (
            <div key={msg.tempId} className="failed-message">
              <p>{msg.content}</p>
              <p className="error">{msg.error}</p>

              <div className="actions">
                <button onClick={() => retryMessage(msg.tempId)} disabled={msg.retryCount >= 3}>
                  Retry ({msg.retryCount}/3)
                </button>
                <button onClick={() => cancelMessage(msg.tempId)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Full Chat UI Integration
 * Complete example showing all features
 */
export function FullChatExample({ conversationId }: { conversationId: string }) {
  const {
    sendMessage,
    retryMessage,
    cancelMessage,
    pendingMessages,
    failedMessages,
    isSending,
    getAllOptimisticMessages,
  } = useSendMessage(conversationId, {
    onSuccess: (message) => {
      console.log('✓ Sent:', message.content);
    },
    onError: (error, tempId) => {
      console.error('✗ Failed:', error);
    },
  });

  // Combine optimistic messages with regular messages for display
  const allOptimisticMessages = getAllOptimisticMessages();

  const handleSubmit = async (content: string, files?: File[]) => {
    await sendMessage(content, files);
  };

  return (
    <div className="chat-container">
      {/* Message List */}
      <div className="messages">
        {/* Regular messages from API */}
        {/* ... */}

        {/* Optimistic messages (pending + failed) */}
        {allOptimisticMessages.map((msg) => (
          <div
            key={msg.tempId}
            className={`message optimistic ${msg.status}`}
            data-status={msg.status}
          >
            <div className="message-content">{msg.content}</div>

            {/* Status indicator */}
            {msg.status === 'sending' && <span className="status">Sending...</span>}
            {msg.status === 'error' && (
              <div className="error-actions">
                <span className="error-text">{msg.error}</span>
                <button onClick={() => retryMessage(msg.tempId)}>Retry</button>
                <button onClick={() => cancelMessage(msg.tempId)}>Cancel</button>
              </div>
            )}

            {/* Attachments */}
            {msg.metadata?.attachments && (
              <div className="attachments">
                {msg.metadata.attachments.map((att) => (
                  <div key={att.id} className="attachment">
                    {att.name} ({att.size} bytes)
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="input-area">
        <input
          type="text"
          placeholder="Type a message..."
          disabled={isSending}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />

        {/* Pending indicator */}
        {pendingMessages.length > 0 && (
          <div className="pending-indicator">
            Sending {pendingMessages.length} message{pendingMessages.length > 1 ? 's' : ''}...
          </div>
        )}

        {/* Failed messages notification */}
        {failedMessages.length > 0 && (
          <div className="failed-notification">
            {failedMessages.length} message{failedMessages.length > 1 ? 's' : ''} failed to send
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Message Ordering
 * Ensure proper ordering of optimistic and real messages
 */
export function MessageOrderingExample({
  conversationId,
  existingMessages,
}: {
  conversationId: string;
  existingMessages: ChatMessage[];
}) {
  const { getAllOptimisticMessages } = useSendMessage(conversationId);

  // Combine and sort all messages
  const allMessages = [
    ...existingMessages,
    ...getAllOptimisticMessages().map(
      (msg): ChatMessage => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        status: msg.status,
        metadata: msg.metadata,
      })
    ),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div>
      {allMessages.map((msg) => (
        <div key={msg.id} className="message">
          <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
          <span className="content">{msg.content}</span>
          {msg.status && <span className="status">{msg.status}</span>}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 7: Cancel Pending Messages
 * Allow users to cancel messages before they're sent
 */
export function CancelPendingExample({ conversationId }: { conversationId: string }) {
  const { sendMessage, pendingMessages, cancelMessage } = useSendMessage(conversationId);

  const sendSlowMessage = async () => {
    // This will be slow if API is slow
    await sendMessage('This is a slow message...');
  };

  return (
    <div>
      <button onClick={sendSlowMessage}>Send Slow Message</button>

      {pendingMessages.map((msg) => (
        <div key={msg.tempId} className="pending-message">
          <p>{msg.content}</p>
          <button onClick={() => cancelMessage(msg.tempId)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}
