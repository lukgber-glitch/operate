const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = function (options) {
  // Packages to bundle (not treat as external) - required at runtime
  // Note: @sentry/* must stay external due to native binary modules
  const bundledPackages = [
    /^@operate\//,
    'compression',
  ];

  return {
    ...options,
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
    },
  };
};
