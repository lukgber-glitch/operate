const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = function (options) {
  // Packages to bundle (not treat as external) - required at runtime
  // Note: @sentry/* must stay external due to native binary modules
  const bundledPackages = [
    /^@operate\//,
    'compression',
  ];

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    ...options,
    // Enable persistent caching for faster rebuilds
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename],
      },
      // Invalidate cache on config changes
      version: '1.0.0',
    },
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, "node_modules"),
        allowlist: bundledPackages,
      }),
      nodeExternals({
        modulesDir: path.resolve(__dirname, "../../node_modules"),
        allowlist: bundledPackages,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, "tsconfig.json"),
            // Enable happy pack mode for parallel compilation
            happyPackMode: true,
            // Use experimental watch API for faster incremental builds
            experimentalWatchApi: true,
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@modules": path.resolve(__dirname, "src/modules"),
        "@common": path.resolve(__dirname, "src/common"),
        "@config": path.resolve(__dirname, "src/config"),
        "@operate/ai": path.resolve(__dirname, "../../packages/ai/src"),
        "@operate/database": path.resolve(__dirname, "../../packages/database/src"),
        "@operate/shared": path.resolve(__dirname, "../../packages/shared/src"),
      },
      // Enable caching for resolver
      cache: true,
    },
    // Optimization settings
    optimization: {
      ...options.optimization,
      // Don't minimize in development for faster builds
      minimize: isProduction,
      // Module IDs for better long-term caching
      moduleIds: 'deterministic',
    },
    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    // Disable type checker plugin during build (run typecheck separately)
    // This avoids memory issues and allows faster builds
    plugins: [
      ...(options.plugins || []).filter(p => p.constructor.name !== 'ForkTsCheckerWebpackPlugin'),
    ],
  };
};
