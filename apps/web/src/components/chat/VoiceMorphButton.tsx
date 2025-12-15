'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X, AlertCircle, Check } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface VoiceMorphButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  language?: string;
  showTranscript?: boolean;
  autoSubmit?: boolean;
}

// Animation spring config matching design system
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

// Pulsing wave animation for listening state
const pulseRingVariants = {
  initial: { scale: 1, opacity: 0.6 },
  animate: {
    scale: [1, 1.5, 2],
    opacity: [0.6, 0.3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  },
};

// Icon transition variants
const iconVariants = {
  initial: { scale: 0.8, opacity: 0, rotate: -10 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: springConfig,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    rotate: 10,
    transition: { duration: 0.15 },
  },
};

// Transcript popup variants
const transcriptVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/**
 * VoiceMorphButton - Voice input with morphing state animations
 *
 * This component provides a beautiful voice input experience with:
 * - Morphing state transitions (idle → listening → processing → success)
 * - Pulsing wave animations while listening
 * - Real-time transcript display with glassmorphic styling
 * - Error handling with friendly messages
 * - Accessibility support with reduced motion
 *
 * @example
 * ```tsx
 * <VoiceMorphButton
 *   onTranscript={(text) => setInput(text)}
 *   showTranscript
 * />
 * ```
 */
export function VoiceMorphButton({
  onTranscript,
  disabled = false,
  className,
  language = 'en-US',
  showTranscript = true,
  autoSubmit = false,
}: VoiceMorphButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showSuccess, setShowSuccess] = useState(false);

  // Store latest transcript ref to avoid stale closure in onEnd
  const transcriptRef = useRef('');

  // Memoize callbacks to prevent useVoiceInput useEffect from re-running
  const handleStart = useCallback(() => {
    setVoiceState('listening');
  }, []);

  const handleEnd = useCallback(() => {
    // Brief processing state before returning to idle
    setVoiceState('processing');
    setTimeout(() => {
      if (transcriptRef.current) {
        setVoiceState('success');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setVoiceState('idle');
        }, 1000);
      } else {
        setVoiceState('idle');
      }
    }, 300);
  }, []);

  const handleTranscript = useCallback((text: string) => {
    if (text.trim()) {
      transcriptRef.current = text.trim();
      onTranscript(text.trim());
    }
  }, [onTranscript]);

  const handleError = useCallback(() => {
    setVoiceState('error');
    setTimeout(() => {
      setVoiceState('idle');
    }, 3000);
  }, []);

  const voice = useVoiceInput({
    language,
    continuous: true,
    interimResults: true,
    autoStopDelay: 2000,
    onStart: handleStart,
    onEnd: handleEnd,
    onTranscript: handleTranscript,
    onError: handleError,
  });

  // Reset state when disabled changes
  // Note: voice.stopRecording is extracted to avoid including the entire voice object in deps
  const { stopRecording } = voice;
  useEffect(() => {
    if (disabled && voiceState === 'listening') {
      stopRecording();
    }
  }, [disabled, voiceState, stopRecording]);

  const handleClick = useCallback(() => {
    if (disabled || !voice.isSupported) return;

    if (voiceState === 'listening') {
      voice.stopRecording();
    } else if (voiceState === 'idle' || voiceState === 'error') {
      voice.clearError();
      voice.startRecording();
    }
  }, [disabled, voice, voiceState]);

  const handleCancelRecording = useCallback(() => {
    voice.stopRecording();
    voice.clearTranscript();
    setVoiceState('idle');
  }, [voice]);

  // Get button styling based on state
  const getButtonStyle = () => {
    switch (voiceState) {
      case 'listening':
        return {
          background: 'var(--color-blue-600)',
          boxShadow: '0 0 20px rgba(30, 136, 229, 0.4)',
        };
      case 'processing':
        return {
          background: 'var(--color-blue-500)',
        };
      case 'success':
        return {
          background: 'var(--color-success, #10b981)',
        };
      case 'error':
        return {
          background: 'var(--color-destructive, #ef4444)',
        };
      default:
        return {
          background: 'transparent',
        };
    }
  };

  // Not supported browser fallback
  if (!voice.isSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'h-10 w-10 shrink-0 cursor-not-allowed opacity-50 rounded-xl',
          className
        )}
        disabled
        aria-label="Voice input not supported"
        title="Voice input is not supported in this browser. Try Chrome, Edge, or Safari."
      >
        <MicOff className="h-5 w-5" style={{ color: 'var(--color-blue-400)' }} />
      </Button>
    );
  }

  const currentTranscript = voice.interimTranscript || voice.transcript;
  const isActive = voiceState === 'listening' || voiceState === 'processing';

  return (
    <div className={cn('relative', className)}>
      {/* Main Button */}
      <motion.div
        className="relative"
        animate={voiceState === 'listening' && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' as const }}
      >
        {/* Pulsing Rings (listening state) */}
        {voiceState === 'listening' && !prefersReducedMotion && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '2px solid var(--color-blue-400)',
                }}
                variants={pulseRingVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.4 }}
              />
            ))}
          </>
        )}

        <motion.button
          type="button"
          onClick={handleClick}
          disabled={disabled || voiceState === 'processing'}
          className={cn(
            'relative h-10 w-10 shrink-0 rounded-xl',
            'flex items-center justify-center',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            voiceState === 'idle' && 'hover:bg-blue-100/80',
            isActive && 'text-white'
          )}
          style={getButtonStyle()}
          whileHover={disabled || isActive ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          aria-label={
            voiceState === 'listening'
              ? 'Stop recording'
              : voiceState === 'processing'
              ? 'Processing...'
              : 'Start voice input'
          }
        >
          <AnimatePresence mode="wait">
            {voiceState === 'idle' && (
              <motion.div
                key="idle"
                variants={prefersReducedMotion ? undefined : iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Mic className="h-5 w-5" style={{ color: 'var(--color-blue-500)' }} />
              </motion.div>
            )}

            {voiceState === 'listening' && (
              <motion.div
                key="listening"
                variants={prefersReducedMotion ? undefined : iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <MicOff className="h-5 w-5 text-white" />
              </motion.div>
            )}

            {voiceState === 'processing' && (
              <motion.div
                key="processing"
                variants={prefersReducedMotion ? undefined : iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </motion.div>
            )}

            {voiceState === 'success' && (
              <motion.div
                key="success"
                variants={prefersReducedMotion ? undefined : iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Check className="h-5 w-5 text-white" />
              </motion.div>
            )}

            {voiceState === 'error' && (
              <motion.div
                key="error"
                variants={prefersReducedMotion ? undefined : iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <AlertCircle className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Recording indicator dot */}
        <AnimatePresence>
          {voiceState === 'listening' && (
            <motion.span
              className="absolute -top-1 -right-1 flex h-3 w-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transcript Popup */}
      <AnimatePresence>
        {showTranscript && currentTranscript && isActive && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
            variants={prefersReducedMotion ? undefined : transcriptVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="relative px-4 py-3 rounded-xl min-w-[200px] max-w-[320px]"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--color-blue-200)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Transcript Label */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-blue-600)' }}
                >
                  {voice.interimTranscript ? 'Listening...' : 'Transcript'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="p-1 rounded hover:bg-blue-100 transition-colors"
                  aria-label="Cancel recording"
                >
                  <X className="h-3 w-3" style={{ color: 'var(--color-blue-500)' }} />
                </button>
              </div>

              {/* Transcript Text */}
              <p
                className={cn(
                  'text-sm leading-relaxed',
                  voice.interimTranscript && 'animate-pulse'
                )}
                style={{ color: 'var(--color-blue-700)' }}
              >
                {currentTranscript}
              </p>

              {/* Sound Wave Indicator */}
              {voiceState === 'listening' && !prefersReducedMotion && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ background: 'var(--color-blue-400)' }}
                      animate={{
                        height: ['8px', '16px', '8px'],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut' as const,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Arrow */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRight: '1px solid var(--color-blue-200)',
                  borderBottom: '1px solid var(--color-blue-200)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {voiceState === 'error' && voice.error && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
            variants={prefersReducedMotion ? undefined : transcriptVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="relative px-4 py-3 rounded-xl min-w-[200px] max-w-[320px]"
              style={{
                background: 'rgba(254, 226, 226, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{voice.error}</p>
              </div>

              {/* Arrow */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                style={{
                  background: 'rgba(254, 226, 226, 0.95)',
                  borderRight: '1px solid rgba(239, 68, 68, 0.3)',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoiceMorphButton;
