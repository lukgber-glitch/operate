/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@operate/shared'],
  experimental: {
    optimizePackageImports: ['@operate/shared'],
  },
  typescript: {
    // Enable during development, but enforce in CI
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable during development, but enforce in CI
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
