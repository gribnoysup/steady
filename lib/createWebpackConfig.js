// @ts-check
const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const safePostCssParser = require('postcss-safe-parser');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CrittersPlugin = require('critters-webpack-plugin');
const WebpackBarPlugin = require('webpackbar');

const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

const PrerenderHTMLWebpackPlugin = require('./PrerenderHTMLWebpackPlugin');

const paths = require('../config/paths');

const BUILD_MODE = {
  development: 'development',
  production: 'production',
};

const BUILD_TARGET = {
  node: 'node',
  web: 'web',
};

const ENTRY_CHUNK_NAME = 'main';

let getStyleLoaders = (cssOptions, dev = false) =>
  [
    dev && require.resolve('style-loader'),
    !dev && MiniCssExtractPlugin.loader,
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        ident: 'postcss',
        plugins() {
          return [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprevixed: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
          ];
        },
      },
    },
  ].filter(Boolean);

let createWebpackConfig = (mode = BUILD_MODE.production) => {
  const IS_DEV = mode === BUILD_MODE.development;
  const IS_PROD = mode === BUILD_MODE.production;

  const IS_RENDER_EXISTS = fs.existsSync(paths.appRender);
  const IS_APP_BABELRC = fs.existsSync(paths.appBabelrc);

  return {
    target: BUILD_TARGET.node,

    mode: IS_DEV ? BUILD_MODE.development : BUILD_MODE.production,

    entry: {
      [ENTRY_CHUNK_NAME]: IS_RENDER_EXISTS ? paths.appRender : paths.appSrc,
    },

    output: {
      path: paths.outputDir,
      filename: '[name].js',
      publicPath: process.env.PUBLIC_PATH || '',
      libraryTarget: 'commonjs2',
    },

    optimization: {
      minimize: IS_PROD,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
          parallel: true,
          cache: true,
          // sourceMap: shouldUseSourceMap,
        }),

        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            // map: shouldUseSourceMap
            //   ? {
            //       // `inline: false` forces the sourcemap to be output into a
            //       // separate file
            //       inline: false,
            //       // `annotation: true` appends the sourceMappingURL to the end of
            //       // the css file, helping the browser find the sourcemap
            //       annotation: true,
            //     }
            //   : false,
          },
        }),
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        { parser: { requireEnsure: false } },

        {
          test: /\.(js|mjs|jsx)$/,
          include: paths.appSrc,
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              IS_APP_BABELRC
                ? require.resolve(paths.appBabelrc)
                : require.resolve(paths.babelrc),
            ],
            cacheDirectory: true,
            cacheCompression: IS_PROD,
            compact: IS_PROD,
          },
        },

        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: getStyleLoaders(
            {
              importLoaders: 1,
              // sourceMap: isEnvProduction && shouldUseSourceMap,
            },
            IS_DEV
          ),
        },

        {
          test: /\.module\.css$/,
          use: getStyleLoaders(
            {
              importLoaders: 1,
              // sourceMap: isEnvProduction && shouldUseSourceMap,
              modules: true,
              getLocalIdent: getCSSModuleLocalIdent,
            },
            IS_DEV
          ),
        },

        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve('url-loader'),
          options: {
            limit: 1024,
            name: '/static/media/[name].[hash:8].[ext]',
          },
        },

        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve('responsive-loader'),
          options: {
            name: '/static/media/[name].[width].[hash:8].[ext]',
          },
        },

        {
          loader: require.resolve('file-loader'),
          exclude: [/\.(js|mjs|jsx)$/, /\.css/, /\.html$/, /\.json$/],
          options: {
            name: '/static/media/[name].[hash:8].[ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: false,
        template: paths.htmlTemplate,
        minify: IS_PROD,
      }),

      new PrerenderHTMLWebpackPlugin({
        entryChunkName: ENTRY_CHUNK_NAME,
        isCustomRenderMethodProvided: IS_RENDER_EXISTS,
      }),

      new IgnoreEmitPlugin(/\.js$/),

      new webpack.EnvironmentPlugin({
        NODE_ENV: IS_DEV ? BUILD_MODE.development : BUILD_MODE.production,
        DEBUG: IS_DEV,
      }),

      new WebpackBarPlugin({
        name: 'Steady',
      }),

      // TODO: sometimes the resulting css file is empty but we will
      // still insert it on the page
      //
      // needs some investigation if this is possible to avoid
      new CrittersPlugin({
        preload: 'js-lazy',
      }),

      // TODO: webmanifest plugin or something...

      IS_PROD &&
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          allChunks: true,
        }),
    ].filter(Boolean),
  };
};

createWebpackConfig.BUILD_MODE = BUILD_MODE;

createWebpackConfig.BUILD_TARGET = BUILD_TARGET;

module.exports = createWebpackConfig;