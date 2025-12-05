/**
 * ChatInput Usage Examples
 *
 * This file demonstrates how to use the ChatInput component with file attachments.
 */

'use client';

import { useState } from 'react';
import { ChatInput } from './ChatInput';
import type { AttachedFile } from '@/hooks/use-file-upload';

/**
 * Example 1: Basic usage with file attachments
 */
export function BasicChatExample() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = (message: string, files?: AttachedFile[]) => {
    console.log('Message:', message);
    console.log('Attached files:', files);

    // Add message to state
    setMessages(prev => [...prev, message]);

    // Process files (upload to server, etc.)
    if (files && files.length > 0) {
      files.forEach(attachedFile => {
        console.log('File:', attachedFile.file.name, attachedFile.file.size);
        // Upload file to server here
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <ChatInput
        onSend={handleSend}
        showAttachment={true}
        maxFiles={5}
        maxFileSizeMB={10}
      />
    </div>
  );
}

/**
 * Example 2: With API integration for file upload
 */
export function ChatWithUploadExample() {
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = async (message: string, files?: AttachedFile[]) => {
    setIsUploading(true);

    try {
      // Upload files first
      const uploadedFiles = [];
      if (files && files.length > 0) {
        for (const attachedFile of files) {
          const formData = new FormData();
          formData.append('file', attachedFile.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          uploadedFiles.push(data.fileId);
        }
      }

      // Send message with file IDs
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          fileIds: uploadedFiles,
        }),
      });

      console.log('Message sent with files:', uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ChatInput
      onSend={handleSend}
      isLoading={isUploading}
      showAttachment={true}
    />
  );
}

/**
 * Example 3: Invoice/Receipt upload specific configuration
 */
export function InvoiceUploadChatExample() {
  const handleSend = (message: string, files?: AttachedFile[]) => {
    if (files && files.length > 0) {
      files.forEach(attachedFile => {
        // Process based on file type
        switch (attachedFile.type) {
          case 'pdf':
            console.log('Processing PDF invoice:', attachedFile.file.name);
            // Extract invoice data from PDF
            break;
          case 'image':
            console.log('Processing scanned receipt:', attachedFile.file.name);
            // Run OCR on image
            break;
          case 'excel':
          case 'csv':
            console.log('Processing expense spreadsheet:', attachedFile.file.name);
            // Parse CSV/Excel data
            break;
        }
      });
    }
  };

  return (
    <ChatInput
      onSend={handleSend}
      placeholder="Upload invoices, receipts, or ask a question..."
      showAttachment={true}
      maxFiles={10}
      maxFileSizeMB={15}
    />
  );
}

/**
 * Example 4: Controlled input with custom state management
 */
export function ControlledChatExample() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async (message: string, files?: AttachedFile[]) => {
    setIsProcessing(true);

    // Process message and files
    console.log('Processing:', { message, fileCount: files?.length || 0 });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsProcessing(false);
  };

  return (
    <ChatInput
      value={inputValue}
      onChange={setInputValue}
      onSend={handleSend}
      isLoading={isProcessing}
      showAttachment={true}
      showVoice={true}
    />
  );
}
