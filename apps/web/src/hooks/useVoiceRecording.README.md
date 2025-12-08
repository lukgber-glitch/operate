# useVoiceRecording Hook

React hook for recording audio using the MediaRecorder API. Returns audio blobs that can be uploaded to servers or sent to transcription APIs like OpenAI Whisper.

## Overview

The `useVoiceRecording` hook provides a clean interface to:
- Record audio using the Web Audio API and MediaRecorder
- Handle browser permissions for microphone access
- Work across modern mobile and desktop browsers
- Automatically manage cleanup on unmount
- Return audio as a Blob for upload or playback

## Key Features

- **Cross-browser support**: Chrome, Edge, Firefox, Safari (mobile & desktop)
- **Audio formats**: Automatically selects best format (webm/opus on Chrome/Firefox, mp4 on Safari)
- **Max duration**: Auto-stop recording after specified time
- **Duration tracking**: Real-time recording duration in milliseconds
- **Audio playback**: Automatic URL creation for `<audio>` element
- **Error handling**: User-friendly error messages for common issues
- **Cleanup**: Automatic resource cleanup on unmount

## Difference from useVoiceInput

| Hook | Purpose | API Used | Returns |
|------|---------|----------|---------|
| **useVoiceRecording** | Record audio files | MediaRecorder | Audio Blob |
| **useVoiceInput** | Speech-to-text | Web Speech API | Text transcript |

Use `useVoiceRecording` when you need to:
- Send audio to a server for processing
- Use external transcription APIs (Whisper, etc.)
- Store audio recordings
- Allow users to review before sending

Use `useVoiceInput` when you need:
- Real-time speech-to-text
- Browser-native transcription
- Instant text input from voice

## Installation

The hook is already available in the project:

```tsx
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
```

## Basic Usage

```tsx
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

function AudioRecorder() {
  const {
    isRecording,
    isSupported,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecording({
    maxDuration: 60000, // 1 minute
    onStop: (blob) => {
      console.log('Recording stopped:', blob.size, 'bytes');
    },
  });

  if (!isSupported) {
    return <div>Voice recording not supported</div>;
  }

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Record'}
      </button>

      {isRecording && <div>Recording: {Math.floor(duration / 1000)}s</div>}

      {audioUrl && <audio src={audioUrl} controls />}

      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## API Reference

### Hook Parameters

```tsx
interface UseVoiceRecordingOptions {
  // Maximum recording duration in milliseconds (default: 300000 = 5 minutes)
  maxDuration?: number;

  // MIME type for recording (default: auto-detected)
  mimeType?: string;

  // Callback when recording starts
  onStart?: () => void;

  // Callback when recording stops (receives audio blob)
  onStop?: (audioBlob: Blob) => void;

  // Callback when an error occurs
  onError?: (error: string) => void;

  // Callback when max duration is reached
  onMaxDuration?: () => void;
}
```

### Return Values

```tsx
interface UseVoiceRecordingReturn {
  // Current state
  isRecording: boolean;
  isSupported: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;

  // Control functions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  clearError: () => void;
}
```

## Advanced Examples

### Upload to Server

```tsx
function VoiceUploader() {
  const { audioBlob, startRecording, stopRecording } = useVoiceRecording();

  const uploadAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/upload-audio', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Uploaded:', data.url);
  };

  return (
    <div>
      <button onClick={startRecording}>Record</button>
      <button onClick={stopRecording}>Stop</button>
      {audioBlob && <button onClick={uploadAudio}>Upload</button>}
    </div>
  );
}
```

### Transcribe with OpenAI Whisper

```tsx
function WhisperTranscriber() {
  const { audioBlob, startRecording, stopRecording } = useVoiceRecording();
  const [transcript, setTranscript] = useState('');

  const transcribe = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();
    setTranscript(data.text);
  };

  return (
    <div>
      <button onClick={startRecording}>Record</button>
      <button onClick={stopRecording}>Stop</button>
      {audioBlob && <button onClick={transcribe}>Transcribe</button>}
      {transcript && <p>{transcript}</p>}
    </div>
  );
}
```

### With Progress Indicator

```tsx
function VoiceRecorderWithProgress() {
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
  } = useVoiceRecording({
    maxDuration: 60000, // 1 minute
    onMaxDuration: () => {
      alert('Maximum recording duration reached!');
    },
  });

  const maxDuration = 60000;
  const progress = (duration / maxDuration) * 100;

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Record'}
      </button>

      {isRecording && (
        <div>
          <div>Time: {Math.floor(duration / 1000)}s / 60s</div>
          <div style={{ width: '100%', height: '4px', background: '#eee' }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#007bff',
                transition: 'width 0.1s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Browser Support

| Browser | Format | Codec | Status |
|---------|--------|-------|--------|
| Chrome | webm | opus | ✅ Full support |
| Firefox | webm | opus | ✅ Full support |
| Edge | webm | opus | ✅ Full support |
| Safari (macOS) | mp4 | aac | ✅ Full support |
| Safari (iOS) | mp4 | aac | ✅ Full support |
| Mobile Chrome | webm | opus | ✅ Full support |
| Mobile Firefox | webm | opus | ✅ Full support |

## Audio Formats

The hook automatically detects and uses the best supported audio format:

1. **webm with opus codec** (Chrome, Firefox, Edge)
   - Excellent compression
   - Good quality
   - Smaller file sizes

2. **mp4 with aac codec** (Safari)
   - Native Safari support
   - Good compatibility

3. **Fallback formats** (if needed)
   - webm (without codec specification)
   - ogg with opus
   - wav (uncompressed, larger files)

## Error Handling

The hook provides user-friendly error messages:

| Error | Message | Solution |
|-------|---------|----------|
| Permission denied | "Microphone permission denied..." | User must allow microphone access |
| No microphone | "No microphone found..." | Connect a microphone |
| Already in use | "Microphone is already in use..." | Close other apps using microphone |
| Not supported | "Voice recording is not supported..." | Use a modern browser |

## Performance Considerations

- **Memory**: Audio data is collected in chunks every 100ms
- **Storage**: Recorded audio is kept in memory as a Blob
- **Cleanup**: URLs are automatically revoked on unmount
- **Max duration**: Prevents excessive memory usage

## Troubleshooting

### Recording doesn't start

1. Check browser support with `isSupported`
2. Check microphone permissions
3. Check if microphone is already in use
4. Check browser console for errors

### Audio quality is poor

1. Use a better microphone
2. Reduce background noise
3. Check microphone settings in OS
4. Consider using a different codec/format

### File size is too large

1. Reduce `maxDuration`
2. Use opus codec (more efficient than aac)
3. Consider compressing on the server side

### Safari issues

- Safari uses mp4/aac format (different from Chrome/Firefox)
- Ensure your server can handle both webm and mp4 formats
- Test on both iOS Safari and desktop Safari

## Related Hooks

- **use-voice-input.ts** - Browser-native speech-to-text
- **components/chat/voice/useVoiceInput.ts** - Enhanced voice input with audio visualization
- **components/chat/voice/useSpeechRecognition.ts** - Low-level speech recognition

## Files

- `useVoiceRecording.ts` - Main hook implementation
- `useVoiceRecording.example.tsx` - Usage examples
- `useVoiceRecording.README.md` - This documentation

## License

Part of the Operate project.
