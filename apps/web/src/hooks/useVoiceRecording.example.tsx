/**
 * Example usage of useVoiceRecording hook
 *
 * This demonstrates how to record audio using the MediaRecorder API
 * and get an audio blob that can be uploaded to a server or sent to
 * an API like OpenAI Whisper for transcription.
 */

import React from 'react';
import { useVoiceRecording } from './useVoiceRecording';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2 } from 'lucide-react';

export function VoiceRecordingExample() {
  const {
    isRecording,
    isSupported,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    clearError,
  } = useVoiceRecording({
    maxDuration: 60000, // 1 minute max
    onStart: () => {
      console.log('Recording started');
    },
    onStop: (blob) => {
      console.log('Recording stopped, blob size:', blob.size);
      // Here you can upload the blob to your server
      // uploadAudio(blob);
    },
    onError: (error) => {
      console.error('Recording error:', error);
    },
  });

  const handleUpload = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    // Example: Upload to your API
    // const response = await fetch('/api/transcribe', {
    //   method: 'POST',
    //   body: formData,
    // });
    // const { transcript } = await response.json();
    // console.log('Transcript:', transcript);

    console.log('Would upload audio blob:', audioBlob.size, 'bytes');
  };

  if (!isSupported) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10">
        <p className="text-destructive text-sm">
          Voice recording is not supported in this browser.
          Try Chrome, Edge, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Voice Recording Example</h3>

      {/* Recording Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {audioBlob && (
          <>
            <Button
              onClick={clearRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button onClick={handleUpload}>
              Upload to Server
            </Button>
          </>
        )}
      </div>

      {/* Recording Duration */}
      {isRecording && (
        <div className="text-sm text-muted-foreground">
          Recording: {Math.floor(duration / 1000)}s
        </div>
      )}

      {/* Audio Playback */}
      {audioUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Recorded Audio:</p>
          <audio src={audioUrl} controls className="w-full" />
          <p className="text-xs text-muted-foreground">
            Size: {(audioBlob!.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <p className="font-medium">How to use:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Start Recording" to begin</li>
          <li>Speak into your microphone</li>
          <li>Click "Stop Recording" when done</li>
          <li>Listen to the playback or upload to server</li>
          <li>Maximum recording time: 1 minute</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example: Send to OpenAI Whisper API for transcription
 */
export function WhisperTranscriptionExample() {
  const { audioBlob, startRecording, stopRecording, isRecording } = useVoiceRecording();
  const [transcript, setTranscript] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Record'}
      </Button>

      {audioBlob && !loading && (
        <Button onClick={transcribeAudio}>
          Transcribe with Whisper
        </Button>
      )}

      {loading && <p>Transcribing...</p>}

      {transcript && (
        <div className="p-4 border rounded-lg">
          <p className="font-medium mb-2">Transcript:</p>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
