'use client'

import { useEffect, useRef, useState } from 'react'

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
}

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: (x: number, y: number) => void
  onSwipeEnd?: (direction: SwipeDirection) => void
}

export interface SwipeConfig {
  minSwipeDistance?: number
  maxSwipeTime?: number
  preventDefaultTouchEvents?: boolean
}

/**
 * Custom hook to detect swipe gestures on touch devices
 * @param handlers - Callback functions for different swipe directions
 * @param config - Configuration options for swipe detection
 * @returns Ref to attach to the element you want to track swipes on
 */
export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(
  handlers: SwipeHandlers = {},
  config: SwipeConfig = {}
) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 1000,
    preventDefaultTouchEvents = false,
  } = config

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const elementRef = useRef<T>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (preventDefaultTouchEvents) {
        e.preventDefault()
      }

      const touch = e.touches[0]
      if (!touch) return

      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()

      handlers.onSwipeStart?.(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (preventDefaultTouchEvents) {
        e.preventDefault()
      }

      const touch = e.changedTouches[0]
      if (!touch) return

      const touchEndX = touch.clientX
      const touchEndY = touch.clientY
      const touchEndTime = Date.now()

      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current
      const deltaTime = touchEndTime - touchStartTime.current

      // Check if swipe was quick enough
      if (deltaTime > maxSwipeTime) return

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine primary direction
      let direction: 'left' | 'right' | 'up' | 'down' | null = null
      let distance = 0

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (absDeltaX >= minSwipeDistance) {
          if (deltaX > 0) {
            direction = 'right'
            distance = deltaX
            handlers.onSwipeRight?.()
          } else {
            direction = 'left'
            distance = Math.abs(deltaX)
            handlers.onSwipeLeft?.()
          }
        }
      } else {
        // Vertical swipe
        if (absDeltaY >= minSwipeDistance) {
          if (deltaY > 0) {
            direction = 'down'
            distance = deltaY
            handlers.onSwipeDown?.()
          } else {
            direction = 'up'
            distance = Math.abs(deltaY)
            handlers.onSwipeUp?.()
          }
        }
      }

      handlers.onSwipeEnd?.({ direction, distance })
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefaultTouchEvents })
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefaultTouchEvents })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handlers, minSwipeDistance, maxSwipeTime, preventDefaultTouchEvents])

  return elementRef
}

/**
 * Hook to track swipe state
 * @param config - Configuration options
 * @returns Object with swipe state and ref
 */
export function useSwipeState<T extends HTMLElement = HTMLDivElement>(
  config: SwipeConfig = {}
) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection['direction']>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const ref = useSwipeGesture<T>(
    {
      onSwipeStart: () => setIsSwiping(true),
      onSwipeEnd: ({ direction, distance }) => {
        setSwipeDirection(direction)
        setSwipeDistance(distance)
        setIsSwiping(false)

        // Reset after a short delay
        setTimeout(() => {
          setSwipeDirection(null)
          setSwipeDistance(0)
        }, 100)
      },
    },
    config
  )

  return {
    ref,
    swipeDirection,
    swipeDistance,
    isSwiping,
  }
}
