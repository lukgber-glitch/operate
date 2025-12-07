'use client';

import { useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceWaveform } from './VoiceWaveform';
import type { VoiceRecordingState } from './voice.types';

export interface VoiceRecorderProps {
  state: VoiceRecordingState;
  audioData: any;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  className?: string;
}

/**
 * VoiceRecorder Component
 *
 * Displays recording state with visual feedback
 * Shows interim and final transcripts
 * Handles errors and loading states
 */
export function VoiceRecorder({
  state,
  audioData,
  onStart,
  onStop,
  onClear,
  className,
}: VoiceRecorderProps) {
  const { isRecording, transcript, interimTranscript, error, confidence } = state;

  // Auto-stop on final transcript after delay
  useEffect(() => {
    if (transcript && !interimTranscript && isRecording) {
      const timer = setTimeout(() => {
        onStop();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [transcript, interimTranscript, isRecording, onStop]);

  const hasContent = transcript || interimTranscript;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Recording Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#06BF9D]/20" />
                <Mic className="relative h-4 w-4 text-[#06BF9D]" />
              </div>
              <span className="text-sm font-medium text-[#06BF9D]">Recording...</span>
            </>
          ) : error ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Error</span>
            </>
          ) : state.state === 'processing' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary">Processing...</span>
            </>
          ) : (
            <>
              <MicOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ready</span>
            </>
          )}
        </div>

        {/* Confidence indicator */}
        {confidence > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>

      {/* Waveform Visualization */}
      {isRecording && (
        <div className="relative h-12 bg-muted/30 rounded-2xl overflow-hidden">
          <VoiceWaveform audioData={audioData} isRecording={isRecording} variant="bars" />
        </div>
      )}

      {/* Transcript Display */}
      {hasContent && (
        <div className="min-h-[60px] p-3 bg-muted/50 rounded-2xl border">
          {/* Final transcript */}
          {transcript && (
            <p className="text-sm text-foreground whitespace-pre-wrap mb-1">{transcript}</p>
          )}

          {/* Interim transcript */}
          {interimTranscript && (
            <p className="text-sm text-muted-foreground italic animate-pulse whitespace-pre-wrap">
              {interimTranscript}
            </p>
          )}

          {/* Clear button */}
          {transcript && !isRecording && (
            <button
              onClick={onClear}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear transcript
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error.code}</p>
              <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !hasContent && !error && (
        <div className="p-3 bg-muted/30 rounded-2xl">
          <p className="text-xs text-muted-foreground text-center">
            Click the microphone button to start recording
            <br />
            or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">V</kbd>
          </p>
        </div>
      )}
    </div>
  );
}
