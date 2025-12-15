'use client'

import * as React from 'react'

/**
 * Phase 9: Skip Links Component
 *
 * Provides keyboard-accessible skip links for screen reader users
 * and keyboard-only navigation.
 */

interface SkipLink {
  /** Target element ID (without #) */
  targetId: string
  /** Link text */
  label: string
}

interface SkipLinksProps {
  /** Array of skip link configurations */
  links?: SkipLink[]
  /** Additional class names */
  className?: string
}

const defaultLinks: SkipLink[] = [
  { targetId: 'main-content', label: 'Skip to main content' },
  { targetId: 'main-navigation', label: 'Skip to navigation' },
]

export function SkipLinks({
  links = defaultLinks,
  className,
}: SkipLinksProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className={`skip-links ${className || ''}`} role="navigation" aria-label="Skip links">
      {links.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          className="skip-link"
          onClick={(e) => handleClick(e, link.targetId)}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

/**
 * Landmark wrapper component
 * Adds proper ARIA landmarks and focusable targets for skip links
 */
interface LandmarkProps {
  /** Element ID for skip link targeting */
  id: string
  /** ARIA role */
  role?: 'main' | 'navigation' | 'complementary' | 'contentinfo' | 'search' | 'banner'
  /** ARIA label */
  'aria-label'?: string
  /** Children */
  children: React.ReactNode
  /** Additional class names */
  className?: string
  /** HTML tag to render */
  as?: 'main' | 'nav' | 'aside' | 'footer' | 'header' | 'section' | 'div'
}

export function Landmark({
  id,
  role,
  'aria-label': ariaLabel,
  children,
  className,
  as: Tag = 'div',
}: LandmarkProps) {
  return (
    <Tag
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={className}
      tabIndex={-1} // Makes it focusable for skip links
    >
      {children}
    </Tag>
  )
}

/**
 * Screen reader announcement component
 * For dynamic content updates
 */
interface AnnounceProps {
  /** Message to announce */
  message: string
  /** Politeness level */
  politeness?: 'polite' | 'assertive'
  /** Clear message after announcement */
  clearAfter?: number
}

export function Announce({
  message,
  politeness = 'polite',
  clearAfter = 1000,
}: AnnounceProps) {
  const [announcement, setAnnouncement] = React.useState(message)

  React.useEffect(() => {
    setAnnouncement(message)

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('')
      }, clearAfter)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

/**
 * Hook for programmatic announcements
 */
export function useAnnounce() {
  const [message, setMessage] = React.useState('')
  const [politeness, setPoliteness] = React.useState<'polite' | 'assertive'>('polite')

  const announce = React.useCallback((text: string, level: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(level)
    // Clear first to ensure re-announcement
    setMessage('')
    requestAnimationFrame(() => {
      setMessage(text)
    })
  }, [])

  const Announcer = React.useCallback(() => (
    <Announce message={message} politeness={politeness} />
  ), [message, politeness])

  return { announce, Announcer }
}

export default SkipLinks
