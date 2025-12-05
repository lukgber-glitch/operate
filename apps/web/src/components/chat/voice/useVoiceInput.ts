import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import type {
  VoiceInputMode,
  SupportedLanguage,
  VoiceCommand,
  AudioVisualizerData,
  TextToSpeechConfig,
  TextToSpeechState,
} from './voice.types';

interface UseVoiceInputOptions {
  language?: SupportedLanguage;
  mode?: VoiceInputMode;
  onTranscript?: (text: string) => void;
  onCommand?: (command: VoiceCommand) => void;
  enableCommands?: boolean;
  enableTTS?: boolean;
  autoSend?: boolean;
}

/**
 * useVoiceInput Hook
 *
 * Main hook for voice input functionality
 * Combines speech recognition, audio visualization, and text-to-speech
 *
 * Features:
 * - Speech-to-text with interim results
 * - Voice commands (send, clear, cancel)
 * - Audio visualization data
 * - Text-to-speech for AI responses
 * - Keyboard shortcuts
 */
export function useVoiceInput({
  language = 'de-DE',
  mode = 'push-to-talk',
  onTranscript,
  onCommand,
  enableCommands = true,
  enableTTS = false,
  autoSend = false,
}: UseVoiceInputOptions = {}) {
  const [audioData, setAudioData] = useState<AudioVisualizerData | null>(null);
  const [ttsState, setTtsState] = useState<TextToSpeechState>({
    isSpeaking: false,
    isPaused: false,
    currentText: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Voice commands mapping
  const voiceCommands: VoiceCommand[] = useMemo(
    () => [
      {
        command: 'send',
        action: 'send',
        trigger: ['send', 'senden', 'abschicken', 'absenden'],
      },
      {
        command: 'clear',
        action: 'clear',
        trigger: ['clear', 'löschen', 'delete', 'entfernen'],
      },
      {
        command: 'cancel',
        action: 'cancel',
        trigger: ['cancel', 'abbrechen', 'stop', 'stopp'],
      },
      {
        command: 'newline',
        action: 'newline',
        trigger: ['new line', 'neue zeile', 'absatz'],
      },
    ],
    []
  );

  // Handle transcript from speech recognition
  const handleTranscript = useCallback(
    (text: string) => {
      // Check for voice commands
      if (enableCommands) {
        const lowerText = text.toLowerCase();
        const matchedCommand = voiceCommands.find((cmd) =>
          cmd.trigger.some((trigger) => lowerText.includes(trigger))
        );

        if (matchedCommand) {
          onCommand?.(matchedCommand);
          return;
        }
      }

      // Regular transcript
      onTranscript?.(text);

      // Auto-send if enabled
      if (autoSend && mode === 'push-to-talk') {
        const sendCommand = voiceCommands.find((cmd) => cmd.action === 'send');
        if (sendCommand) {
          onCommand?.(sendCommand);
        }
      }
    },
    [enableCommands, voiceCommands, onTranscript, onCommand, autoSend, mode]
  );

  // Initialize speech recognition
  const speechRecognition = useSpeechRecognition(
    {
      language,
      mode,
      continuous: mode === 'continuous',
      interimResults: true,
      maxAlternatives: 1,
    },
    handleTranscript
  );

  // Initialize audio context for visualization
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  // Update audio visualization data
  const updateAudioData = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume and dominant frequency
    const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;
    const maxIndex = dataArray.indexOf(Math.max(...Array.from(dataArray)));
    const frequency = (maxIndex * audioContextRef.current!.sampleRate) / analyserRef.current.fftSize;

    setAudioData({
      volume,
      frequency,
      timestamp: Date.now(),
    });

    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, []);

  // Start recording with visualization
  const startRecording = useCallback(async () => {
    await initAudioContext();
    await speechRecognition.startRecording();
    if (analyserRef.current) {
      updateAudioData();
    }
  }, [initAudioContext, speechRecognition, updateAudioData]);

  // Stop recording
  const stopRecording = useCallback(() => {
    speechRecognition.stopRecording();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioData(null);
  }, [speechRecognition]);

  // Text-to-Speech functionality
  const speak = useCallback(
    (text: string, config?: TextToSpeechConfig) => {
      if (!enableTTS || typeof window === 'undefined' || !window.speechSynthesis) {
        return;
      }

      // Cancel any ongoing speech
      if (ttsState.isSpeaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config?.lang || language;
      utterance.rate = config?.rate || 1;
      utterance.pitch = config?.pitch || 1;
      utterance.volume = config?.volume || 1;

      if (config?.voice) {
        utterance.voice = config.voice;
      }

      utterance.onstart = () => {
        setTtsState({
          isSpeaking: true,
          isPaused: false,
          currentText: text,
        });
      };

      utterance.onend = () => {
        setTtsState({
          isSpeaking: false,
          isPaused: false,
          currentText: null,
        });
      };

      utterance.onerror = () => {
        setTtsState({
          isSpeaking: false,
          isPaused: false,
          currentText: null,
        });
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [enableTTS, language, ttsState.isSpeaking]
  );

  const pauseSpeech = useCallback(() => {
    if (window.speechSynthesis && ttsState.isSpeaking) {
      window.speechSynthesis.pause();
      setTtsState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [ttsState.isSpeaking]);

  const resumeSpeech = useCallback(() => {
    if (window.speechSynthesis && ttsState.isPaused) {
      window.speechSynthesis.resume();
      setTtsState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [ttsState.isPaused]);

  const stopSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTtsState({
        isSpeaking: false,
        isPaused: false,
        currentText: null,
      });
    }
  }, []);

  const getAvailableVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + V for voice input
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        speechRecognition.toggleRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speechRecognition]);

  return {
    // Speech recognition state
    isRecording: speechRecognition.isRecording,
    transcript: speechRecognition.transcript,
    interimTranscript: speechRecognition.interimTranscript,
    confidence: speechRecognition.confidence,
    error: speechRecognition.error,
    isSupported: speechRecognition.isSupported,

    // Recording controls
    startRecording,
    stopRecording,
    toggleRecording: speechRecognition.toggleRecording,
    clearTranscript: speechRecognition.clearTranscript,
    resetError: speechRecognition.resetError,

    // Audio visualization
    audioData,

    // Text-to-Speech
    tts: {
      ...ttsState,
      speak,
      pause: pauseSpeech,
      resume: resumeSpeech,
      stop: stopSpeech,
      getAvailableVoices,
    },

    // Commands
    voiceCommands,
  };
}
