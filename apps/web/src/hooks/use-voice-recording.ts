import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

export interface UseVoiceRecordingOptions {
  /** Language for speech recognition (default: 'en-US') */
  language?: string;
  /** Keep listening after speech ends (default: true) */
  continuous?: boolean;
  /** Show partial results while speaking (default: true) */
  interimResults?: boolean;
  /** Auto-stop after silence in ms (default: 2000, 0 to disable) */
  silenceTimeout?: number;
  /** Max recording duration in ms (default: 60000, 0 for unlimited) */
  maxDuration?: number;
  /** Callback when final transcript is ready */
  onTranscript?: (text: string) => void;
  /** Callback for interim (partial) transcript */
  onInterimTranscript?: (text: string) => void;
  /** Callback when recording starts */
  onStart?: () => void;
  /** Callback when recording ends */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Callback with audio levels for visualization (0-100) */
  onAudioLevel?: (level: number) => void;
}

export interface UseVoiceRecordingReturn {
  /** Current recording state */
  state: RecordingState;
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Final transcript text */
  transcript: string;
  /** Interim (partial) transcript while speaking */
  interimTranscript: string;
  /** Current error message */
  error: string | null;
  /** Current audio level (0-100) for visualization */
  audioLevel: number;
  /** Start recording */
  start: () => Promise<void>;
  /** Stop recording and process */
  stop: () => void;
  /** Toggle recording */
  toggle: () => void;
  /** Cancel recording without processing */
  cancel: () => void;
  /** Clear transcript and error */
  reset: () => void;
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
  onaudiostart?: () => void;
  onsoundstart?: () => void;
  onspeechstart?: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Extend Window interface for browser speech recognition APIs
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': 'No speech detected. Please try again.',
  'audio-capture': 'Microphone not available. Check your device.',
  'not-allowed': 'Microphone permission denied. Please allow access.',
  'network': 'Network error. Please check your connection.',
  'aborted': 'Recording cancelled.',
  'service-not-allowed': 'Speech service not allowed. Try again.',
};

/**
 * useVoiceRecording - Modern hook for voice recording with visual feedback
 *
 * Features:
 * - Web Speech API integration with fallback detection
 * - Real-time interim transcription
 * - Audio level monitoring for visualization
 * - Auto-stop after silence
 * - Maximum duration limit
 * - Comprehensive error handling
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * const voice = useVoiceRecording({
 *   onTranscript: (text) => setMessage(text),
 *   onAudioLevel: (level) => setWaveHeight(level),
 * });
 *
 * return (
 *   <button onClick={voice.toggle}>
 *     {voice.isRecording ? 'Stop' : 'Record'}
 *   </button>
 * );
 * ```
 */
export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    silenceTimeout = 2000,
    maxDuration = 60000,
    onTranscript,
    onInterimTranscript,
    onStart,
    onEnd,
    onError,
    onAudioLevel,
  } = options;

  // State
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isManualStop = useRef(false);
  const accumulatedTranscript = useRef('');

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as WindowWithSpeechRecognition;
      const supported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      setIsSupported(supported);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const win = window as WindowWithSpeechRecognition;
    const SpeechRecognitionClass =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;

        const alternative = result[0];
        if (!alternative) continue;

        if (result.isFinal) {
          final += alternative.transcript;
        } else {
          interim += alternative.transcript;
        }
      }

      // Update interim transcript
      if (interim) {
        setInterimTranscript(interim);
        onInterimTranscript?.(interim);

        // Reset silence timer
        if (silenceTimeout > 0 && silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (!isManualStop.current && recognitionRef.current) {
              recognition.stop();
            }
          }, silenceTimeout);
        }
      }

      // Update final transcript
      if (final) {
        accumulatedTranscript.current += final;
        setTranscript((prev) => prev + final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = ERROR_MESSAGES[event.error] || 'Voice input failed. Please try again.';

      // Don't show error for manual abort
      if (event.error !== 'aborted' || !isManualStop.current) {
        setError(errorMessage);
        setState('error');
        onError?.(errorMessage);
      }

      cleanup();
      isManualStop.current = false;
    };

    recognition.onend = () => {
      const finalText = accumulatedTranscript.current.trim();

      // Only call onTranscript for non-manual stops with actual content
      if (finalText && !isManualStop.current) {
        onTranscript?.(finalText);
      }

      cleanup();
      setState('idle');
      onEnd?.();

      accumulatedTranscript.current = '';
      isManualStop.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      cleanup();
    };
  }, [
    isSupported,
    language,
    continuous,
    interimResults,
    silenceTimeout,
    onTranscript,
    onInterimTranscript,
    onEnd,
    onError,
    cleanup,
  ]);

  // Audio level monitoring
  const startAudioMonitoring = useCallback(
    async (stream: MediaStream) => {
      if (!onAudioLevel) return;

      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average level
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = Math.min(100, Math.round((average / 255) * 100 * 2));

          setAudioLevel(normalizedLevel);
          onAudioLevel(normalizedLevel);

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.warn('Audio monitoring not available:', err);
      }
    },
    [onAudioLevel]
  );

  // Start recording
  const start = useCallback(async () => {
    if (!isSupported || !recognitionRef.current || state === 'recording') {
      return;
    }

    setState('requesting');
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscript.current = '';
    isManualStop.current = false;

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start audio monitoring for visualization
      await startAudioMonitoring(stream);

      // Start speech recognition
      recognitionRef.current.start();
      setState('recording');
      onStart?.();

      // Set up silence timeout
      if (silenceTimeout > 0) {
        silenceTimerRef.current = setTimeout(() => {
          if (!isManualStop.current && recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, silenceTimeout);
      }

      // Set up max duration timeout
      if (maxDuration > 0) {
        maxDurationTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, maxDuration);
      }
    } catch (err) {
      const errorMessage = 'Microphone access denied. Please allow access.';
      setError(errorMessage);
      setState('error');
      onError?.(errorMessage);
      cleanup();
    }
  }, [isSupported, state, silenceTimeout, maxDuration, startAudioMonitoring, onStart, onError, cleanup]);

  // Stop recording
  const stop = useCallback(() => {
    if (!recognitionRef.current || state !== 'recording') return;

    isManualStop.current = true;
    setState('processing');

    // Send accumulated transcript
    const finalText = (accumulatedTranscript.current + interimTranscript).trim();
    if (finalText) {
      onTranscript?.(finalText);
    }

    recognitionRef.current.stop();
  }, [state, interimTranscript, onTranscript]);

  // Toggle recording
  const toggle = useCallback(() => {
    if (state === 'recording') {
      stop();
    } else if (state === 'idle' || state === 'error') {
      start();
    }
  }, [state, start, stop]);

  // Cancel recording
  const cancel = useCallback(() => {
    if (!recognitionRef.current) return;

    isManualStop.current = true;
    accumulatedTranscript.current = '';
    setTranscript('');
    setInterimTranscript('');

    recognitionRef.current.abort();
    cleanup();
    setState('idle');
  }, [cleanup]);

  // Reset state
  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    accumulatedTranscript.current = '';
  }, []);

  return {
    state,
    isRecording: state === 'recording',
    isSupported,
    transcript,
    interimTranscript,
    error,
    audioLevel,
    start,
    stop,
    toggle,
    cancel,
    reset,
  };
}

export default useVoiceRecording;
