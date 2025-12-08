import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseVoiceRecordingOptions {
  /**
   * Maximum recording duration in milliseconds
   * @default 300000 (5 minutes)
   */
  maxDuration?: number;

  /**
   * MIME type for the recording
   * @default 'audio/webm;codecs=opus' (fallback to 'audio/mp4' on Safari)
   */
  mimeType?: string;

  /**
   * Called when recording starts
   */
  onStart?: () => void;

  /**
   * Called when recording stops
   */
  onStop?: (audioBlob: Blob) => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: string) => void;

  /**
   * Called when max duration is reached
   */
  onMaxDuration?: () => void;
}

export interface UseVoiceRecordingReturn {
  /**
   * Whether recording is currently active
   */
  isRecording: boolean;

  /**
   * Whether voice recording is supported in this browser
   */
  isSupported: boolean;

  /**
   * Current recording duration in milliseconds
   */
  duration: number;

  /**
   * The recorded audio blob (available after recording stops)
   */
  audioBlob: Blob | null;

  /**
   * Audio URL for playback (automatically created from audioBlob)
   */
  audioUrl: string | null;

  /**
   * Error message if recording failed
   */
  error: string | null;

  /**
   * Start recording audio
   */
  startRecording: () => Promise<void>;

  /**
   * Stop recording audio
   */
  stopRecording: () => void;

  /**
   * Clear the recorded audio and reset state
   */
  clearRecording: () => void;

  /**
   * Clear error message
   */
  clearError: () => void;
}

/**
 * useVoiceRecording Hook
 *
 * Records audio using Web Audio API and MediaRecorder.
 * Returns the recorded audio as a Blob that can be uploaded or played back.
 *
 * Features:
 * - Uses MediaRecorder API for audio recording
 * - Handles browser permissions for microphone access
 * - Works on mobile browsers (Safari, Chrome, Firefox)
 * - Automatic cleanup on unmount
 * - Max duration limit with auto-stop
 * - Returns audio blob for upload or playback
 *
 * Browser Support:
 * - Chrome/Edge: audio/webm (opus codec)
 * - Safari: audio/mp4 (aac codec)
 * - Firefox: audio/webm (opus codec)
 *
 * @example
 * ```tsx
 * const {
 *   isRecording,
 *   audioBlob,
 *   audioUrl,
 *   startRecording,
 *   stopRecording,
 *   clearRecording,
 * } = useVoiceRecording({
 *   maxDuration: 60000, // 1 minute
 *   onStop: (blob) => {
 *     // Upload or process the audio blob
 *     uploadAudio(blob);
 *   },
 * });
 *
 * return (
 *   <div>
 *     <button onClick={isRecording ? stopRecording : startRecording}>
 *       {isRecording ? 'Stop' : 'Record'}
 *     </button>
 *     {audioUrl && <audio src={audioUrl} controls />}
 *   </div>
 * );
 * ```
 */
export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const {
    maxDuration = 300000, // 5 minutes default
    mimeType,
    onStart,
    onStop,
    onError,
    onMaxDuration,
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    const supported =
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      !!window.MediaRecorder;

    setIsSupported(supported);
  }, []);

  // Get supported MIME type
  const getSupportedMimeType = useCallback((): string => {
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }

    // Try different formats in order of preference
    const types = [
      'audio/webm;codecs=opus', // Chrome, Firefox, Edge
      'audio/webm', // Fallback for webm
      'audio/mp4', // Safari
      'audio/ogg;codecs=opus', // Firefox
      'audio/wav', // Fallback
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Default fallback (might not work on all browsers)
    return 'audio/webm';
  }, [mimeType]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Voice recording is not supported in this browser.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isRecording) {
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Get supported MIME type
      const supportedMimeType = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stop event
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        setAudioBlob(blob);

        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Call onStop callback
        onStop?.(blob);

        // Stop media stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Clear max duration timeout
        if (maxDurationTimeoutRef.current) {
          clearTimeout(maxDurationTimeoutRef.current);
          maxDurationTimeoutRef.current = null;
        }

        setIsRecording(false);
      };

      // Handle error event
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const errorMsg = 'Recording failed. Please try again.';
        setError(errorMsg);
        setIsRecording(false);
        onError?.(errorMsg);

        // Cleanup
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError(null);
      startTimeRef.current = Date.now();
      setDuration(0);

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);
      }, 100);

      // Set max duration timeout
      if (maxDuration > 0) {
        maxDurationTimeoutRef.current = setTimeout(() => {
          stopRecording();
          onMaxDuration?.();
        }, maxDuration);
      }

      onStart?.();
    } catch (err) {
      console.error('Failed to start recording:', err);

      let errorMsg = 'Failed to access microphone. Please check permissions.';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = 'Microphone permission denied. Please allow access and try again.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMsg = 'No microphone found. Please connect a microphone and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMsg = 'Microphone is already in use by another application.';
        }
      }

      setError(errorMsg);
      setIsRecording(false);
      onError?.(errorMsg);
    }
  }, [
    isSupported,
    isRecording,
    maxDuration,
    getSupportedMimeType,
    onStart,
    onStop,
    onError,
    onMaxDuration,
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    try {
      // Stop the MediaRecorder (this will trigger the onstop event)
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
    }
  }, [isRecording]);

  // Clear recording
  const clearRecording = useCallback(() => {
    // Revoke object URL to free memory
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error('Error stopping recording on unmount:', err);
        }
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clear intervals and timeouts
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }

      // Revoke object URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);

  return {
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
  };
}
