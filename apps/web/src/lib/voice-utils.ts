/**
 * Voice Input Utilities
 *
 * Helper functions for voice input and speech recognition
 */

/**
 * Check if the browser supports the Web Speech API
 *
 * @returns True if speech recognition is supported
 *
 * @example
 * ```tsx
 * if (!checkSpeechRecognitionSupport()) {
 *   console.warn('Speech recognition not supported');
 * }
 * ```
 */
export function checkSpeechRecognitionSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Define SpeechRecognition type for cross-browser support
type SpeechRecognitionType = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

/**
 * Get the browser's supported speech recognition API
 *
 * @returns The SpeechRecognition constructor or null
 */
export function getSpeechRecognitionAPI(): SpeechRecognitionType | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Check if text-to-speech is supported
 *
 * @returns True if speech synthesis is supported
 */
export function checkSpeechSynthesisSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

/**
 * Get user-friendly browser name for error messages
 *
 * @returns Browser name or 'Unknown'
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
  if (userAgent.includes('edg')) return 'Edge';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
  if (userAgent.includes('firefox')) return 'Firefox';
  if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';

  return 'Unknown';
}

/**
 * Get supported browsers for speech recognition
 *
 * @returns List of supported browser names
 */
export function getSupportedBrowsers(): string[] {
  return ['Chrome', 'Edge', 'Safari'];
}

/**
 * Get fallback message when speech recognition is not supported
 *
 * @returns User-friendly message with browser recommendations
 */
export function getUnsupportedMessage(): string {
  const currentBrowser = getBrowserName();
  const supportedBrowsers = getSupportedBrowsers();

  if (currentBrowser === 'Unknown') {
    return `Voice input is not supported in this browser. Please use ${supportedBrowsers.join(', ')}.`;
  }

  if (!supportedBrowsers.includes(currentBrowser)) {
    return `Voice input is not supported in ${currentBrowser}. Please use ${supportedBrowsers.join(' or ')}.`;
  }

  return 'Voice input is not available. Please check your browser settings.';
}

/**
 * Request microphone permission
 *
 * @returns Promise that resolves when permission is granted
 * @throws Error if permission is denied
 */
export async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please allow access in browser settings.');
      }
      if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      }
      if (error.name === 'NotReadableError') {
        throw new Error('Microphone is already in use by another application.');
      }
    }
    throw new Error('Failed to access microphone.');
  }
}

/**
 * Check if microphone permission is granted
 *
 * @returns Promise that resolves to true if permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return false;
  }

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state === 'granted';
  } catch (error) {
    // Permissions API not supported or error
    return false;
  }
}

/**
 * Get available speech recognition languages
 *
 * @returns List of common language codes
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'es-ES', name: 'Español' },
    { code: 'it-IT', name: 'Italiano' },
    { code: 'pt-PT', name: 'Português' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'nl-NL', name: 'Nederlands' },
    { code: 'pl-PL', name: 'Polski' },
    { code: 'ru-RU', name: 'Русский' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'zh-TW', name: '中文 (繁體)' },
    { code: 'ko-KR', name: '한국어' },
  ];
}

/**
 * Format error message for speech recognition errors
 *
 * @param error - Browser error code
 * @returns User-friendly error message
 */
export function formatSpeechError(error: string): string {
  const errorMessages: Record<string, string> = {
    'no-speech': 'No speech detected. Please try again.',
    'audio-capture': 'Could not access your microphone. Please check permissions.',
    'not-allowed': 'Microphone permission denied. Please allow access.',
    'network': 'Network error. Please check your internet connection.',
    'aborted': 'Recording was stopped.',
    'service-not-allowed': 'Speech recognition service is not available.',
    'bad-grammar': 'Speech recognition failed. Please try again.',
    'language-not-supported': 'Selected language is not supported.',
  };

  return errorMessages[error] || 'An error occurred. Please try again.';
}

/**
 * Debounce function for voice input
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if the device is mobile
 *
 * @returns True if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the device is iOS
 *
 * @returns True if device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Get optimal speech recognition settings for the current device
 *
 * @returns Recommended settings object
 */
export function getOptimalSettings() {
  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();

  return {
    continuous: !isMobile, // Use non-continuous on mobile to save battery
    interimResults: true,
    maxAlternatives: 1,
    autoStopDelay: isMobile ? 1500 : 2000, // Shorter delay on mobile
    // iOS Safari has quirks with continuous mode
    iosWorkaround: isIOS,
  };
}
