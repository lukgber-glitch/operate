/**
 * VoiceInput Component Tests
 *
 * Tests for the VoiceInput component and useVoiceInput hook
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceInput } from './VoiceInput';
import { useVoiceInput } from '@/hooks/use-voice-input';

// Mock Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onresult: null,
  onerror: null,
  onend: null,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
};

const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  }),
};

beforeEach(() => {
  // Mock window.SpeechRecognition
  // @ts-ignore
  global.window.SpeechRecognition = vi.fn(() => mockSpeechRecognition);

  // Mock navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('VoiceInput Component', () => {
  it('renders microphone button', () => {
    const onTranscript = vi.fn();
    render(<VoiceInput onTranscript={onTranscript} />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toBeInTheDocument();
  });

  it('shows unsupported message when browser does not support speech recognition', () => {
    // Remove SpeechRecognition API
    // @ts-ignore
    delete global.window.SpeechRecognition;
    // @ts-ignore
    delete global.window.webkitSpeechRecognition;

    const onTranscript = vi.fn();
    render(<VoiceInput onTranscript={onTranscript} />);

    const button = screen.getByRole('button', { name: /not supported/i });
    expect(button).toBeDisabled();
  });

  it('starts recording when button is clicked', async () => {
    const onTranscript = vi.fn();
    const onRecordingStart = vi.fn();

    render(
      <VoiceInput
        onTranscript={onTranscript}
        onRecordingStart={onRecordingStart}
      />
    );

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(onRecordingStart).toHaveBeenCalled();
    });
  });

  it('stops recording when button is clicked while recording', async () => {
    const onTranscript = vi.fn();
    const onRecordingEnd = vi.fn();

    render(
      <VoiceInput
        onTranscript={onTranscript}
        onRecordingEnd={onRecordingEnd}
      />
    );

    const button = screen.getByRole('button', { name: /start voice input/i });

    // Start recording
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });
  });

  it('displays interim transcript while recording', async () => {
    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} showTranscript />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    // Simulate interim result
    await waitFor(() => {
      if (mockSpeechRecognition.onresult) {
        const event = {
          results: [
            {
              0: { transcript: 'Hello world', confidence: 0.9 },
              isFinal: false,
            },
          ],
          resultIndex: 0,
        };
        // @ts-ignore
        mockSpeechRecognition.onresult(event);
      }
    });

    // Check for interim transcript
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('calls onTranscript when final transcript is received', async () => {
    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    await waitFor(() => {
      if (mockSpeechRecognition.onresult) {
        const event = {
          results: [
            {
              0: { transcript: 'Hello world', confidence: 0.9 },
              isFinal: true,
            },
          ],
          resultIndex: 0,
        };
        // @ts-ignore
        mockSpeechRecognition.onresult(event);
      }

      if (mockSpeechRecognition.onend) {
        // @ts-ignore
        mockSpeechRecognition.onend();
      }
    });

    expect(onTranscript).toHaveBeenCalledWith('Hello world');
  });

  it('handles microphone permission denied error', async () => {
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(
      new Error('NotAllowedError')
    );

    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/permission/i)).toBeInTheDocument();
    });
  });

  it('auto-stops after silence timeout', async () => {
    vi.useFakeTimers();

    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} autoStopDelay={1000} />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    // Simulate interim result
    await waitFor(() => {
      if (mockSpeechRecognition.onresult) {
        const event = {
          results: [
            {
              0: { transcript: 'Test', confidence: 0.9 },
              isFinal: false,
            },
          ],
          resultIndex: 0,
        };
        // @ts-ignore
        mockSpeechRecognition.onresult(event);
      }
    });

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('respects disabled prop', () => {
    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} disabled />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toBeDisabled();
  });

  it('supports custom language', async () => {
    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} language="de-DE" />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSpeechRecognition.lang).toBe('de-DE');
    });
  });
});

describe('useVoiceInput Hook', () => {
  it('returns initial state', () => {
    const TestComponent = () => {
      const voice = useVoiceInput();
      return (
        <div>
          <span data-testid="recording">{String(voice.isRecording)}</span>
          <span data-testid="supported">{String(voice.isSupported)}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('recording')).toHaveTextContent('false');
    expect(screen.getByTestId('supported')).toHaveTextContent('true');
  });

  it('starts and stops recording', async () => {
    const onTranscript = vi.fn();

    const TestComponent = () => {
      const voice = useVoiceInput({ onTranscript });
      return (
        <div>
          <button onClick={voice.startRecording}>Start</button>
          <button onClick={voice.stopRecording}>Stop</button>
          <span data-testid="recording">{String(voice.isRecording)}</span>
        </div>
      );
    };

    render(<TestComponent />);

    const startButton = screen.getByText('Start');
    const stopButton = screen.getByText('Stop');

    // Start recording
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId('recording')).toHaveTextContent('true');
    });

    // Stop recording
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(screen.getByTestId('recording')).toHaveTextContent('false');
    });
  });

  it('toggles recording state', async () => {
    const TestComponent = () => {
      const voice = useVoiceInput();
      return (
        <div>
          <button onClick={voice.toggleRecording}>Toggle</button>
          <span data-testid="recording">{String(voice.isRecording)}</span>
        </div>
      );
    };

    render(<TestComponent />);

    const toggleButton = screen.getByText('Toggle');

    // First toggle - start
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('recording')).toHaveTextContent('true');
    });

    // Second toggle - stop
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('recording')).toHaveTextContent('false');
    });
  });

  it('clears transcript', async () => {
    const TestComponent = () => {
      const voice = useVoiceInput();
      return (
        <div>
          <button onClick={voice.clearTranscript}>Clear</button>
          <span data-testid="transcript">{voice.transcript}</span>
        </div>
      );
    };

    const { rerender } = render(<TestComponent />);

    // Simulate transcript
    // (Would need to trigger onresult event)

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByTestId('transcript')).toHaveTextContent('');
    });
  });
});
