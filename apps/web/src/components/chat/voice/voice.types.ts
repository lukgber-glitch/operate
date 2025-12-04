/**
 * Voice Input Types
 * TypeScript definitions for voice recording and speech recognition
 */

export type VoiceInputMode = 'push-to-talk' | 'continuous';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export type SupportedLanguage = 'de-DE' | 'en-US' | 'en-GB' | 'fr-FR' | 'es-ES' | 'it-IT' | 'pt-PT';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface VoiceInputConfig {
  language: SupportedLanguage;
  mode: VoiceInputMode;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  state: RecordingState;
  transcript: string;
  interimTranscript: string;
  error: VoiceInputError | null;
  confidence: number;
}

export interface VoiceInputError {
  code: VoiceErrorCode;
  message: string;
}

export type VoiceErrorCode =
  | 'not-supported'
  | 'permission-denied'
  | 'no-microphone'
  | 'network-error'
  | 'aborted'
  | 'audio-capture'
  | 'no-speech'
  | 'unknown';

export interface AudioVisualizerData {
  volume: number;
  frequency: number;
  timestamp: number;
}

export interface VoiceCommand {
  command: string;
  action: 'send' | 'clear' | 'cancel' | 'newline';
  trigger: string[];
}

export interface TextToSpeechConfig {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export interface TextToSpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
}

// Browser API type extensions
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Extend window for browser APIs
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
