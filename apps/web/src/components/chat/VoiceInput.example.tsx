/**
 * VoiceInput Component - Usage Examples
 *
 * This file demonstrates various ways to use the VoiceInput component
 */

'use client';

import { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { useVoiceInput } from '@/hooks/use-voice-input';

// Example 1: Basic Usage
export function BasicVoiceInputExample() {
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Voice Input</h3>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or use voice input..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <VoiceInput
          onTranscript={(text) => setMessage(text)}
          showTranscript
        />
      </div>

      {message && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">Message: {message}</p>
        </div>
      )}
    </div>
  );
}

// Example 2: With Custom Language
export function MultilingualVoiceInputExample() {
  const [language, setLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Multilingual Voice Input</h3>

      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="de-DE">Deutsch</option>
          <option value="fr-FR">Français</option>
          <option value="es-ES">Español</option>
        </select>

        <VoiceInput
          language={language}
          onTranscript={setTranscript}
          showTranscript
        />
      </div>

      {transcript && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Transcript ({language}):</p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
}

// Example 3: With Callbacks
export function VoiceInputWithCallbacksExample() {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Voice Input with Callbacks</h3>

      <div className="flex items-center gap-3">
        <VoiceInput
          onTranscript={(text) => {
            setTranscript(text);
            setStatus('completed');
          }}
          onRecordingStart={() => setStatus('recording')}
          onRecordingEnd={() => setStatus('processing')}
          showTranscript
        />

        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              status === 'recording'
                ? 'bg-red-500'
                : status === 'processing'
                ? 'bg-yellow-500'
                : status === 'completed'
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-muted-foreground capitalize">
            {status}
          </span>
        </div>
      </div>

      {transcript && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
}

// Example 4: Using the Hook Directly
export function VoiceInputHookExample() {
  const voice = useVoiceInput({
    language: 'en-US',
    autoStopDelay: 3000,
    onTranscript: (text) => console.log('Final:', text),
    onInterimTranscript: (text) => console.log('Interim:', text),
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Using useVoiceInput Hook</h3>

      <div className="space-y-3">
        {/* Status Display */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Supported:</span>{' '}
              <span className="font-medium">
                {voice.isSupported ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Recording:</span>{' '}
              <span className="font-medium">
                {voice.isRecording ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Processing:</span>{' '}
              <span className="font-medium">
                {voice.isProcessing ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Error:</span>{' '}
              <span className="font-medium">
                {voice.error ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={voice.toggleRecording}
            disabled={!voice.isSupported}
            className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {voice.isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <button
            onClick={voice.clearTranscript}
            disabled={!voice.transcript}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        {/* Transcript Display */}
        {voice.interimTranscript && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Listening...
            </p>
            <p className="text-sm italic">{voice.interimTranscript}</p>
          </div>
        )}

        {voice.transcript && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Final Transcript:
            </p>
            <p className="text-sm">{voice.transcript}</p>
          </div>
        )}

        {voice.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{voice.error}</p>
            <button
              onClick={voice.clearError}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Example 5: Chat Integration
export function ChatWithVoiceInputExample() {
  const [messages, setMessages] = useState<Array<{ text: string; from: 'user' | 'voice' }>>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, from: 'user' }]);
      setInputValue('');
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setMessages([...messages, { text, from: 'voice' }]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chat with Voice Input</h3>

      {/* Messages */}
      <div className="h-64 p-4 border rounded-lg overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            No messages yet. Type or use voice input.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.from === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-purple-100 text-purple-900'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-75 mt-1">
                  {msg.from === 'voice' ? '🎤 Voice' : '⌨️ Typed'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-2 border rounded-lg">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 outline-none"
        />

        <VoiceInput
          onTranscript={handleVoiceTranscript}
          showTranscript
        />

        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Example 6: Demo Page
export function VoiceInputDemoPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">VoiceInput Component</h1>
        <p className="text-muted-foreground">
          Speech-to-text component using Web Speech API. Works in Chrome, Edge, and Safari.
        </p>
      </div>

      <BasicVoiceInputExample />
      <MultilingualVoiceInputExample />
      <VoiceInputWithCallbacksExample />
      <VoiceInputHookExample />
      <ChatWithVoiceInputExample />
    </div>
  );
}
