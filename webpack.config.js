const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ImageminPlugin = require('imagemin-webpack')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const filename = ext => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`

const optimization = () => {
    const configObj = {
        splitChunks: {
            chunks: 'all',

        }
    }

    if(isProd){
        configObj.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }
    return configObj
}

const plugins = () => {
    const basePlugins = [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html',
            minify: {
                collapseWhitespace: isProd
            }
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `css/${filename('css')}`
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/assets'),
                    to: path.resolve(__dirname, 'app/assets')
                }
            ]
        })
    ]

    if(isProd){
        basePlugins.push(
            new ImageminPlugin({
                bail: false, // Ignore errors on corrupted images
                cache: true,
                imageminOptions: {
                  // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them
           
                  // Lossless optimization with custom option
                  // Feel free to experiment with options for better result for you
                  plugins: [
                    ["gifsicle", { interlaced: true }],
                    ["jpegtran", { progressive: true }],
                    ["optipng", { optimizationLevel: 5 }],
                    [
                      "svgo",
                      {
                        plugins: [
                          {
                            removeViewBox: false
                          }
                        ]
                      }
                    ]
                  ]
                }
              })
        )
    }

    return basePlugins
}

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: './js/main.js',
    output: {
        filename: `js/${filename('js')}`,
        path: path.resolve(__dirname, 'app'),
        publicPath: ''
    },
    optimization: optimization(),
    plugins: plugins(),
    devServer: {
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, 'app'),
        open: true,
        hot: true,
        port: 3000,
        compress: true
    },
    devtool: isProd ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.html$/i,
                loader: 'html-loader'

            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    }, 
                    'css-loader']
            },
            {
                test: /\.(scss)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader', 
                        options: {
                            postcssOptions: {
                                plugins: function () {
                                    return [
                                      require('precss'),
                                      require('autoprefixer')
                                    ];
                                  }
                            }
                        }  
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.(?:|gif|png|jpg|jpeg|svg)$/,
                use: [{
                    loader: 'file-loader',
                    options:{
                        name: `./img/${filename('[ext]')}`
                    }
                }]
            },
            {
                test: /\.(?:|woff2|ttf)$/,
                use: [{
                    loader: 'file-loader',
                    options:{
                        name: `./fonts/${filename('[ext]')}`
                    }
                }]
            },
            {
                test: /\.js$/,
                exclude: '/node_modules/',
                use: ['babel-loader']
            },
        ]
    }
}