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
  // Day12：GitHub Pages 部署在 https://<user>.github.io/<repo>/ 子路径下，
  // 资源必须走相对仓库名的 base，否则 JS/CSS 会 404。
  // 在 GitHub Actions 中自动使用仓库子路径，本地开发/其他平台仍用根路径。
  base: process.env.GITHUB_ACTIONS ? '/smart-city-dashboard/' : '/',
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
    // Day14：分包规则从「三档粗分」收敛为「按更新频率分档」。
    // 判据只有一条：体积 × 变更频率。
    //  - 体积大且几乎不变（zrender / echarts）→ 单独成块，长期缓存不吃 hash 变更；
    //  - 框架运行时（vue）与周边库（vue-router / pinia）升级节奏不同 → 各成一块；
    //  - 请求基础设施（axios）几乎不随业务改 → 单独一块；
    //  - 其余第三方 → vendor 兜底。
    // 这样任意一次业务提交只会击穿业务 chunk，不会把整个 vendor 的 hash 一起刷新。
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // zrender 是 echarts 的渲染内核，体积大且很少随业务变动
          if (id.includes('zrender')) return 'echarts-zrender'
          if (id.includes('echarts')) return 'echarts'
          // vue-router / pinia 的字符串里也含 vue，必须排在 vue 判断之前
          if (id.includes('vue-router') || id.includes('pinia')) return 'vue-libs'
          if (id.includes('@vue/') || id.includes('/vue/')) return 'vue'
          if (id.includes('axios')) return 'http'
          return 'vendor'
        }
      }
    },
    // 分档后单包已压到 500KB 以内，阈值同步收紧，超出即告警
    chunkSizeWarningLimit: 500,
    // Day13：小资源直接内联，减少首屏请求数（<4KB 的图标/小图不再单独发请求）
    assetsInlineLimit: 4096,
    // Day13：精确控制预加载提示 —— 只对 js 依赖做 modulepreload，
    //        避免把 css 等也塞进 <link rel="modulepreload"> 白白膨胀首屏 head
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => deps.filter((d) => /\.js$/.test(d))
    },
    // Day14：构建结束直接输出 gzip 体积，配合 npm run analyze 做体积回归
    reportCompressedSize: true,
    // Day12：产出源码映射，便于线上排查（仅在需要时开启可改为 false）
    sourcemap: false
  }
})
