import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Day12：GitHub Pages 部署在 https://<user>.github.io/<repo>/ 子路径下，
  // 资源必须走相对仓库名的 base，否则 JS/CSS 会 404。
  // 在 GitHub Actions 中自动使用仓库子路径，本地开发/其他平台仍用根路径。
  base: process.env.GITHUB_ACTIONS ? '/smart-city-dashboard/' : '/',
  resolve: {
    alias: {
      // 用 @ 代表 src 目录，import 更清爽
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,import { fileURLToPath, URL } from 'node:url'
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
    // Day4：vendor 分包，把 echarts / vue 拆成独立 chunk，便于缓存、避免超大单包
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // Day12：echarts 单包实测 640.91 kB 仍超过 600 kB 告警线，
          //        因此把渲染内核 zrender 与应用层 echarts 再拆一层：
          //        两者版本独立、更新频率不同，分开后既能各自缓存，也让单包回落到阈值以内。
          // zrender 是 echarts 的渲染内核，体积大且很少随业务变动
          if (id.includes('zrender')) return 'echarts-zrender'
          if (id.includes('echarts')) return 'echarts'
          if (id.includes('vue') || id.includes('pinia')) return 'vue'
          return 'vendor'
        }
      }
    },
    // 按需引入 + 二次分包后单包体积下降，阈值设 600KB，超出才告警
    chunkSizeWarningLimit: 600,
    // Day13：小资源直接内联，减少首屏请求数（<4KB 的图标/小图不再单独发请求）
    assetsInlineLimit: 4096,
    // Day13：精确控制预加载提示 —— 只对 js 依赖做 modulepreload，
    //        避免把 css 等也塞进 <link rel="modulepreload"> 白白膨胀首屏 head
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => deps.filter((d) => /\.js$/.test(d))
    },
    // Day12：产出源码映射，便于线上排查（仅在需要时开启可改为 false）
    sourcemap: false
  }
})

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
    // Day12：echarts 单包实测 640.91 kB 仍超过 600 kB 告警线，
    //        因此把渲染内核 zrender 与应用层 echarts 再拆一层：
    //        两者版本独立、更新频率不同，分开后既能各自缓存，也让单包回落到阈值以内。
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // zrender 是 echarts 的渲染内核，体积大且很少随业务变动
          if (id.includes('zrender')) return 'echarts-zrender'
          if (id.includes('echarts')) return 'echarts'
          if (id.includes('vue') || id.includes('pinia')) return 'vue'
          return 'vendor'
        }
      }
    },
    // 按需引入 + 二次分包后单包体积下降，阈值设 600KB，超出才告警
    chunkSizeWarningLimit: 600,
    // Day12：产出源码映射，便于线上排查（仅在需要时开启可改为 false）
    sourcemap: false
  }
})
