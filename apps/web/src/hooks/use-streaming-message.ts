'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface StreamingMessageState {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
}

interface UseStreamingMessageOptions {
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
  onChunk?: (chunk: string) => void;
}

/**
 * useStreamingMessage - Hook for handling streaming AI responses
 *
 * Features:
 * - SSE (Server-Sent Events) support
 * - Character-by-character or chunk-based rendering
 * - Stream interruption handling
 * - Error recovery
 * - Auto-cleanup on unmount
 *
 * @param options - Configuration options
 * @returns Streaming state and control functions
 */
export function useStreamingMessage(options: UseStreamingMessageOptions = {}) {
  const [state, setState] = useState<StreamingMessageState>({
    content: '',
    isStreaming: false,
    isComplete: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { onComplete, onError, onChunk } = options;

  /**
   * Start streaming from an SSE endpoint
   */
  const startStreaming = useCallback(
    async (url: string, body?: Record<string, any>) => {
      // Reset state
      setState({
        content: '',
        isStreaming: true,
        isComplete: false,
        error: null,
      });

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: `HTTP ${response.status}`,
          }));
          throw new Error(errorData.message || 'Failed to start streaming');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let accumulatedContent = '';

        // Read stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              isComplete: true,
            }));
            onComplete?.(accumulatedContent);
            break;
          }

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE format (data: {content}\n\n)
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.content || data.delta || '';

                if (content) {
                  accumulatedContent += content;
                  setState((prev) => ({
                    ...prev,
                    content: accumulatedContent,
                  }));
                  onChunk?.(content);
                }

                // Check for completion or error signals
                if (data.done) {
                  setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    isComplete: true,
                  }));
                  onComplete?.(accumulatedContent);
                  return;
                }

                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // If not JSON, treat as raw content
                if (line.slice(6).trim()) {
                  accumulatedContent += line.slice(6);
                  setState((prev) => ({
                    ...prev,
                    content: accumulatedContent,
                  }));
                  onChunk?.(line.slice(6));
                }
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Stream was intentionally stopped
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            isComplete: false,
          }));
        } else {
          // Actual error
          const errorMessage = error.message || 'Streaming failed';
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            isComplete: false,
            error: errorMessage,
          }));
          onError?.(errorMessage);
        }
      }
    },
    [onComplete, onError, onChunk]
  );

  /**
   * Stop streaming
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopStreaming();
    setState({
      content: '',
      isStreaming: false,
      isComplete: false,
      error: null,
    });
  }, [stopStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    reset,
  };
}
