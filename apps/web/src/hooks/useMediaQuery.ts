'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to track media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  // Return false during SSR to avoid hydration mismatch
  return mounted ? matches : false
}

/**
 * Predefined breakpoint hooks based on Tailwind's default breakpoints
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsSmallScreen() {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsMediumScreen() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsLargeScreen() {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsExtraLargeScreen() {
  return useMediaQuery('(min-width: 1280px)')
}

/**
 * Hook to check if the device supports touch
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

/**
 * Hook to get the current breakpoint name
 */
export function useBreakpoint() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  if (isDesktop) return 'desktop'
  return 'mobile' // default
}
