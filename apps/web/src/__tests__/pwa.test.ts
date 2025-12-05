/**
 * PWA Utilities Tests
 */

import {
  isStandalone,
  isIOS,
  isAndroid,
  formatBytes,
  isServiceWorkerSupported,
  isNotificationSupported,
  getPWACapabilities,
} from '@/lib/pwa-utils'

// Mock window and navigator
const mockWindow = (overrides: Partial<Window> = {}) => {
  global.window = {
    matchMedia: jest.fn().mockReturnValue({ matches: false }),
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      serviceWorker: {},
    },
    ...overrides,
  } as any
}

describe('PWA Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isStandalone', () => {
    it('should return false when not in standalone mode', () => {
      mockWindow()
      expect(isStandalone()).toBe(false)
    })

    it('should return true when display-mode is standalone', () => {
      mockWindow({
        matchMedia: jest.fn().mockReturnValue({ matches: true }),
      } as any)
      expect(isStandalone()).toBe(true)
    })
  })

  describe('isIOS', () => {
    it('should return false for Windows user agent', () => {
      mockWindow()
      expect(isIOS()).toBe(false)
    })

    it('should return true for iPhone user agent', () => {
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
      } as any)
      expect(isIOS()).toBe(true)
    })

    it('should return true for iPad user agent', () => {
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        },
      } as any)
      expect(isIOS()).toBe(true)
    })
  })

  describe('isAndroid', () => {
    it('should return false for Windows user agent', () => {
      mockWindow()
      expect(isAndroid()).toBe(false)
    })

    it('should return true for Android user agent', () => {
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Linux; Android 10)',
        },
      } as any)
      expect(isAndroid()).toBe(true)
    })
  })

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should format with decimals', () => {
      expect(formatBytes(1536, 2)).toBe('1.5 KB')
      expect(formatBytes(1536000, 1)).toBe('1.5 MB')
    })
  })

  describe('isServiceWorkerSupported', () => {
    it('should return false when service worker is not supported', () => {
      mockWindow({ navigator: {} as any })
      expect(isServiceWorkerSupported()).toBe(false)
    })

    it('should return true when service worker is supported', () => {
      mockWindow({
        navigator: { serviceWorker: {} },
      } as any)
      expect(isServiceWorkerSupported()).toBe(true)
    })
  })

  describe('isNotificationSupported', () => {
    it('should return false when Notification is not supported', () => {
      mockWindow()
      expect(isNotificationSupported()).toBe(false)
    })

    it('should return true when Notification is supported', () => {
      mockWindow()
      ;(global.window as any).Notification = {}
      expect(isNotificationSupported()).toBe(true)
    })
  })

  describe('getPWACapabilities', () => {
    it('should return all capabilities', () => {
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          serviceWorker: {},
        },
      } as any)
      ;(global.window as any).Notification = {}

      const capabilities = getPWACapabilities()

      expect(capabilities).toHaveProperty('serviceWorker')
      expect(capabilities).toHaveProperty('notification')
      expect(capabilities).toHaveProperty('push')
      expect(capabilities).toHaveProperty('isStandalone')
      expect(capabilities).toHaveProperty('isIOS')
      expect(capabilities).toHaveProperty('isAndroid')
    })
  })
})
