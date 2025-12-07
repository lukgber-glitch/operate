// Google Analytics gtag types
interface Window {
  gtag?: (
    command: 'config' | 'event' | 'consent',
    targetId: string,
    config?: Record<string, any>
  ) => void;
}
