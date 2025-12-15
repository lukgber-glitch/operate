const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Disable PWA in development AND when running inside Capacitor native app
  disable: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true',
  register: true,
  skipWaiting: true,
  scope: '/',
  sw: 'sw.js',
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    // Exclude auth and sensitive endpoints from caching
    navigateFallbackDenylist: [
      /^\/api\/auth\/.*/,
      /^\/auth\/.*/,
    ],
    runtimeCaching: [
      // Google Fonts - Cache First (rarely changes)
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Font files - Stale While Revalidate
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      // Images - Stale While Revalidate
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // Next.js Image Optimization - Stale While Revalidate
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // JavaScript - Stale While Revalidate
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // CSS - Stale While Revalidate
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-style-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // API routes - Network First with cache fallback
      // Skip auth endpoints entirely (handled by navigateFallbackDenylist)
      {
        urlPattern: ({ url }) => {
          // Only cache non-auth API calls
          return url.pathname.startsWith('/api/') &&
                 !url.pathname.startsWith('/api/auth/') &&
                 !url.pathname.includes('/login') &&
                 !url.pathname.includes('/logout') &&
                 !url.pathname.includes('/register');
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60, // 1 hour (shorter for API data)
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // External API calls - Network First with cache fallback
      {
        urlPattern: /^https:\/\/.*\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'external-api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Everything else - Network First
      {
        urlPattern: /.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})

const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
)

// Bundle analyzer (use ANALYZE=true pnpm build to analyze)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Sentry configuration (optional - gracefully handles if not installed)
let withSentryConfig;
let sentryWebpackPluginOptions = {};

try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig;
  sentryWebpackPluginOptions = {
    // Sentry organization and project
    org: process.env.SENTRY_ORG || 'operate',
    project: process.env.SENTRY_PROJECT_WEB || 'operate-web',

    // Auth token for uploading source maps
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Suppress console output during build
    silent: true,

    // Upload source maps
    widenClientFileUpload: true,

    // Hide source maps from public
    hideSourceMaps: true,

    // Disable source map upload in development
    disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
    disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  };
} catch (e) {
  console.warn('⚠️  @sentry/nextjs not found - Sentry monitoring disabled');
  // Fallback: no-op wrapper if Sentry is not installed
  withSentryConfig = (config) => config;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@operate/shared'],

  // Security: Remove X-Powered-By header
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Comprehensive Security Headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    // Content Security Policy
    // Strict but allows necessary resources for the app
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self, inline (needed for Next.js), eval (needed for some libs), and CDNs
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sentry.io https://js.stripe.com https://accounts.google.com https://apis.google.com",
      // Styles: self, inline (needed for styled-components/emotion), Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self and Google Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self, data URIs, HTTPS sources, and common CDNs
      "img-src 'self' data: blob: https: http://localhost:*",
      // Connect (API calls): self, API, Sentry, Stripe, Google
      `connect-src 'self' ${isProduction ? 'https://operate.guru' : 'http://localhost:*'} https://*.sentry.io https://api.stripe.com https://accounts.google.com https://www.googleapis.com wss://*.pusher.com`,
      // Frames: Stripe, Google OAuth
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
      // Frame ancestors: none (prevent clickjacking)
      "frame-ancestors 'none'",
      // Form action: self only
      "form-action 'self' https://accounts.google.com",
      // Base URI: self only
      "base-uri 'self'",
      // Object: none (no plugins)
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join('; ');

    const securityHeaders = [
      // Strict Transport Security (HSTS)
      // max-age=1 year, include subdomains, preload ready
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: cspDirectives,
      },
      // Prevent clickjacking
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Referrer Policy - send origin only for cross-origin requests
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Permissions Policy - disable unnecessary browser features
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      // XSS Protection (legacy browsers)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // DNS Prefetch Control
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
    ];

    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Static assets - immutable caching (1 year) for hashed files
      {
        source: '/_next/static/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fonts - long cache
      {
        source: '/fonts/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images - moderate cache with revalidation
      {
        source: '/images/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Block source maps in production
      {
        source: '/:path*.map',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    // Use modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Minimize sizes for most common use cases
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
    // Allow remote images from common CDNs
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.gravatar.com' },
    ],
  },

  // Compiler optimizations (SWC)
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance optimizations
  experimental: {
    // Tree-shake specific packages for smaller bundles
    optimizePackageImports: [
      '@operate/shared',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-radio-group',
      'recharts',
      'date-fns',
      'zod',
      'framer-motion',
      'gsap',
      '@tanstack/react-query',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@hookform/resolvers',
      'react-hook-form',
      'clsx',
      'tailwind-merge',
    ],
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations in production
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        // Enable module concatenation (scope hoisting)
        concatenateModules: true,
        splitChunks: {
          chunks: 'all',
          // Increase min size to reduce number of chunks
          minSize: 20000,
          maxAsyncRequests: 30,
          maxInitialRequests: 25,
          cacheGroups: {
            // React and core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react-vendor',
              priority: 40,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-vendor',
              priority: 35,
              reuseExistingChunk: true,
            },
            // Animation libraries (GSAP + Framer Motion)
            animation: {
              test: /[\\/]node_modules[\\/](gsap|framer-motion)[\\/]/,
              name: 'animation-vendor',
              priority: 33,
              reuseExistingChunk: true,
            },
            // Chart library (heavy)
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              name: 'recharts-vendor',
              priority: 30,
              reuseExistingChunk: true,
            },
            // TanStack Query
            query: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'query-vendor',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Form libraries
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              name: 'forms-vendor',
              priority: 22,
              reuseExistingChunk: true,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
              minChunks: 2,
            },
          },
        },
      }
    }

    // Enable filesystem caching for faster rebuilds
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
    }

    return config
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint warnings should not fail production build
    // Linting is run separately in CI
    ignoreDuringBuilds: true,
  },
}

// Export configuration with Sentry wrapper
module.exports = withSentryConfig(
  withBundleAnalyzer(withPWA(withNextIntl(nextConfig))),
  sentryWebpackPluginOptions
)
