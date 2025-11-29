const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: [
          /^@operate\//,
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
          exclude: /node_modules\/(?!@operate)/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@common': path.resolve(__dirname, 'src/common'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@operate/ai': path.resolve(__dirname, '../../packages/ai/src'),
        '@operate/database': path.resolve(__dirname, '../../packages/database/src'),
        '@operate/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
  };
};
