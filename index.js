const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

const createWebpackConfig = (root) => {
  const webpackConfig = {
    entry: [
      isDev && 'react-hot-loader/patch',
      path.resolve(root, './app/app.js'),
    ],
    output: {
      path: path.resolve(root, './dist'),
      filename: '[name]_[hash:6].js',
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@app': path.resolve(root, './app'),
        '@components': path.resolve(root, './app/components'),
        '@pages': path.resolve(root, './app/pages'),
        '@stores': path.resolve(root, './app/stores'),
        '@utils': path.resolve(root, './app/utils'),
      }
    },
    devtool: isProd ? '' : 'cheap-module-source-map',
    module: {
      loaders: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          // include: path.resolve(root, './app'),
          include: [
            path.resolve(root, 'app'),
            path.resolve(root, 'node_modules/nice-ui'),
          ],
          exclude: '/node_modules/',
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
        },
        {
          test:/\.(css|less)$/,
          loader: ExtractTextPlugin.extract({
            use: [
              { loader: 'css-loader' },
              {
                loader: 'less-loader',
                options: {
                  javascriptEnabled: true
                }
              },
            ],
            fallback: 'style-loader',
          }),
          exclude: '/node_modules/',
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: 'url-loader',
          query: {
            limit: 1024 * 10, // 10k以下编译成base64
            name: 'img/[name]_[hash:6].[ext]',
          }
        },
        {
          test: /\.(eot|woff|woff2|ttf|svg)$/,
          loader: 'file-loader',
        }
      ]
    },
    plugins: [
      new CircularDependencyPlugin({
        exclude: /node_modules/,
        failOnError: false,
        cwd: process.cwd(),
      }),
      new webpack.BannerPlugin('版权所有，翻版必究'),
      new HtmlWebpackPlugin({
        template: path.resolve(root, './app/template.html'),
      }),
      // new ExtractTextPlugin('style.css'),
      new ExtractTextPlugin({
        filename: '[name].css',
        disable: isDev ? true : false,
      }),
      new CleanWebpackPlugin(),
    ]
  }
  
  
  if (isProd) {
    webpackConfig.plugins.push(
      // 压缩 JS 代码
      new ParallelUglifyPlugin({
        sourceMap: true,
        uglifyJS: {
          output: {
            // 紧凑输出
            beautify: false,
            // 删除注释
            comments: false,
          },
          compress: {
            // 删除所有的 console 语句
            drop_console: true,
            // 内嵌定义了但是只用到一次的变量
            collapse_vars: true,
            // 提取出现多次但是没有定义变量取引用的静态值
            reduce_vars: true,
          },
          // 支持IE8
          // ie8: true,
        }
      }),
    );
  }
  
  if(isDev) {
    webpackConfig.plugins.push(
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new OpenBrowserPlugin({
        url: 'http://127.0.0.1:9999'
      }),
    );
    webpackConfig.devServer = {
      contentBase: path.resolve(root, './dist'),
      historyApiFallback: true,
      hot: true,
      progress: true,
      host: '127.0.0.1',
      port: 9999,
      proxy: require(path.resolve(root, './serverProxy')),
    };
  }
  
  return webpackConfig;
}

module.exports = createWebpackConfig;
