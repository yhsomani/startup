const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

/**
 * Webpack Performance Optimization Configuration
 * Optimizes bundle sizes and loading performance
 */
class WebpackOptimizer {
    constructor(options = {}) {
        this.options = {
            mode: options.mode || 'production',
            entry: options.entry || './src/index.js',
            outputDir: options.outputDir || 'dist',
            analyze: options.analyze || false,
            compress: options.compress !== false,
            ...options
        };
    }

    getConfig() {
        return {
            mode: this.options.mode,
            entry: this.options.entry,

            output: {
                path: path.resolve(process.cwd(), this.options.outputDir),
                filename: '[name].[contenthash].js',
                chunkFilename: '[name].[contenthash].chunk.js',
                clean: true
            },

            optimization: {
                // Split chunks for better caching
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        // Vendor libraries
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true
                        },

                        // React and related libraries
                        react: {
                            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
                            name: 'react-vendor',
                            chunks: 'all',
                            priority: 20
                        },

                        // UI libraries
                        ui: {
                            test: /[\\/]node_modules[\\/](@mui|@emotion|styled-components)[\\/]/,
                            name: 'ui-vendor',
                            chunks: 'all',
                            priority: 15
                        },

                        // Common utilities
                        common: {
                            minChunks: 2,
                            chunks: 'all',
                            priority: 5,
                            reuseExistingChunk: true
                        }
                    }
                },

                // Runtime chunk for better caching
                runtimeChunk: {
                    name: 'runtime'
                },

                // Minification
                minimize: this.options.mode === 'production',
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
                            compress: {
                                drop_console: this.options.mode === 'production',
                                drop_debugger: true,
                                pure_funcs: ['console.info', 'console.debug']
                            },
                            mangle: true,
                            keep_fnames: false
                        },
                        extractComments: false
                    }),
                    new CssMinimizerPlugin()
                ]
            },

            module: {
                rules: [
                    // JavaScript/TypeScript
                    {
                        test: /\.(js|jsx|ts|tsx)$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', {
                                        targets: '> 0.25%, not dead',
                                        useBuiltIns: 'usage',
                                        corejs: 3
                                    }],
                                    ['@babel/preset-react', { runtime: 'automatic' }],
                                    '@babel/preset-typescript'
                                ],
                                plugins: [
                                    '@babel/plugin-transform-runtime',
                                    '@babel/plugin-syntax-dynamic-import'
                                ]
                            }
                        }
                    },

                    // CSS
                    {
                        test: /\.css$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            'css-loader',
                            'postcss-loader'
                        ]
                    },

                    // Sass/SCSS
                    {
                        test: /\.(scss|sass)$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            'css-loader',
                            'postcss-loader',
                            'sass-loader'
                        ]
                    },

                    // Images
                    {
                        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
                        type: 'asset',
                        parser: {
                            dataUrlCondition: {
                                maxSize: 8 * 1024 // 8kb
                            }
                        },
                        generator: {
                            filename: 'images/[name].[hash][ext]'
                        }
                    },

                    // Fonts
                    {
                        test: /\.(woff|woff2|eot|ttf|otf)$/,
                        type: 'asset/resource',
                        generator: {
                            filename: 'fonts/[name].[hash][ext]'
                        }
                    }
                ]
            },

            plugins: [
                // Extract CSS
                new MiniCssExtractPlugin({
                    filename: '[name].[contenthash].css',
                    chunkFilename: '[name].[contenthash].chunk.css'
                }),

                // Define environment variables
                new webpack.DefinePlugin({
                    'process.env.NODE_ENV': JSON.stringify(this.options.mode),
                    'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
                }),

                // Provide fallbacks for Node.js modules
                new webpack.ProvidePlugin({
                    Buffer: ['buffer', 'Buffer'],
                    process: 'process/browser'
                })
            ],

            resolve: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                alias: {
                    '@': path.resolve(__dirname, 'src'),
                    '@components': path.resolve(__dirname, 'src/components'),
                    '@utils': path.resolve(__dirname, 'src/utils'),
                    '@assets': path.resolve(__dirname, 'src/assets')
                },
                fallback: {
                    'path': require.resolve('path-browserify'),
                    'crypto': require.resolve('crypto-browserify'),
                    'stream': require.resolve('stream-browserify'),
                    'buffer': require.resolve('buffer'),
                    'process': require.resolve('process/browser')
                }
            },

            performance: {
                maxAssetSize: 244000, // 244 KB
                maxEntrypointSize: 244000,
                hints: this.options.mode === 'production' ? 'warning' : false
            }
        };

        // Add compression plugin for production
        if (this.options.compress && this.options.mode === 'production') {
            config.plugins.push(
                new CompressionPlugin({
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 8192,
                    minRatio: 0.8
                }),
                new CompressionPlugin({
                    algorithm: 'brotliCompress',
                    test: /\.(js|css|html|svg)$/,
                    compressionOptions: {
                        params: {
                            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                        },
                    },
                    threshold: 8192,
                    minRatio: 0.8,
                })
            );
        }

        // Add bundle analyzer if requested
        if (this.options.analyze) {
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: false,
                    reportFilename: 'bundle-report.html'
                })
            );
        }

        return config;
    }

    // Code splitting utilities
    static getCodeSplittingConfig() {
        return {
            // Dynamic imports for route-based splitting
            routes: {
                home: () => import(/* webpackChunkName: "home" */ '../pages/Home'),
                jobs: () => import(/* webpackChunkName: "jobs" */ '../pages/Jobs'),
                profile: () => import(/* webpackChunkName: "profile" */ '../pages/Profile'),
                company: () => import(/* webpackChunkName: "company" */ '../pages/Company')
            },

            // Component-based lazy loading
            components: {
                heavyComponent: () => import(/* webpackChunkName: "heavy-component" */ '../components/HeavyComponent'),
                chartComponent: () => import(/* webpackChunkName: "chart-component" */ '../components/ChartComponent')
            }
        };
    }

    // Tree shaking optimization tips
    static getTreeShakingTips() {
        return [
            'Use ES6 import/export syntax instead of require',
            'Import specific functions: import { debounce } from "lodash";',
            'Avoid importing entire libraries when only using parts',
            'Use sideEffects: false in package.json for libraries',
            'Configure babel to transform modules correctly',
            'Remove unused exports from your code'
        ];
    }

    // Performance optimization recommendations
    static getOptimizationRecommendations() {
        return {
            immediate: [
                'Enable gzip/brotli compression',
                'Implement code splitting with dynamic imports',
                'Remove unused dependencies',
                'Use production builds',
                'Optimize images and assets'
            ],
            mediumTerm: [
                'Implement service workers for caching',
                'Use web workers for heavy computations',
                'Optimize CSS and eliminate unused styles',
                'Implement progressive loading',
                'Use font-display: swap for web fonts'
            ],
            longTerm: [
                'Migrate to lighter alternatives (e.g., Preact instead of React)',
                'Implement partial hydration',
                'Use compile-time optimizations',
                'Consider micro-frontends architecture',
                'Implement predictive prefetching'
            ]
        };
    }
}

module.exports = WebpackOptimizer;