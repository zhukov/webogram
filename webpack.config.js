/* eslint-env node */

const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    app: './app/js/bootstrap.js',
  },

  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist/js/')
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
