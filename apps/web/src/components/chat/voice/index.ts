/**
 * Voice Input Module
 *
 * Exports all voice input components, hooks, and types
 */

export { VoiceInputButton } from './VoiceInputButton';
export { VoiceRecorder } from './VoiceRecorder';
export { VoiceWaveform } from './VoiceWaveform';
export { useVoiceInput } from './useVoiceInput';
export { useSpeechRecognition } from './useSpeechRecognition';

export type {
  VoiceInputMode,
  RecordingState,
  SupportedLanguage,
  SpeechRecognitionResult,
  VoiceInputConfig,
  VoiceRecordingState,
  VoiceInputError,
  VoiceErrorCode,
  AudioVisualizerData,
  VoiceCommand,
  TextToSpeechConfig,
  TextToSpeechState,
} from './voice.types';
