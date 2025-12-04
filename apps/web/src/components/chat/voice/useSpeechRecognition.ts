import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  VoiceInputConfig,
  VoiceRecordingState,
  VoiceInputError,
  VoiceErrorCode,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from './voice.types';

/**
 * useSpeechRecognition Hook
 *
 * Provides speech-to-text functionality using Web Speech API
 * Supports both continuous and push-to-talk modes
 *
 * @param config - Voice input configuration
 * @param onTranscript - Callback when final transcript is available
 * @param onInterimTranscript - Callback for interim results
 */
export function useSpeechRecognition(
  config: VoiceInputConfig,
  onTranscript?: (text: string) => void,
  onInterimTranscript?: (text: string) => void
) {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    state: 'idle',
    transcript: '',
    interimTranscript: '',
    error: null,
    confidence: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStop = useRef(false);

  // Check browser support
  const isSupported = useCallback(() => {
    return !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported()) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'not-supported',
          message: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
        },
      }));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = config.language;
    recognition.continuous = config.continuous ?? (config.mode === 'continuous');
    recognition.interimResults = config.interimResults ?? true;
    recognition.maxAlternatives = config.maxAlternatives ?? 1;

    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isRecording: true,
        state: 'recording',
        error: null,
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        confidence: maxConfidence || prev.confidence,
      }));

      // Trigger callbacks
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim());
      }

      if (interimTranscript && onInterimTranscript) {
        onInterimTranscript(interimTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore aborted errors if manually stopped
      if (event.error === 'aborted' && isManualStop.current) {
        isManualStop.current = false;
        return;
      }

      const errorCode = mapErrorCode(event.error);
      const errorMessage = getErrorMessage(errorCode);

      setState((prev) => ({
        ...prev,
        isRecording: false,
        state: 'error',
        error: {
          code: errorCode,
          message: errorMessage,
        },
      }));
    };

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        state: prev.error ? 'error' : 'idle',
      }));

      // Auto-restart in continuous mode
      if (
        config.mode === 'continuous' &&
        state.isRecording &&
        !isManualStop.current &&
        !state.error
      ) {
        try {
          recognition.start();
        } catch (error) {
          // Ignore if already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [config, isSupported, onTranscript, onInterimTranscript]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported()) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'not-supported',
          message: 'Speech recognition is not supported in this browser.',
        },
      }));
      return;
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'permission-denied',
          message: 'Microphone permission denied. Please allow microphone access.',
        },
      }));
      return;
    }

    if (recognitionRef.current && !state.isRecording) {
      try {
        isManualStop.current = false;
        setState((prev) => ({
          ...prev,
          transcript: '',
          interimTranscript: '',
          error: null,
          confidence: 0,
        }));
        recognitionRef.current.start();
      } catch (error) {
        // Already started or other error
        console.error('Error starting recognition:', error);
      }
    }
  }, [isSupported, state.isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && state.isRecording) {
      isManualStop.current = true;
      recognitionRef.current.stop();
    }
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
      confidence: 0,
    }));
  }, []);

  // Reset error
  const resetError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      state: 'idle',
    }));
  }, []);

  return {
    ...state,
    isSupported: isSupported(),
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript,
    resetError,
  };
}

// Helper: Map browser error codes to our error codes
function mapErrorCode(browserError: string): VoiceErrorCode {
  const errorMap: Record<string, VoiceErrorCode> = {
    'not-allowed': 'permission-denied',
    'no-speech': 'no-speech',
    'audio-capture': 'audio-capture',
    'network': 'network-error',
    aborted: 'aborted',
  };

  return errorMap[browserError] || 'unknown';
}

// Helper: Get user-friendly error messages
function getErrorMessage(code: VoiceErrorCode): string {
  const messages: Record<VoiceErrorCode, string> = {
    'not-supported':
      'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
    'permission-denied':
      'Microphone permission denied. Please allow microphone access in your browser settings.',
    'no-microphone': 'No microphone detected. Please connect a microphone and try again.',
    'network-error': 'Network error occurred. Please check your internet connection.',
    aborted: 'Recording was stopped.',
    'audio-capture': 'Could not capture audio. Please check your microphone.',
    'no-speech': 'No speech detected. Please try again.',
    unknown: 'An unknown error occurred. Please try again.',
  };

  return messages[code];
}
