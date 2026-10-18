import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Day15：单元测试配置。
 *
 * 只测「纯函数」层（utils/），不引入 jsdom ——
 * 图表渲染和组件交互仍靠人工 + 线上验证，
 * 这里优先把「校验降级」「微调」这两条静默失效风险最高的链路钉死。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts']
  }
})
