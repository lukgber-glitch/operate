'use client';

import { useState } from 'react';
import { ChatInput } from './ChatInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * ChatInputDemo - Example component demonstrating ChatInput with voice
 *
 * This demo shows:
 * - Voice input integration
 * - Message history
 * - File attachments
 * - All ChatInput features
 */
export function ChatInputDemo() {
  const [messages, setMessages] = useState<Array<{ text: string; timestamp: Date }>>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleSend = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        text: message,
        timestamp: new Date(),
      },
    ]);
    setAttachedFile(null);
  };

  const handleAttachment = (file: File) => {
    setAttachedFile(file);
    console.log('File attached:', file.name);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Voice Input Demo</h1>
        <p className="text-muted-foreground mt-2">
          Try the voice input button to speak your message instead of typing.
        </p>
      </div>

      {/* Browser Compatibility Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browser Compatibility</CardTitle>
          <CardDescription>
            Voice input works best in these browsers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Chrome</Badge>
            <Badge variant="default">Edge</Badge>
            <Badge variant="default">Safari (iOS 14.5+)</Badge>
            <Badge variant="default">Opera</Badge>
            <Badge variant="destructive">Firefox (Not Supported)</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            If you are using Firefox, the voice button will be disabled. Please use Chrome, Edge,
            or Safari for voice input functionality.
          </p>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Voice Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Click the microphone button (next to the paperclip icon) to start recording
            </li>
            <li>
              Speak clearly into your microphone - the button will turn red and pulse while
              recording
            </li>
            <li>
              When you finish speaking, the speech will be automatically transcribed and appear in
              the input field
            </li>
            <li>Click the Send button or press Enter to send your message</li>
            <li>
              You can click the microphone button again while recording to cancel the recording
            </li>
          </ol>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Note:</p>
            <p className="text-sm text-muted-foreground">
              Your browser will ask for microphone permission the first time you use voice input.
              Make sure to allow access.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message History</CardTitle>
          <CardDescription>
            {messages.length === 0
              ? 'No messages yet. Send a message using voice or keyboard!'
              : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your messages will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Attachment Status */}
      {attachedFile && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">File Attached</p>
                <p className="text-xs text-muted-foreground">{attachedFile.name}</p>
              </div>
              <Badge>Ready to send</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Input Component */}
      <Card>
        <CardContent className="p-0">
          <ChatInput
            onSend={handleSend}
            onAttachment={handleAttachment}
            showVoice={true}
            showAttachment={true}
            placeholder="Type your message or click the microphone to speak..."
            maxLength={500}
          />
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Voice input with visual feedback (pulsing red button during recording)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Speech-to-text transcription using Web Speech API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>File attachment support (images, PDFs, documents)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Auto-expanding textarea (up to 200px height)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Character counter (shows when 80% of limit reached)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Keyboard shortcuts (Enter to send, Shift+Enter for new line)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Browser compatibility detection with graceful fallback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Error handling with user-friendly messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Tooltips explaining voice input functionality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Loading states and disabled states</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>⚠️</span>
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Voice input button is grayed out?</p>
            <p className="text-muted-foreground">
              Your browser does not support the Web Speech API. Try Chrome, Edge, or Safari.
            </p>
          </div>
          <div>
            <p className="font-medium">No transcription appearing?</p>
            <p className="text-muted-foreground">
              Make sure you have granted microphone permission and are speaking clearly. Check that
              your microphone is working properly.
            </p>
          </div>
          <div>
            <p className="font-medium">Error message showing?</p>
            <p className="text-muted-foreground">
              Read the error tooltip - it will explain what went wrong and how to fix it. Common
              issues: microphone permission denied, no speech detected, or network error.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
