'use client';

import { Mic, MicOff, Loader2, AlertCircle, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
  disabled?: boolean;
  className?: string;
  language?: string;
  autoStopDelay?: number;
  showTranscript?: boolean;
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

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

/**
 * VoiceInput Component
 *
 * Allows speech-to-text input for the chat using Web Speech API
 *
 * Features:
 * - Microphone button that starts/stops recording
 * - Visual feedback with pulsing animation while recording
 * - Transcript preview while speaking
 * - Auto-stop after silence
 * - Error handling for browser support
 * - Mobile-friendly touch targets
 *
 * Browser Support: Chrome, Edge, Safari (webkit)
 */
export function VoiceInput({
  onTranscript,
  onRecordingStart,
  onRecordingEnd,
  disabled = false,
  className,
  language = 'en-US',
  autoStopDelay = 2000,
  showTranscript = true,
}: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualStop = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show interim results
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
      if (interim) {
        setInterimTranscript(interim);
        setState('recording');

        // Reset silence timer on speech detection
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-stop after silence
        silenceTimerRef.current = setTimeout(() => {
          if (!isManualStop.current && recognitionRef.current) {
            handleStopRecording();
          }
        }, autoStopDelay);
      }

      if (final) {
        setFinalTranscript((prev) => prev + final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // User-friendly error messages
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone access denied or unavailable.',
        'not-allowed': 'Microphone permission denied.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Recording cancelled.',
      };

      const errorMessage = errorMessages[event.error] || 'Voice input failed. Please try again.';

      // Don't show error for manual abort
      if (event.error !== 'aborted' || !isManualStop.current) {
        setError(errorMessage);
        setState('error');
      }

      isManualStop.current = false;
    };

    recognition.onend = () => {
      // Send final transcript if available
      const fullTranscript = (finalTranscript + interimTranscript).trim();
      if (fullTranscript && !isManualStop.current) {
        onTranscript(fullTranscript);
      }

      // Cleanup
      setInterimTranscript('');
      setFinalTranscript('');
      setState('idle');
      onRecordingEnd?.();

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
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
  }, [language, autoStopDelay]); // Only reinitialize if language or autoStopDelay changes

  const handleStartRecording = useCallback(async () => {
    if (!recognitionRef.current || state === 'recording') return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Reset state
      setError(null);
      setInterimTranscript('');
      setFinalTranscript('');
      isManualStop.current = false;

      // Start recognition
      recognitionRef.current.start();
      setState('recording');
      onRecordingStart?.();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to access microphone. Please check permissions.');
      setState('error');
    }
  }, [state, onRecordingStart]);

  const handleStopRecording = useCallback(() => {
    if (!recognitionRef.current || state !== 'recording') return;

    isManualStop.current = true;
    setState('processing');

    // Send accumulated transcript
    const fullTranscript = (finalTranscript + interimTranscript).trim();
    if (fullTranscript) {
      onTranscript(fullTranscript);
    }

    recognitionRef.current.stop();
  }, [state, finalTranscript, interimTranscript, onTranscript]);

  const handleToggleRecording = useCallback(() => {
    if (state === 'recording') {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [state, handleStartRecording, handleStopRecording]);

  const handleClearError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  // Not supported browser fallback
  if (!isSupported) {
    return (
      <div className={cn('relative', className)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 cursor-not-allowed opacity-50',
            'min-h-[44px] min-w-[44px]' // Touch-friendly
          )}
          disabled
          aria-label="Voice input not supported"
          title="Voice input is not supported in this browser. Try Chrome, Edge, or Safari."
        >
          <MicOff className="h-4 w-4" />
        </Button>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Voice input not supported
          <br />
          <span className="text-muted-foreground">Try Chrome, Edge, or Safari</span>
        </div>
      </div>
    );
  }

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const hasError = state === 'error';
  const currentTranscript = interimTranscript || finalTranscript;

  return (
    <div className={cn('relative', className)}>
      {/* Microphone Button */}
      <div className="relative">
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'ghost'}
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 transition-all relative',
            'min-h-[44px] min-w-[44px]', // Touch-friendly
            isRecording && 'voice-recording', // Animation class
            className
          )}
          onClick={handleToggleRecording}
          disabled={disabled || isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
          title={isRecording ? 'Click to stop recording' : 'Click to start voice input'}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Pulsing indicator while recording */}
        {isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
      </div>

      {/* Transcript Preview */}
      {showTranscript && currentTranscript && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-2"
          style={{
            minWidth: '200px',
            maxWidth: '400px',
          }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium mb-1 text-muted-foreground">
                {interimTranscript ? 'Listening...' : 'Transcript'}
              </p>
              <p className={cn(
                'text-sm',
                interimTranscript && 'italic text-muted-foreground animate-pulse'
              )}>
                {currentTranscript}
              </p>
            </div>
            {isRecording && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleStopRecording}
                aria-label="Stop and send"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2"
          style={{
            minWidth: '200px',
            maxWidth: '400px',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleClearError}
              aria-label="Dismiss error"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* CSS for pulsing animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .voice-recording {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
