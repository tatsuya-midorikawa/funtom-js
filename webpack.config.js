const terser = require('terser-webpack-plugin');
const path = require('path')


module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new terser()],
  },
  entry: './src/funtom.js',
  output: {
      // 出力先ディレクトリ
      path: path.resolve(__dirname, './dst'),
      // 出力ファイル名
      filename: 'bundle.js'
  },
};