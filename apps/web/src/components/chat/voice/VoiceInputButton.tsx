'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useVoiceInput } from './useVoiceInput';
import { VoiceRecorder } from './VoiceRecorder';
import type { VoiceInputMode, SupportedLanguage } from './voice.types';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  defaultLanguage?: SupportedLanguage;
  defaultMode?: VoiceInputMode;
  enableTTS?: boolean;
}

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'es-ES', label: 'Español' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'pt-PT', label: 'Português' },
];

/**
 * VoiceInputButton Component
 *
 * Main button for voice input with settings popover
 *
 * Features:
 * - Push-to-talk and continuous mode
 * - Language selection
 * - Text-to-speech controls
 * - Recording visualization
 * - Error handling
 * - Accessibility
 */
export function VoiceInputButton({
  onTranscript,
  disabled = false,
  className,
  defaultLanguage = 'de-DE',
  defaultMode = 'push-to-talk',
  enableTTS = false,
}: VoiceInputButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [mode, setMode] = useState<VoiceInputMode>(defaultMode);
  const [ttsEnabled, setTtsEnabled] = useState(enableTTS);
  const [ttsRate, setTtsRate] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const voiceInput = useVoiceInput({
    language,
    mode,
    enableTTS: ttsEnabled,
    onTranscript: (text) => {
      onTranscript(text);
      if (mode === 'push-to-talk') {
        setIsOpen(false);
      }
    },
    onCommand: (command) => {
      if (command.action === 'send') {
        setIsOpen(false);
      } else if (command.action === 'clear') {
        voiceInput.clearTranscript();
      } else if (command.action === 'cancel') {
        voiceInput.stopRecording();
        setIsOpen(false);
      }
    },
  });

  // Load available voices for TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Auto-select voice matching language
      const langPrefix = language.split('-')[0] || language;
      const matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
      if (matchingVoice) {
        setSelectedVoice(matchingVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  // Handle mouse down/up for push-to-talk
  const handleMouseDown = useCallback(() => {
    if (disabled || !voiceInput.isSupported) return;

    if (mode === 'push-to-talk') {
      voiceInput.startRecording();
    }
  }, [disabled, mode, voiceInput]);

  const handleMouseUp = useCallback(() => {
    if (mode === 'push-to-talk' && voiceInput.isRecording) {
      voiceInput.stopRecording();
    }
  }, [mode, voiceInput]);

  // Handle click for continuous mode
  const handleClick = useCallback(() => {
    if (disabled || !voiceInput.isSupported) return;

    if (mode === 'continuous') {
      voiceInput.toggleRecording();
    }
  }, [disabled, mode, voiceInput]);

  // Toggle TTS
  const handleTtsSpeak = useCallback(() => {
    if (voiceInput.tts.isSpeaking) {
      voiceInput.tts.stop();
    }
  }, [voiceInput.tts]);

  // Not supported fallback
  if (!voiceInput.isSupported) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-10 w-10 shrink-0', className)}
            disabled
            aria-label="Voice input not supported"
          >
            <MicOff className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-sm mb-1">Voice Input Not Supported</h4>
              <p className="text-xs text-muted-foreground">
                Your browser doesn't support speech recognition. Please use Chrome or Edge for voice
                input functionality.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 relative',
            voiceInput.isRecording && 'text-red-500',
            className
          )}
          disabled={disabled}
          aria-label={voiceInput.isRecording ? 'Stop recording' : 'Start voice input'}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          {voiceInput.isRecording ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
              <Mic className="h-4 w-4 relative" />
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Voice Input</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>

          {/* Voice Recorder */}
          <VoiceRecorder
            state={{
              isRecording: voiceInput.isRecording,
              state: voiceInput.isRecording ? 'recording' : 'idle',
              transcript: voiceInput.transcript,
              interimTranscript: voiceInput.interimTranscript,
              confidence: voiceInput.confidence,
              error: voiceInput.error,
            }}
            audioData={voiceInput.audioData}
            onStart={voiceInput.startRecording}
            onStop={voiceInput.stopRecording}
            onClear={voiceInput.clearTranscript}
          />

          {/* Settings */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Settings</span>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="voice-language" className="text-xs">
                Language
              </Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as SupportedLanguage)}>
                <SelectTrigger id="voice-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label htmlFor="voice-mode" className="text-xs">
                Recording Mode
              </Label>
              <Select value={mode} onValueChange={(val) => setMode(val as VoiceInputMode)}>
                <SelectTrigger id="voice-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push-to-talk">Push to Talk</SelectItem>
                  <SelectItem value="continuous">Continuous</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === 'push-to-talk'
                  ? 'Hold button to record'
                  : 'Click to start/stop recording'}
              </p>
            </div>

            {/* Text-to-Speech */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-enabled" className="text-xs flex items-center gap-2">
                  <Volume2 className="h-3 w-3" />
                  Text-to-Speech
                </Label>
                <Switch
                  id="tts-enabled"
                  checked={ttsEnabled}
                  onCheckedChange={setTtsEnabled}
                  disabled={!voiceInput.tts}
                />
              </div>

              {ttsEnabled && (
                <>
                  {/* Voice selection */}
                  {availableVoices.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="tts-voice" className="text-xs">
                        Voice
                      </Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger id="tts-voice">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices
                            .filter((v) => v.lang.startsWith(language.split('-')[0] || language))
                            .map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Speech rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tts-rate" className="text-xs">
                        Speed
                      </Label>
                      <span className="text-xs text-muted-foreground">{ttsRate}x</span>
                    </div>
                    <Slider
                      id="tts-rate"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[ttsRate]}
                      onValueChange={([val]) => setTtsRate(val ?? 1)}
                    />
                  </div>

                  {/* TTS control */}
                  {voiceInput.tts.isSpeaking && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleTtsSpeak}
                    >
                      <VolumeX className="h-3 w-3 mr-2" />
                      Stop Speaking
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
