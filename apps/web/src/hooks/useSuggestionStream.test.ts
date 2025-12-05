import { renderHook, act, waitFor } from '@testing-library/react';
import { useSuggestionStream, SuggestionEvent } from './useSuggestionStream';

/**
 * Mock EventSource
 */
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2;
  }

  // Test helper methods
  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: SuggestionEvent) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  static resetMock() {
    MockEventSource.instances = [];
  }

  static get latestInstance() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
  }),
}));

// Replace global EventSource
global.EventSource = MockEventSource as any;

describe('useSuggestionStream', () => {
  beforeEach(() => {
    MockEventSource.resetMock();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Connection', () => {
    it('should auto-connect on mount', async () => {
      const { result } = renderHook(() => useSuggestionStream());

      expect(result.current.connectionState).toBe('connecting');
      expect(MockEventSource.instances).toHaveLength(1);

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should not auto-connect when autoConnect is false', () => {
      const { result } = renderHook(() =>
        useSuggestionStream({ autoConnect: false })
      );

      expect(result.current.connectionState).toBe('disconnected');
      expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should use correct SSE endpoint with auth token', () => {
      renderHook(() => useSuggestionStream({ baseUrl: 'https://api.example.com' }));

      const instance = MockEventSource.latestInstance;
      expect(instance.url).toContain('https://api.example.com/api/v1/suggestions/stream');
      expect(instance.url).toContain('token=test-token');
    });

    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useSuggestionStream());

      const instance = MockEventSource.latestInstance;
      const closeSpy = jest.spyOn(instance, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should receive and parse suggestion events', async () => {
      const onEvent = jest.fn();
      const { result } = renderHook(() =>
        useSuggestionStream({ onEvent })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const testEvent: SuggestionEvent = {
        type: 'ai_suggestion',
        data: {
          id: 'test-1',
          type: 'classification',
          title: 'Test Suggestion',
          description: 'This is a test',
          confidence: 0.95,
          actionable: true,
        },
      };

      act(() => {
        MockEventSource.latestInstance.simulateMessage(testEvent);
      });

      await waitFor(() => {
        expect(onEvent).toHaveBeenCalledWith(testEvent);
        expect(result.current.lastEvent).toEqual(testEvent);
        expect(result.current.suggestions).toHaveLength(1);
        expect(result.current.suggestions[0]).toEqual(testEvent.data);
      });
    });

    it('should accumulate multiple suggestions', async () => {
      const { result } = renderHook(() => useSuggestionStream());

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const events: SuggestionEvent[] = [
        {
          type: 'ai_suggestion',
          data: {
            id: 'test-1',
            type: 'classification',
            title: 'Suggestion 1',
            description: 'First',
            confidence: 0.9,
            actionable: true,
          },
        },
        {
          type: 'ai_suggestion',
          data: {
            id: 'test-2',
            type: 'deduction',
            title: 'Suggestion 2',
            description: 'Second',
            confidence: 0.8,
            actionable: true,
          },
        },
      ];

      act(() => {
        events.forEach((event) => {
          MockEventSource.latestInstance.simulateMessage(event);
        });
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });
    });

    it('should update existing suggestions', async () => {
      const { result } = renderHook(() => useSuggestionStream());

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const initialEvent: SuggestionEvent = {
        type: 'ai_suggestion',
        data: {
          id: 'test-1',
          type: 'classification',
          title: 'Initial',
          description: 'First version',
          confidence: 0.7,
          actionable: true,
        },
      };

      act(() => {
        MockEventSource.latestInstance.simulateMessage(initialEvent);
      });

      const updatedEvent: SuggestionEvent = {
        type: 'ai_suggestion',
        data: {
          id: 'test-1',
          type: 'classification',
          title: 'Updated',
          description: 'Second version',
          confidence: 0.95,
          actionable: true,
        },
      };

      act(() => {
        MockEventSource.latestInstance.simulateMessage(updatedEvent);
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(1);
        expect(result.current.suggestions[0].title).toBe('Updated');
        expect(result.current.suggestions[0].confidence).toBe(0.95);
      });
    });

    it('should handle ping events without triggering onEvent callback', async () => {
      const onEvent = jest.fn();
      const { result } = renderHook(() =>
        useSuggestionStream({ onEvent })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const pingEvent: SuggestionEvent = {
        type: 'ping',
        data: { timestamp: Date.now() },
      };

      act(() => {
        MockEventSource.latestInstance.simulateMessage(pingEvent);
      });

      await waitFor(() => {
        expect(result.current.lastEvent).toEqual(pingEvent);
        // onEvent should not be called for ping events
        expect(onEvent).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useSuggestionStream({ onError })
      );

      act(() => {
        MockEventSource.latestInstance.simulateError();
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('error');
        expect(onError).toHaveBeenCalled();
        expect(result.current.lastError).toBeTruthy();
      });
    });

    it('should handle malformed event data', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useSuggestionStream({ onError })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      // Simulate malformed JSON
      act(() => {
        if (MockEventSource.latestInstance.onmessage) {
          MockEventSource.latestInstance.onmessage(
            new MessageEvent('message', { data: 'invalid json' })
          );
        }
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(result.current.lastError?.message).toContain('parse');
      });
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on error', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          initialReconnectDelay: 100,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const initialInstancesCount = MockEventSource.instances.length;

      act(() => {
        MockEventSource.latestInstance.simulateError();
      });

      // Fast-forward time to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBeGreaterThan(initialInstancesCount);
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
      });
    });

    it('should use exponential backoff for reconnection', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          initialReconnectDelay: 1000,
          maxReconnectDelay: 10000,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      // First error
      act(() => {
        MockEventSource.latestInstance.simulateError();
      });

      // Should reconnect after ~1s
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Second error
      act(() => {
        MockEventSource.latestInstance.simulateError();
      });

      // Should reconnect after ~2s (exponential)
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(2);
      });
    });

    it('should respect maxReconnectAttempts', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          maxReconnectAttempts: 3,
          initialReconnectDelay: 100,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      // Trigger 4 errors (more than max attempts)
      for (let i = 0; i < 4; i++) {
        act(() => {
          MockEventSource.latestInstance.simulateError();
          jest.advanceTimersByTime(200);
        });
      }

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeLessThanOrEqual(3);
        expect(result.current.connectionState).toBe('disconnected');
      });
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          initialReconnectDelay: 100,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      act(() => {
        MockEventSource.latestInstance.simulateError();
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
      });

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });
  });

  describe('Manual Controls', () => {
    it('should manually reconnect', async () => {
      const { result } = renderHook(() => useSuggestionStream());

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const initialInstancesCount = MockEventSource.instances.length;

      act(() => {
        result.current.reconnect();
      });

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBeGreaterThan(initialInstancesCount);
      });
    });

    it('should manually disconnect', async () => {
      const { result } = renderHook(() => useSuggestionStream());

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const instance = MockEventSource.latestInstance;
      const closeSpy = jest.spyOn(instance, 'close');

      act(() => {
        result.current.disconnect();
      });

      await waitFor(() => {
        expect(closeSpy).toHaveBeenCalled();
        expect(result.current.connectionState).toBe('disconnected');
      });
    });
  });

  describe('Heartbeat', () => {
    it('should timeout and reconnect if no heartbeat received', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          heartbeatTimeout: 5000,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      const initialInstancesCount = MockEventSource.instances.length;

      // Fast-forward past heartbeat timeout
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        // Should have triggered reconnection
        expect(MockEventSource.instances.length).toBeGreaterThan(initialInstancesCount);
      });
    });

    it('should reset heartbeat timer on message', async () => {
      const { result } = renderHook(() =>
        useSuggestionStream({
          heartbeatTimeout: 5000,
        })
      );

      act(() => {
        MockEventSource.latestInstance.simulateOpen();
      });

      // Send ping at 4s (before timeout)
      act(() => {
        jest.advanceTimersByTime(4000);
        MockEventSource.latestInstance.simulateMessage({
          type: 'ping',
          data: { timestamp: Date.now() },
        });
      });

      // Advance another 4s (total 8s, but heartbeat was reset)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Should still be connected (no timeout)
      expect(result.current.connectionState).toBe('connected');
    });
  });
});
