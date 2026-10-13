import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    // Day5：图表图库，集中展示配置驱动通用图表组件支持的 6+ 类型
    path: '/gallery',
    name: 'chart-gallery',
    component: () => import('@/views/ChartGalleryView.vue')
  },
  {
    path: '/ai',
    name: 'ai-chat',
    component: () => import('@/views/AiChatView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
