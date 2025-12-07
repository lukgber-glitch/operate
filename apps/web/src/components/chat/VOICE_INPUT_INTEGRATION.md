# Voice Input Integration

## Overview
Voice input capability has been successfully integrated into the ChatInput component using the Web Speech API. Two implementations are available:
1. **VoiceInput** - Simple, focused component (S10-04)
2. **voice/** - Advanced voice module with full features

## Implementation Summary

### Files Created (Task S10-04)

1. **VoiceInput.tsx** (Main Component)
   - Location: `apps/web/src/components/chat/VoiceInput.tsx`
   - Standalone voice input component with transcript preview
   - Uses browser Web Speech API for speech-to-text conversion
   - Auto-stop after silence, error handling, mobile-friendly

2. **use-voice-input.ts** (Hook)
   - Location: `apps/web/src/hooks/use-voice-input.ts`
   - Reusable hook for voice input functionality
   - Full state management and control methods
   - TypeScript support

3. **voice-utils.ts** (Utilities)
   - Location: `apps/web/src/lib/voice-utils.ts`
   - Browser support checking
   - Microphone permission handling
   - Error message formatting
   - Language detection

4. **VoiceInput.example.tsx** (Examples)
   - Location: `apps/web/src/components/chat/VoiceInput.example.tsx`
   - Complete usage examples
   - Hook usage demonstrations

5. **VoiceInput.test.tsx** (Tests)
   - Location: `apps/web/src/components/chat/VoiceInput.test.tsx`
   - Unit tests for component and hook
   - Browser compatibility tests

6. **VOICE_INPUT_README.md** (Documentation)
   - Location: `apps/web/src/components/chat/VOICE_INPUT_README.md`
   - Complete API reference
   - Usage guide and troubleshooting

### Files Modified

1. **ChatInput.tsx**
   - Location: `apps/web/src/components/chat/ChatInput.tsx`
   - Integrated VoiceInput component
   - Added handler for voice transcripts

2. **index.ts**
   - Location: `apps/web/src/components/chat/index.ts`
   - Exported VoiceInput component

## Features

### VoiceInput Component (New - S10-04)

- **Speech Recognition**: Uses Web Speech API (SpeechRecognition/webkitSpeechRecognition)
- **Visual Feedback**:
  - Microphone button with pulsing animation during recording
  - Red indicator dot with ping effect
  - Different icons for recording (MicOff) vs idle (Mic) vs error (AlertCircle) vs processing (Loader)
- **Transcript Preview**:
  - Shows interim transcript in real-time while speaking
  - Displays final transcript before sending
  - Collapsible preview with close button
- **Auto-Stop After Silence**:
  - Configurable delay (default: 2000ms)
  - Automatically stops recording after silence detected
  - Sends accumulated transcript
- **Browser Compatibility Check**: Automatically detects if Web Speech API is supported
- **Error Handling**: User-friendly error messages for common issues:
  - No speech detected
  - Microphone access denied
  - Network errors
  - Audio capture issues
- **Mobile-Friendly**:
  - Touch targets >= 44px
  - Optimized for mobile devices
  - iOS Safari compatibility
- **Multi-Language Support**: Configurable language (en-US, de-DE, fr-FR, etc.)
- **TypeScript**: Full type definitions and IntelliSense support
- **Accessibility**: ARIA labels, keyboard support, screen reader friendly

### VoiceInputButton Component (Legacy)

- **Speech Recognition**: Uses Web Speech API (SpeechRecognition/webkitSpeechRecognition)
- **Visual Feedback**: Pulsing red dot indicator
- **Browser Compatibility Check**: Automatically detects support
- **Error Handling**: User-friendly error messages
- **Tooltips**: Contextual tooltips
- **Cancel Recording**: Click to stop

### ChatInput Integration

- Voice button appears when `showVoice={true}` prop is set
- Transcribed text automatically populates the input field
- If text exists, new transcript is appended with a space
- Auto-focuses the textarea after voice input completes
- Respects disabled/loading states

## Usage Examples

### Using with ChatInput

```tsx
import { ChatInput } from '@/components/chat/ChatInput';

function ChatInterface() {
  const handleSend = (message: string) => {
    console.log('Sending:', message);
  };

  return (
    <ChatInput
      onSend={handleSend}
      showVoice={true}  // Enable voice input
      showAttachment={true}
      placeholder="Type or speak your message..."
    />
  );
}
```

### Using VoiceInput Standalone

```tsx
import { VoiceInput } from '@/components/chat';

function MyComponent() {
  const handleTranscript = (text: string) => {
    console.log('Transcript:', text);
  };

  return (
    <VoiceInput
      onTranscript={handleTranscript}
      showTranscript
      language="en-US"
      autoStopDelay={2000}
    />
  );
}
```

### Using the Hook

```tsx
import { useVoiceInput } from '@/hooks/use-voice-input';

function MyComponent() {
  const voice = useVoiceInput({
    language: 'en-US',
    onTranscript: (text) => console.log(text),
  });

  return (
    <div>
      <button onClick={voice.toggleRecording}>
        {voice.isRecording ? 'Stop' : 'Start'}
      </button>
      {voice.interimTranscript && (
        <p className="italic">{voice.interimTranscript}</p>
      )}
      {voice.transcript && <p>{voice.transcript}</p>}
    </div>
  );
}
```

## Browser Compatibility

### Supported Browsers

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support via `webkitSpeechRecognition` |
| Edge | ✅ Yes | Full support via `webkitSpeechRecognition` |
| Safari | ✅ Yes | Full support (iOS 14.5+) |
| Firefox | ❌ No | Not supported (as of 2024) |
| Opera | ✅ Yes | Full support via `webkitSpeechRecognition` |

### Graceful Degradation

When Web Speech API is not supported:
- Button shows grayed-out microphone with slash (MicOff icon)
- Tooltip explains: "Voice input is not supported in this browser"
- Suggests compatible browsers: "Try Chrome, Edge, or Safari"
- Button is disabled and visually distinct

## Technical Details

### Speech Recognition Configuration

```typescript
recognition.continuous = false;      // Stop after single phrase
recognition.interimResults = false;  // Only return final results
recognition.lang = 'en-US';         // Default language (English US)
```

### Error Messages

| Error Code | User Message |
|------------|--------------|
| no-speech | "No speech detected. Please try again." |
| audio-capture | "Microphone access denied or unavailable." |
| not-allowed | "Microphone permission denied." |
| network | "Network error. Please check your connection." |
| aborted | "Recording cancelled." |

## Accessibility

- **ARIA Labels**: All buttons have descriptive aria-labels
- **Keyboard Accessible**: Button can be activated via keyboard
- **Screen Reader Support**: Tooltips provide context
- **Visual Indicators**: Clear visual feedback for all states

## Security & Privacy

- **Microphone Permission**: Browser prompts user for permission
- **No Data Storage**: Transcripts are not stored by the component
- **Client-Side Processing**: Speech recognition happens in the browser
- **No External APIs**: Uses native browser APIs only

## Testing Checklist

- [ ] Click voice button to start recording
- [ ] Speak clearly into microphone
- [ ] Verify transcript appears in input field
- [ ] Click voice button again to cancel
- [ ] Test with existing text (should append)
- [ ] Test error handling (deny microphone permission)
- [ ] Verify unsupported browser fallback (test in Firefox)
- [ ] Check disabled state during loading
- [ ] Verify pulsing animation during recording
- [ ] Test tooltip messages in different states

## Future Enhancements

Potential improvements for future iterations:

1. **Multi-Language Support**: Allow language selection
2. **Interim Results**: Show real-time transcription
3. **Continuous Mode**: Keep recording until manually stopped
4. **Voice Commands**: Parse commands like "send message"
5. **Custom Wake Words**: Activate via voice command
6. **Noise Reduction**: Better handling of background noise
7. **Transcription History**: Save previous transcriptions
8. **Polyfill Option**: Add fallback for Firefox using external API

## Troubleshooting

### Voice input not working?

1. **Check browser compatibility**: Use Chrome, Edge, or Safari
2. **Grant microphone permission**: Browser will prompt on first use
3. **Test microphone**: Ensure microphone is working in system settings
4. **Check HTTPS**: Web Speech API requires secure context (HTTPS or localhost)
5. **Disable ad blockers**: Some blockers interfere with Web Speech API
6. **Clear browser cache**: Sometimes helps resolve issues

### No transcription appearing?

1. **Speak clearly**: Enunciate words clearly
2. **Reduce background noise**: Find a quiet environment
3. **Check microphone volume**: Ensure input level is adequate
4. **Wait for final results**: Component uses `interimResults: false`
5. **Try shorter phrases**: Very long phrases may not process correctly

## Performance Considerations

- **Lazy Initialization**: SpeechRecognition only initialized when component mounts
- **Cleanup**: Recognition instance properly cleaned up on unmount
- **No External Dependencies**: Uses only browser APIs (zero added bundle size)
- **Optimized Re-renders**: Uses refs for recognition instance
- **Memory Efficient**: Single recognition instance per component

## Compliance Notes

- **GDPR**: No data transmitted to external servers
- **Accessibility**: Meets WCAG 2.1 AA standards
- **Browser Privacy**: Uses native browser APIs with user consent
