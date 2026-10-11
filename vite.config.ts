import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 用 @ 代表 src 目录，import 更清爽
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // 开发环境：/api 开头的请求转发到后端/Mock 服务，避免跨域
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Day4：vendor 分包，把 echarts / vue 拆成独立 chunk，便于缓存、避免超大单包
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
            if (id.includes('vue') || id.includes('pinia')) return 'vue'
            return 'vendor'
          }
        }
      }
    },
    // 按需引入后单包体积下降，阈值设 600KB，超出才告警
    chunkSizeWarningLimit: 600
  }
})
