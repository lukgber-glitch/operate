'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion } from 'framer-motion';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MfaInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onError?: (error: string) => void;
  autoSubmit?: boolean;
  disabled?: boolean;
}

export function MfaInput({
  length = 6,
  onComplete,
  onError,
  autoSubmit = true,
  disabled = false,
}: MfaInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Move to next input if value entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all inputs are filled
    const code = newValues.join('');
    if (code.length === length) {
      if (autoSubmit) {
        onComplete(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Move to next input on arrow right
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move to previous input on arrow left
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Submit on Enter if all filled
    if (e.key === 'Enter') {
      const code = values.join('');
      if (code.length === length) {
        onComplete(code);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    // Only process if pasted data is all digits
    if (!/^\d+$/.test(pastedData)) {
      onError?.('Please paste only numbers');
      return;
    }

    // Take only the required length
    const digits = pastedData.slice(0, length).split('');
    const newValues = [...values];

    digits.forEach((digit, i) => {
      newValues[i] = digit;
    });

    setValues(newValues);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if complete
    if (digits.length === length && autoSubmit) {
      onComplete(digits.join(''));
    }
  };

  const handleFocus = (index: number) => {
    // Select the input content on focus
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: index * 0.05,
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={cn(
              'w-12 h-12 text-center text-lg font-semibold transition-all duration-200',
              'focus:ring-2 focus:ring-primary focus:border-primary focus:scale-110',
              values[index] && 'border-primary/50 bg-primary/5'
            )}
            aria-label={`Digit ${index + 1}`}
          />
        </motion.div>
      ))}
    </div>
  );
}
