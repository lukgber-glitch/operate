/**
 * useSendMessage Hook - Unit Tests
 * Tests for optimistic message sending with rollback capabilities
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSendMessage } from './useSendMessage';
import { api } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  api: {
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('useSendMessage', () => {
  const conversationId = 'test-conversation-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message optimistically and update on success', async () => {
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useSendMessage(conversationId));

      let sentMessage;

      await act(async () => {
        sentMessage = await result.current.sendMessage('Hello');
      });

      // Should add to pending immediately
      expect(result.current.pendingMessages).toHaveLength(0); // Removed after success

      // Should call API
      expect(mockApi.post).toHaveBeenCalledWith(
        `/chatbot/conversations/${conversationId}/messages`,
        { content: 'Hello' },
        expect.any(Object)
      );

      // Should return real message
      expect(sentMessage).toEqual(mockResponse.data.userMessage);

      // Should clear pending
      expect(result.current.pendingMessages).toHaveLength(0);
      expect(result.current.failedMessages).toHaveLength(0);
    });

    it('should handle send failure and move to failed messages', async () => {
      const mockError = new Error('Network error');
      mockApi.post.mockRejectedValueOnce(mockError);

      const onError = jest.fn();
      const { result } = renderHook(() => useSendMessage(conversationId, { onError }));

      let sentMessage;

      await act(async () => {
        sentMessage = await result.current.sendMessage('Hello');
      });

      // Should return null on failure
      expect(sentMessage).toBeNull();

      // Should move to failed messages
      expect(result.current.failedMessages).toHaveLength(1);
      expect(result.current.failedMessages[0].content).toBe('Hello');
      expect(result.current.failedMessages[0].status).toBe('error');
      expect(result.current.failedMessages[0].error).toBe('Network error');

      // Should call error callback
      expect(onError).toHaveBeenCalledWith('Network error', expect.any(String));

      // Should clear pending
      expect(result.current.pendingMessages).toHaveLength(0);
    });

    it('should reject empty messages', async () => {
      const { result } = renderHook(() => useSendMessage(conversationId));

      await expect(result.current.sendMessage('')).rejects.toThrow(
        'Message content cannot be empty'
      );
      await expect(result.current.sendMessage('   ')).rejects.toThrow(
        'Message content cannot be empty'
      );
    });

    it('should send messages with attachments using FormData', async () => {
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Check these files',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useSendMessage(conversationId));

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.sendMessage('Check these files', [mockFile]);
      });

      // Should call API with FormData
      const callArgs = mockApi.post.mock.calls[0];
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    it('should call onSuccess callback', async () => {
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useSendMessage(conversationId, { onSuccess }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResponse.data.userMessage);
    });

    it('should set isSending flag during send', async () => {
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      // Delay the response
      mockApi.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      );

      const { result } = renderHook(() => useSendMessage(conversationId));

      expect(result.current.isSending).toBe(false);

      act(() => {
        result.current.sendMessage('Hello');
      });

      // Should be true while sending
      await waitFor(() => expect(result.current.isSending).toBe(true));

      // Should be false after completion
      await waitFor(() => expect(result.current.isSending).toBe(false));
    });
  });

  describe('retryMessage', () => {
    it('should retry a failed message', async () => {
      // First call fails
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Send and fail
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.failedMessages).toHaveLength(1);
      const tempId = result.current.failedMessages[0].tempId;

      // Second call succeeds
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      // Retry
      let retriedMessage;
      await act(async () => {
        retriedMessage = await result.current.retryMessage(tempId);
      });

      // Should succeed
      expect(retriedMessage).toEqual(mockResponse.data.userMessage);

      // Should remove from failed
      expect(result.current.failedMessages).toHaveLength(0);
    });

    it('should increment retry count on each retry', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Initial send
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      const tempId = result.current.failedMessages[0].tempId;

      // Retry 1
      await act(async () => {
        await result.current.retryMessage(tempId);
      });

      expect(result.current.failedMessages[0].retryCount).toBe(1);

      // Retry 2
      await act(async () => {
        await result.current.retryMessage(tempId);
      });

      expect(result.current.failedMessages[0].retryCount).toBe(2);
    });

    it('should respect maxRetries limit', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSendMessage(conversationId, { maxRetries: 2 }));

      // Initial send
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      const tempId = result.current.failedMessages[0].tempId;

      // Retry 1
      await act(async () => {
        await result.current.retryMessage(tempId);
      });

      // Retry 2
      await act(async () => {
        await result.current.retryMessage(tempId);
      });

      // Retry 3 should fail
      await expect(
        act(async () => {
          await result.current.retryMessage(tempId);
        })
      ).rejects.toThrow('Maximum retry attempts exceeded');
    });

    it('should call onRetrySuccess callback', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      const onRetrySuccess = jest.fn();
      const { result } = renderHook(() =>
        useSendMessage(conversationId, { onRetrySuccess })
      );

      // Send and fail
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      const tempId = result.current.failedMessages[0].tempId;

      // Retry and succeed
      const mockResponse = {
        data: {
          userMessage: {
            id: 'real-id',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
            status: 'sent' as const,
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.retryMessage(tempId);
      });

      expect(onRetrySuccess).toHaveBeenCalledWith(mockResponse.data.userMessage, tempId);
    });
  });

  describe('cancelMessage', () => {
    it('should remove message from pending', async () => {
      // Delay the response to keep it pending
      mockApi.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Start sending
      act(() => {
        result.current.sendMessage('Hello');
      });

      await waitFor(() => expect(result.current.pendingMessages).toHaveLength(1));

      const tempId = result.current.pendingMessages[0].tempId;

      // Cancel
      act(() => {
        result.current.cancelMessage(tempId);
      });

      // Should remove from pending
      expect(result.current.pendingMessages).toHaveLength(0);
    });

    it('should abort API request', async () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn(() => ({
        abort: abortSpy,
        signal: {} as AbortSignal,
      })) as any;

      mockApi.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Start sending
      act(() => {
        result.current.sendMessage('Hello');
      });

      await waitFor(() => expect(result.current.pendingMessages).toHaveLength(1));

      const tempId = result.current.pendingMessages[0].tempId;

      // Cancel
      act(() => {
        result.current.cancelMessage(tempId);
      });

      // Should abort request
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('clearFailedMessages', () => {
    it('should clear all failed messages', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Send multiple messages that will fail
      await act(async () => {
        await result.current.sendMessage('Message 1');
        await result.current.sendMessage('Message 2');
        await result.current.sendMessage('Message 3');
      });

      expect(result.current.failedMessages).toHaveLength(3);

      // Clear all
      act(() => {
        result.current.clearFailedMessages();
      });

      expect(result.current.failedMessages).toHaveLength(0);
    });
  });

  describe('getAllOptimisticMessages', () => {
    it('should combine and sort pending and failed messages', async () => {
      mockApi.post
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10000)));

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Send one that fails
      await act(async () => {
        await result.current.sendMessage('Failed message');
      });

      // Send one that's pending
      act(() => {
        result.current.sendMessage('Pending message');
      });

      await waitFor(() => expect(result.current.pendingMessages).toHaveLength(1));

      const allMessages = result.current.getAllOptimisticMessages();

      expect(allMessages).toHaveLength(2);
      expect(allMessages.map((m) => m.content)).toContain('Failed message');
      expect(allMessages.map((m) => m.content)).toContain('Pending message');
    });

    it('should sort messages by timestamp', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSendMessage(conversationId));

      // Send messages with delays to ensure different timestamps
      await act(async () => {
        await result.current.sendMessage('Message 1');
        await new Promise((resolve) => setTimeout(resolve, 10));
        await result.current.sendMessage('Message 2');
        await new Promise((resolve) => setTimeout(resolve, 10));
        await result.current.sendMessage('Message 3');
      });

      const allMessages = result.current.getAllOptimisticMessages();

      expect(allMessages[0].content).toBe('Message 1');
      expect(allMessages[1].content).toBe('Message 2');
      expect(allMessages[2].content).toBe('Message 3');
    });
  });
});
