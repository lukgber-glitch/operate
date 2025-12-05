'use client';

import { Send, Paperclip, Loader2, Upload } from 'lucide-react';
import { useRef, useState, KeyboardEvent, ChangeEvent, DragEvent } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { AnimatedButton, AnimatedIcon, useFormAnimation } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { VoiceInputButton } from './VoiceInputButton';
import { useFileUpload, type AttachedFile } from '@/hooks/use-file-upload';
import { AttachmentPreview, AttachmentCounter } from './AttachmentPreview';

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onAttachment?: (file: File) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
}

/**
 * ChatInput - Multi-line input component with micro-interactions
 *
 * Enhanced with:
 * - Animated send button with rotation on click
 * - Success animation on message sent
 * - Error shake on send failure
 * - Loading state with spinner
 * - Icon hover effects
 */
export function ChatInput({
  onSend,
  onAttachment,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message... (Shift + Enter for new line)',
  maxLength = 2000,
  showAttachment = true,
  showVoice = false,
  value: controlledValue,
  onChange: controlledOnChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Form animation state
  const { isSuccess, setSuccess, isError, setError } = useFormAnimation();

  // File upload hook
  const {
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    error: fileError,
    clearError,
  } = useFileUpload({
    maxFiles,
    maxSizeInMB: maxFileSizeMB,
  });

  // Support both controlled and uncontrolled usage
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledOnChange || setInternalValue;

  const handleSend = async () => {
    const trimmedValue = value.trim();
    if ((!trimmedValue && attachedFiles.length === 0) || disabled || isLoading) return;

    try {
      // Trigger send animation
      setJustSent(true);
      setTimeout(() => setJustSent(false), 300);

      await onSend(trimmedValue, attachedFiles.length > 0 ? attachedFiles : undefined);

      // Clear input and files on successful send
      setValue('');
      clearFiles();

      // Show success animation
      setSuccess(500);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Focus back to input
      textareaRef.current?.focus();
    } catch (error) {
      // Show error animation on failure
      setError();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      addFiles(fileArray);
      const firstFile = fileArray[0];
      if (firstFile) {
        onAttachment?.(firstFile);
      }
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      addFiles(fileArray);
      const firstFile = fileArray[0];
      if (firstFile) {
        onAttachment?.(firstFile);
      }
    }
  };

  const canSend = (value.trim() || attachedFiles.length > 0) && !disabled && !isLoading;
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="relative w-full">
      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-2 text-primary animate-bounce-subtle" />
            <p className="text-sm font-medium">Drop files here</p>
          </div>
        </div>
      )}

      {/* Main input container */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col gap-2 p-3 border rounded-lg bg-background',
          'transition-colors duration-200',
          isDragging && 'border-primary bg-primary/5',
          isError && 'border-destructive',
          isSuccess && 'border-green-500'
        )}
      >
        {/* File error */}
        {fileError && (
          <div className="text-xs text-destructive px-1 animate-shake">
            {fileError}
          </div>
        )}

        {/* Attachment previews */}
        {attachedFiles.length > 0 && (
          <AttachmentPreview
            files={attachedFiles}
            onRemove={removeFile}
          />
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
            'transition-all duration-200'
          )}
          rows={1}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Attachment and Voice */}
          <div className="flex items-center gap-1">
            {showAttachment && (
              <>
                <AnimatedButton
                  variant="ghost"
                  size="icon"
                  pressEffect="soft"
                  onClick={handleAttachmentClick}
                  disabled={disabled || isLoading}
                  className="h-8 w-8"
                  aria-label="Attach files"
                >
                  <AnimatedIcon animation="rotate">
                    <Paperclip className="h-4 w-4" />
                  </AnimatedIcon>
                </AnimatedButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </>
            )}

            {showVoice && <VoiceInputButton onTranscript={setValue} />}

            {attachedFiles.length > 0 && (
              <AttachmentCounter count={attachedFiles.length} />
            )}
          </div>

          {/* Right side - Character count and Send button */}
          <div className="flex items-center gap-2">
            {/* Character counter */}
            {characterCount > 0 && (
              <span
                className={cn(
                  'text-xs tabular-nums transition-colors',
                  isNearLimit && !isOverLimit && 'text-yellow-600 dark:text-yellow-500',
                  isOverLimit && 'text-destructive font-medium'
                )}
              >
                {characterCount}/{maxLength}
              </span>
            )}

            {/* Send button */}
            <AnimatedButton
              size="icon"
              pressEffect="soft"
              success={isSuccess}
              error={isError}
              onClick={handleSend}
              disabled={!canSend || isOverLimit}
              className={cn(
                'h-8 w-8 shrink-0',
                canSend && !isOverLimit
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-muted'
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <AnimatedIcon animation="spin" continuous>
                  <Loader2 className="h-4 w-4" />
                </AnimatedIcon>
              ) : (
                <AnimatedIcon animation="rotate">
                  <Send
                    className={cn(
                      'h-4 w-4 transition-transform',
                      justSent && 'rotate-45 scale-90'
                    )}
                  />
                </AnimatedIcon>
              )}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
