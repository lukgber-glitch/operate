import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoStopDelay?: number;
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// Browser speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event & { error: string; message?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * useVoiceInput Hook
 *
 * Provides speech-to-text functionality using Web Speech API
 *
 * @param options - Configuration options
 * @returns Voice input state and control functions
 *
 * @example
 * ```tsx
 * const voice = useVoiceInput({
 *   language: 'en-US',
 *   onTranscript: (text) => setMessage(text),
 * });
 *
 * return (
 *   <button onClick={voice.toggleRecording}>
 *     {voice.isRecording ? 'Stop' : 'Start'} Recording
 *   </button>
 * );
 * ```
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    autoStopDelay = 2000,
    onTranscript,
    onInterimTranscript,
    onStart,
    onEnd,
    onError,
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualStop = useRef(false);
  const accumulatedTranscript = useRef('');

  // Check browser support
  const checkSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const isSupported = checkSupport();
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;

        const alternative = result[0];
        if (!alternative) continue;

        const transcript = alternative.transcript;

        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update state
      setState((prev) => ({
        ...prev,
        interimTranscript: interim,
        transcript: prev.transcript + final,
      }));

      // Callbacks
      if (interim && onInterimTranscript) {
        onInterimTranscript(interim);
      }

      if (final) {
        accumulatedTranscript.current += final;
        if (onTranscript) {
          onTranscript(final);
        }
      }

      // Auto-stop after silence
      if (autoStopDelay > 0) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
          if (!isManualStop.current && recognitionRef.current) {
            recognition.stop();
          }
        }, autoStopDelay);
      }
    };

    recognition.onerror = (event) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone access denied or unavailable.',
        'not-allowed': 'Microphone permission denied.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Recording cancelled.',
      };

      const errorMessage =
        errorMessages[event.error] || 'Voice input failed. Please try again.';

      // Don't show error for manual abort
      if (event.error !== 'aborted' || !isManualStop.current) {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
          error: errorMessage,
        }));

        if (onError) {
          onError(errorMessage);
        }
      }

      isManualStop.current = false;
    };

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
      }));

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (onEnd) {
        onEnd();
      }

      // Send final accumulated transcript
      if (accumulatedTranscript.current && onTranscript) {
        onTranscript(accumulatedTranscript.current);
      }

      accumulatedTranscript.current = '';
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [
    language,
    continuous,
    interimResults,
    autoStopDelay,
    onTranscript,
    onInterimTranscript,
    onStart,
    onEnd,
    onError,
    checkSupport,
  ]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!state.isSupported || !recognitionRef.current || state.isRecording) {
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Reset state
      setState((prev) => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        transcript: '',
        interimTranscript: '',
        error: null,
      }));

      accumulatedTranscript.current = '';
      isManualStop.current = false;

      // Start recognition
      recognitionRef.current.start();

      if (onStart) {
        onStart();
      }
    } catch (err) {
      const error = 'Failed to access microphone. Please check permissions.';
      setState((prev) => ({
        ...prev,
        error,
      }));

      if (onError) {
        onError(error);
      }
    }
  }, [state.isSupported, state.isRecording, onStart, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !state.isRecording) return;

    isManualStop.current = true;
    setState((prev) => ({
      ...prev,
      isProcessing: true,
    }));

    recognitionRef.current.stop();
  }, [state.isRecording]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }));
    accumulatedTranscript.current = '';
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript,
    clearError,
  };
}
