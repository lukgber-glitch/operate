'use client';

import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
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
 * VoiceInputButton - Speech-to-text voice input component
 *
 * Features:
 * - Browser Web Speech API integration
 * - Visual recording feedback (pulsing animation)
 * - Real-time transcription
 * - Error handling and browser compatibility check
 * - Graceful fallback for unsupported browsers
 * - Cancel recording option
 */
export function VoiceInputButton({
  onTranscript,
  disabled = false,
  className,
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
    recognition.continuous = false; // Stop after single phrase
    recognition.interimResults = false; // Only final results
    recognition.lang = 'en-US'; // Default language

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (!result) return;
      const alternative = result[0];
      if (!alternative) return;
      const transcript = alternative.transcript;
      onTranscript(transcript);
      setIsRecording(false);
      setError(null);
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

      setError(errorMessages[event.error] || 'Voice input failed. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  // Unsupported browser fallback
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-10 w-10 shrink-0 cursor-not-allowed opacity-50', className)}
              disabled
              aria-label="Voice input not supported"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input is not supported in this browser.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try Chrome, Edge, or Safari
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'ghost'}
              size="icon"
              className={cn(
                'h-10 w-10 shrink-0 transition-all',
                isRecording && 'animate-pulse',
                className
              )}
              onClick={handleToggleRecording}
              disabled={disabled}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Recording indicator - pulsing red dot */}
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : isRecording ? (
            <p>Click to stop recording</p>
          ) : (
            <>
              <p>Click to start voice input</p>
              <p className="text-xs text-muted-foreground mt-1">
                Speak clearly into your microphone
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
