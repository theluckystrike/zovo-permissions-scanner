const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'content-script': './src/content-script.ts',
    'background': './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
};
