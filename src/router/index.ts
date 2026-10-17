import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Day13：路由级懒加载 + 预取
 *
 * 1. 每个视图都通过动态 import 按路由拆分（Vite 会为每个 import 生成独立 chunk），
 *    首屏只下载当前路由需要的代码；
 * 2. 把「加载器函数」单独抽成 viewLoaders，路由配置与预取共用同一份引用，
 *    Rollup 不会因为写了两次 import 而把 chunk 合并或重复打包；
 * 3. prefetchView 在链接 hover / focus 时提前拉取目标 chunk（只触发一次），
 *    用户点下去时模块已在内存里，切换几乎无等待。
 */
const viewLoaders = {
  dashboard: () => import('@/views/DashboardView.vue'),
  'chart-gallery': () => import('@/views/ChartGalleryView.vue'),
  'map-view': () => import('@/views/MapView.vue'),
  'ai-chat': () => import('@/views/AiChatView.vue')
}

export type ViewName = keyof typeof viewLoaders

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: viewLoaders.dashboard
  },
  {
    // Day5：图表图库，集中展示配置驱动通用图表组件支持的 6+ 类型
    path: '/gallery',
    name: 'chart-gallery',
    component: viewLoaders['chart-gallery']
  },
  {
    // Day6：地图联动演示页（GeoJSON 热力地图 + 区县详情联动）
    path: '/map',
    name: 'map-view',
    component: viewLoaders['map-view']
  },
  {
    path: '/ai',
    name: 'ai-chat',
    component: viewLoaders['ai-chat']
  }
]

const prefetched = new Set<ViewName>()

/**
 * Day13：预取某个视图的代码 chunk。
 * 幂等：同一视图只真正触发一次 import，重复 hover 不会产生额外请求。
 */
export function prefetchView(name: ViewName): void {
  if (prefetched.has(name)) return
  prefetched.add(name)
  void viewLoaders[name]().catch(() => {
    // 预取失败不打扰用户：允许下次 hover 重试
    prefetched.delete(name)
  })
}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // Day13：滚动行为固定回顶部，避免切路由后停在上一个页面的滚动位置
  scrollBehavior: () => ({ top: 0 })
})

export default router
