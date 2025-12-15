'use client';

import { Send, Paperclip, Loader2, Upload, History } from 'lucide-react';
import { useRef, useState, KeyboardEvent, ChangeEvent, DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { VoiceMorphButton } from './VoiceMorphButton';
import { useFileUpload, type AttachedFile } from '@/hooks/use-file-upload';
import { AttachmentPreview, AttachmentCounter } from './AttachmentPreview';
import { QuickActionPills, type QuickAction } from './QuickActionPills';

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onAttachment?: (file: File) => void;
  onHistoryClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
  showHistory?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  showQuickActions?: boolean;
  quickActions?: QuickAction[];
}

/**
 * ChatInput - Multi-line input component for chat messages
 *
 * Features:
 * - Auto-expanding textarea
 * - Send on Enter, new line on Shift+Enter
 * - Character counter
 * - File attachment with drag-and-drop
 * - Multiple file support with previews
 * - Voice input
 * - Loading state
 * - Keyboard shortcuts
 */
export function ChatInput({
  onSend,
  onAttachment,
  onHistoryClick,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message... (Shift + Enter for new line)',
  maxLength = 2000,
  showAttachment = true,
  showVoice = false,
  showHistory = true,
  value: controlledValue,
  onChange: controlledOnChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
  showQuickActions = true,
  quickActions,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const handleSend = () => {
    const trimmedValue = value.trim();
    if ((!trimmedValue && attachedFiles.length === 0) || disabled || isLoading) return;

    // Send message with attachments
    onSend(trimmedValue || 'Attached files', attachedFiles);
    setValue('');
    clearFiles();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }

    // Auto-expand textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);

      // Legacy single file callback
      if (onAttachment && files[0]) {
        onAttachment(files[0]);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    // Only set to false if leaving the drop zone container
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
      addFiles(files);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Append transcript to existing value or replace
    const newValue = value ? `${value} ${transcript}` : transcript;
    setValue(newValue);

    // Focus textarea after voice input
    textareaRef.current?.focus();
  };

  const handleQuickActionClick = (action: string) => {
    // Set the action text as the input value
    setValue(action);

    // Focus the textarea
    textareaRef.current?.focus();

    // Auto-expand textarea to fit content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const remainingChars = maxLength - value.length;
  const showCounter = value.length > maxLength * 0.8;

  return (
    <div className="relative">
      {/* Quick Action Pills - shown above input */}
      {showQuickActions && (
        <QuickActionPills
          onActionClick={handleQuickActionClick}
          contextualActions={quickActions}
        />
      )}

      {/* Main Input Container */}
      <div
        ref={dropZoneRef}
        className={cn(
          'transition-colors relative py-4',
          isDragging && 'bg-accent/50 border-primary'
        )}
        style={{
          background: 'transparent',
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/80 border-2 border-dashed border-primary rounded-lg pointer-events-none">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Drop files to attach</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, Excel, CSV (max {maxFileSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {/* File error message */}
      {fileError && (
        <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
          <p className="text-sm text-destructive">{fileError}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={clearError}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Attachment previews */}
      <AttachmentPreview files={attachedFiles} onRemove={removeFile} />

      <div className="flex gap-3">
        {/* Left buttons */}
        <div className="flex items-end gap-2">
          {showAttachment && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 md:h-10 md:w-10 shrink-0 relative',
                  'min-h-[44px] min-w-[44px]', // Touch-friendly
                  attachedFiles.length > 0 && 'text-primary'
                )}
                onClick={handleAttachmentClick}
                disabled={disabled || isLoading}
                aria-label="Attach file"
                title={`Attach files (${attachedFiles.length}/${maxFiles})`}
              >
                <Paperclip className="h-4 w-4 md:h-4 md:w-4" />
                <AttachmentCounter count={attachedFiles.length} className="absolute -top-1 -right-1" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.csv,.xls,.xlsx"
                multiple
                aria-label="File upload input"
              />
            </>
          )}

          {/* Voice input with morphing states */}
          {showVoice && (
            <VoiceMorphButton
              onTranscript={handleVoiceTranscript}
              disabled={disabled || isLoading}
              showTranscript
            />
          )}

          {/* History button - opens conversation history dropdown */}
          {showHistory && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 md:h-10 md:w-10 shrink-0',
                'min-h-[44px] min-w-[44px]'
              )}
              disabled={disabled || isLoading}
              onClick={onHistoryClick}
              aria-label="Conversation history"
              title="History (Ctrl+K)"
            >
              <History className="h-4 w-4 md:h-4 md:w-4" />
            </Button>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[44px] max-h-[160px] md:max-h-[200px] resize-none',
              'py-2.5 pe-12',
              'text-base', // Prevent zoom on iOS
              showCounter && 'pb-6'
            )}
            aria-label="Message input"
          />

          {/* Character counter */}
          {showCounter && (
            <span
              className={cn(
                'absolute bottom-2 end-2 text-xs',
                remainingChars < 100 ? 'text-destructive' : 'text-muted-foreground'
              )}
              aria-live="polite"
            >
              {remainingChars}
            </span>
          )}
        </div>

        {/* Send button */}
        <div className="flex items-end">
          <Button
            onClick={handleSend}
            disabled={(!value.trim() && attachedFiles.length === 0) || disabled || isLoading}
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0',
              'min-h-[44px] min-w-[44px]' // Touch-friendly
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

        {/* Keyboard hint - hidden on mobile to save space */}
        <div className="hidden md:flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift + Enter for new line
          </p>
          {showAttachment && (
            <p className="text-xs text-muted-foreground">
              Drag & drop files or click <Paperclip className="inline h-3 w-3" /> to attach
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
