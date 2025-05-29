import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    allowedHosts: ["wuicc.net", "wui.kokomi.cn", "wui.cc"],
    proxy: {
      '^/api(/|$)': {
        target: 'http://localhost:8182',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
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
            proxyReq.setTimeout(5000, () => {
              res.writeHead(504, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                code: 504,
                message: 'Backend server response timeout'
              }))
            })
          })
        }
      }
    }
  }
})