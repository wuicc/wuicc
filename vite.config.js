import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
import fs from 'fs'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const domesticDomain = env.VITE_DOMESTIC_DOMAIN
  const internationalDomain = env.VITE_INTERNATIONAL_DOMAIN

  // 获取语言文件的最后更新时间
  const getLanguageFilesLastModified = () => {
    const localesDir = path.resolve(process.cwd(), 'src/locales')
    const languageFiles = ['en.json', 'zh-Hans.json', 'zh-Hant.json', 'ja.json', 'ko.json', 'fr.json']
    const lastModified = {}
    
    try {
      languageFiles.forEach(file => {
        const filePath = path.join(localesDir, file)
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          lastModified[file.replace('.json', '')] = stats.mtimeMs
        }
      })
    } catch (error) {
      console.error('Failed to get language files last modified time:', error)
    }
    
    return lastModified
  }

  // 语言文件最后更新时间
  const languageLastModified = getLanguageFilesLastModified()

  return {
    assetsInclude: ['**/*.ps1'],
    base: '/',
    build: {
      // sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // 将原神活动组件的CSS文件单独打包到指定目录
            if (assetInfo.name && assetInfo.name.includes('GenshinActivities')) {
              return 'assets/genshin-act/[name]-[hash][extname]';
            }
            // 将locales目录下的所有文件单独打包到指定目录
            if (assetInfo.name && assetInfo.name.includes('.json') &&
              (assetInfo.source.includes('src/locales') || assetInfo.source.includes('\\locales\\'))) {
              return 'assets/locales/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          manualChunks: (id) => {
            // 手动分割原神活动组件
            if (id.includes('GenshinActivities') && id.endsWith('.vue')) {
              const fileName = id.split('/').pop().replace('.vue', '');
              return `genshin-act/${fileName}`;
            }
            // 手动分割语言文件到指定目录
            if (id.includes('src/locales/games/')) {
              const parts = id.split('/');
              const gameId = parts[parts.length - 2]; // 获取游戏ID
              const fileName = parts[parts.length - 1].replace('.json', '');
              return `locales/games/${gameId}/${fileName}`;
            }
            // 手动分割根目录语言文件
            if (id.includes('src/locales/') && id.endsWith('.json')) {
              const fileName = id.split('/').pop().replace('.json', '');
              return `locales/${fileName}`;
            }
          }
        }
      }
    },
    plugins: [
      vue(),
      // ps1ImportPlugin(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: env.VITE_APP_TITLE || '雾忆刻 - WUICC',
            description: env.VITE_APP_DESCRIPTION || '雾忆刻 - 一站式游戏工具 - Efficiently manage your timeline data, cross-platform synchronization, multi-language support',
            keywords: env.VITE_APP_KEYWORDS || 'timeline,时间线,收集器,管理工具,Web应用,wuicc',
            ogTitle: env.VITE_OG_TITLE || 'WUICC',
            ogImage: env.VITE_OG_IMAGE || 'https://wuicc.net/logo.png',
            canonicalUrl: env.VITE_CANONICAL_URL || 'https://wuicc.net',
            analyticsUrl: env.VITE_ANALYTICS_URL || '',
            analyticsId: env.VITE_ANALYTICS_ID || '',
            languageLastModified: JSON.stringify(languageLastModified)
          }
        }
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      allowedHosts: ['.' + domesticDomain, '.' + internationalDomain],
      proxy: {
        '^/api(/|$)': {
          target: 'http://localhost:8182',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                code: 500,
                message: 'Unable to connect to backend server',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
              }))
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setTimeout(30000, () => {
                res.writeHead(504, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  code: 504,
                  message: 'Backend server response timeout',
                  error_code: 500001
                }))
              })
            })
          }
        },
        // 新增公告图片的代理
        '^/static/event_images/': {
          target: 'http://localhost:8182',
          changeOrigin: true
        }
      },
    },
  }
})