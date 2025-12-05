import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from './i18n'

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: true,
})

// Paths that should NOT be processed by i18n middleware
// These are app routes that exist outside the [locale] folder
const nonLocalePaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/mfa-setup',
  '/mfa-verify',
  '/onboarding',
  '/dashboard',
  '/finance',
  '/hr',
  '/tax',
  '/documents',
  '/settings',
  '/reports',
  '/clients',
  '/crm',
  '/notifications',
  '/admin',
  '/integrations',
  '/offline',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

// Routes that require authentication but not onboarding
const authOnlyRoutes = [
  '/mfa-setup',
  '/mfa-verify',
  '/onboarding',
]

// Protected routes that require both auth and completed onboarding
const protectedRoutes = [
  '/',
  '/dashboard',
  '/finance',
  '/hr',
  '/tax',
  '/documents',
  '/settings',
  '/reports',
  '/clients',
  '/crm',
  '/notifications',
  '/admin',
  '/integrations',
]

/**
 * Check if user is authenticated by checking for access token cookie
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get('access_token')
  return !!accessToken
}

/**
 * Check onboarding status from cookie or header
 * Returns true if onboarding is complete
 */
function isOnboardingComplete(request: NextRequest): boolean {
  // Check for onboarding_complete cookie (set by API after successful onboarding)
  const onboardingCookie = request.cookies.get('onboarding_complete')
  if (onboardingCookie?.value === 'true') {
    return true
  }

  // Check for custom header (can be set by API on login)
  const onboardingHeader = request.headers.get('x-onboarding-complete')
  if (onboardingHeader === 'true') {
    return true
  }

  return false
}

/**
 * Check if path matches any route pattern
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route === pathname) return true
    if (pathname.startsWith(`${route}/`)) return true
    return false
  })
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if this is a non-locale path (app router path)
  const isNonLocalePath = nonLocalePaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )

  // If not a non-locale path, use i18n middleware for locale-prefixed paths
  if (!isNonLocalePath) {
    return intlMiddleware(request)
  }

  // Authentication and onboarding checks for non-locale paths
  const authenticated = isAuthenticated(request)
  const onboardingDone = isOnboardingComplete(request)

  // Public routes - allow access without auth
  if (matchesRoute(pathname, publicRoutes)) {
    // If already authenticated and trying to access login/register, redirect to home
    if (authenticated && (pathname === '/login' || pathname === '/register')) {
      // Check onboarding status
      if (!onboardingDone) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Auth-only routes (MFA, onboarding) - require auth but not onboarding
  if (matchesRoute(pathname, authOnlyRoutes)) {
    if (!authenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If accessing onboarding but already completed, redirect to home
    if (pathname.startsWith('/onboarding') && onboardingDone) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  }

  // Protected routes - require auth AND completed onboarding
  if (matchesRoute(pathname, protectedRoutes)) {
    if (!authenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!onboardingDone) {
      // Redirect to onboarding if not completed
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return NextResponse.next()
  }

  // Allow offline route
  if (pathname === '/offline') {
    return NextResponse.next()
  }

  // Default: allow access
  return NextResponse.next()
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
