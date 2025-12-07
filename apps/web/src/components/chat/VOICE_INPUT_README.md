# VoiceInput Component

Speech-to-text voice input component for chat using the Web Speech API.

## Features

- ✅ Microphone button with start/stop recording
- ✅ Visual feedback with pulsing animation while recording
- ✅ Real-time transcript preview
- ✅ Auto-stop after silence detection
- ✅ Browser compatibility checks
- ✅ Error handling with user-friendly messages
- ✅ Mobile-friendly touch targets (44px min)
- ✅ Accessibility support (ARIA labels)
- ✅ TypeScript support

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| Safari | ✅ Yes | WebKit implementation |
| Firefox | ❌ No | Not supported |
| Opera | ⚠️ Partial | Via Chromium |

## Installation

The component is already installed in the project. No additional dependencies required.

## Basic Usage

```tsx
import { VoiceInput } from '@/components/chat/VoiceInput';

function MyComponent() {
  const handleTranscript = (text: string) => {
    console.log('Transcript:', text);
  };

  return (
    <VoiceInput
      onTranscript={handleTranscript}
      showTranscript
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onTranscript` | `(text: string) => void` | Required | Callback when final transcript is ready |
| `onRecordingStart` | `() => void` | Optional | Callback when recording starts |
| `onRecordingEnd` | `() => void` | Optional | Callback when recording ends |
| `disabled` | `boolean` | `false` | Disable the voice input |
| `className` | `string` | - | Additional CSS classes |
| `language` | `string` | `'en-US'` | Speech recognition language |
| `autoStopDelay` | `number` | `2000` | Auto-stop delay in ms after silence |
| `showTranscript` | `boolean` | `true` | Show transcript preview |

## States

### 1. Idle
- Default state
- Microphone icon in neutral color
- No animation

### 2. Recording
- Pulsing animation on button
- Red indicator dot with ping effect
- Transcript preview visible (if enabled)
- Shows interim results in real-time

### 3. Processing
- Loading spinner
- Appears briefly between stop and final transcript

### 4. Error
- Alert icon in destructive color
- Error message displayed
- Can be dismissed

## Advanced Usage

### With Custom Language

```tsx
<VoiceInput
  language="de-DE"
  onTranscript={(text) => console.log(text)}
/>
```

### With Callbacks

```tsx
<VoiceInput
  onTranscript={(text) => setMessage(text)}
  onRecordingStart={() => console.log('Started')}
  onRecordingEnd={() => console.log('Ended')}
/>
```

### Integrated with Form

```tsx
function ChatForm() {
  const [message, setMessage] = useState('');

  return (
    <form>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <VoiceInput
        onTranscript={(text) => setMessage(prev => prev + ' ' + text)}
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Using the Hook Directly

For more control, use the `useVoiceInput` hook:

```tsx
import { useVoiceInput } from '@/hooks/use-voice-input';

function MyComponent() {
  const voice = useVoiceInput({
    language: 'en-US',
    autoStopDelay: 3000,
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
      {voice.transcript && (
        <p>{voice.transcript}</p>
      )}
    </div>
  );
}
```

### Hook Return Values

```typescript
{
  // State
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;

  // Methods
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
  clearTranscript: () => void;
  clearError: () => void;
}
```

## Utilities

### Browser Support Check

```tsx
import { checkSpeechRecognitionSupport } from '@/lib/voice-utils';

if (!checkSpeechRecognitionSupport()) {
  console.warn('Speech recognition not supported');
}
```

### Get Supported Languages

```tsx
import { getSupportedLanguages } from '@/lib/voice-utils';

const languages = getSupportedLanguages();
// [{ code: 'en-US', name: 'English (US)' }, ...]
```

### Request Microphone Permission

```tsx
import { requestMicrophonePermission } from '@/lib/voice-utils';

try {
  await requestMicrophonePermission();
} catch (error) {
  console.error('Permission denied');
}
```

### Optimal Settings for Device

```tsx
import { getOptimalSettings } from '@/lib/voice-utils';

const settings = getOptimalSettings();
// Returns device-specific optimal settings
```

## Styling

The component uses CSS-in-JS for the pulsing animation. You can customize the appearance:

```tsx
<VoiceInput
  className="custom-voice-input"
  onTranscript={handleTranscript}
/>
```

```css
.custom-voice-input {
  /* Your custom styles */
}
```

## Animation

The pulsing animation while recording:

```css
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

## Error Handling

The component handles various error scenarios:

1. **Browser Not Supported**
   - Shows disabled mic icon with tooltip
   - Suggests compatible browsers

2. **Permission Denied**
   - Shows error message
   - Provides guidance to enable permissions

3. **No Speech Detected**
   - Timeout after silence
   - User can retry

4. **Network Error**
   - Shows connection error
   - Suggests checking internet

## Accessibility

- **ARIA Labels**: All buttons have descriptive labels
- **Touch Targets**: Minimum 44px for mobile
- **Keyboard**: Space/Enter to activate
- **Screen Readers**: Status announcements
- **Focus States**: Visible focus indicators

## Mobile Considerations

1. **Auto-stop Delay**: Shorter on mobile (1500ms vs 2000ms)
2. **Touch Targets**: Larger buttons (44px minimum)
3. **Battery**: Non-continuous mode on mobile
4. **iOS**: Special handling for Safari quirks

## Security & Privacy

- Microphone permission required
- No audio data stored
- Processing done client-side
- Web Speech API uses browser's service

## Troubleshooting

### Microphone Not Working

1. Check browser permissions
2. Ensure microphone is connected
3. Close other apps using microphone
4. Try different browser

### Poor Recognition

1. Speak clearly and slowly
2. Reduce background noise
3. Check microphone placement
4. Verify selected language

### Auto-stop Too Fast/Slow

Adjust the `autoStopDelay` prop:

```tsx
<VoiceInput
  autoStopDelay={3000} // 3 seconds
  onTranscript={handleTranscript}
/>
```

## Examples

See `VoiceInput.example.tsx` for complete examples:

1. Basic Usage
2. Multilingual Support
3. With Callbacks
4. Using Hook Directly
5. Chat Integration

## Related Components

- `ChatInput` - Main chat input with voice support
- `VoiceInputButton` (voice/) - Advanced voice features
- `VoiceRecorder` (voice/) - Full voice recording UI
- `VoiceWaveform` (voice/) - Audio visualization

## API Reference

### VoiceInput Component

```typescript
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
  disabled?: boolean;
  className?: string;
  language?: string;
  autoStopDelay?: number;
  showTranscript?: boolean;
}
```

### useVoiceInput Hook

```typescript
interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoStopDelay?: number;
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}
```

## Future Enhancements

- [ ] Voice commands (send, clear, cancel)
- [ ] Audio visualization waveform
- [ ] Text-to-speech for responses
- [ ] Offline support
- [ ] Custom wake words
- [ ] Multi-language detection
- [ ] Noise cancellation

## Support

For issues or questions:
1. Check browser compatibility
2. Review troubleshooting guide
3. See examples in `VoiceInput.example.tsx`
4. Check console for error messages

## License

Part of the Operate project.
