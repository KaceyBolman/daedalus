const path = require('path');
const webpack = require('webpack');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const lodash = require('lodash');
const yamljs = require('yamljs');

// Process env flags from buildkite and appveyor
const isCi = process.env.CI && process.env.CI !== '';

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: './source/main/index.js',
  output: {
    path: path.join(__dirname, './dist/main'),
    filename: 'index.js'
  },
  /**
   * Set targed to Electron speciffic node.js env.
   * https://github.com/chentsulin/webpack-target-electron-renderer#how-this-module-works
   */
  target: 'electron-main',
  cache: true,
  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: /source/,
        exclude: /source\/renderer/,
        use: {
          loader: 'babel-loader',
        },
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin(Object.assign({
      'process.env.API': JSON.stringify(process.env.API || 'ada'),
      'process.env.API_VERSION': JSON.stringify(process.env.API_VERSION || 'dev'),
      'process.env.MOBX_DEV_TOOLS': process.env.MOBX_DEV_TOOLS || 0,
    }, process.env.NODE_ENV === 'production' ? {
      // Only bake in NODE_ENV and WALLET_PORT values for production builds.
      // This is so that the test suite based on the webpack build will
      // choose the correct path to ca.crt (see loadTlsConfig.jss).
      'process.env.NODE_ENV': '"production"',
      'process.env.WALLET_PORT': JSON.stringify(process.env.WALLET_PORT || ''),
    } : {})),
    !isCi && (
      new HardSourceWebpackPlugin({
        configHash: (webpackConfig) => (
          // Remove the `watch` flag to avoid different caches for static and incremental builds
          require('node-object-hash')({ sort: false }).hash(lodash.omit(webpackConfig, 'watch'))
        ),
        environmentPaths: {
          files: ['.babelrc', 'yarn.lock'],
        },
      })
    )
  ].filter(Boolean),
};
