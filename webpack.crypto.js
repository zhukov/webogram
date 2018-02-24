/* eslint-env node */

const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'webworker',
  entry: {
    app: './app/js/lib/crypto_worker.js',
  },

  output: {
    filename: 'crypto_worker.js',
    path: path.resolve(__dirname, 'dist/js/lib/')
  },

  resolve: {
    extensions: ['.js'],

    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'app', 'vendor'),
    ],
  },

  plugins: [
    new webpack.IgnorePlugin(/^fs$/),
    new webpack.ProvidePlugin({
      $: 'jquery/jquery.min',
      jQuery: 'jquery/jquery.min.js',
    })
  ]

};
