const path = require('path');
 
module.exports = [{
  mode: 'production',
  target: ['web'],
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'www', 'js'),
    filename: 'index.js',
  },
  devtool: 'source-map',
}, {
  mode: 'production',
  target: ['node'],
  entry: './src/native/electron/index.js',
  output: {
    path: path.resolve(__dirname, 'platforms', 'electron', 'platform_www'),
    filename: 'native.js',
    libraryTarget: 'commonjs2'
  },
  devtool: 'source-map',
}];
