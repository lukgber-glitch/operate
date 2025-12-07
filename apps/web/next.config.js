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

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@operate/shared',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
    ],
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Split vendor chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // React and core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react-vendor',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-vendor',
              priority: 35,
              reuseExistingChunk: true,
            },
            // Chart library (heavy)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts-vendor',
              priority: 30,
              reuseExistingChunk: true,
            },
            // TanStack Query
            query: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              name: 'query-vendor',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
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
