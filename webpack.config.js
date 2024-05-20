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
}];
