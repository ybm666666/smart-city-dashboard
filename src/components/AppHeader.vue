<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { prefetchView, type ViewName } from '@/router'

// 顶栏：标题 + 导航 + 实时时间（Day3 从 DashboardLayout 抽出）
// Day5：新增「图表图库」入口；Day6：新增「地图联动」入口；Day8：新增「AI 出图」入口
// Day13：导航项 hover / focus 时预取目标路由 chunk，点进去时模块已在内存中
// Day15：窄屏下导航与标题改为纵向堆叠，修复绝对定位互相压盖的问题
const now = ref(new Date().toLocaleString('zh-CN'))
let timer: number | undefined

const NAV: { to: string; label: string; view: ViewName }[] = [
  { to: '/', label: '数据大屏', view: 'dashboard' },
  { to: '/gallery', label: '图表图库', view: 'chart-gallery' },
  { to: '/map', label: '地图联动', view: 'map-view' },
  { to: '/ai', label: 'AI 出图', view: 'ai-chat' }
]

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date().toLocaleString('zh-CN')
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <header class="header">
    <nav class="nav">
      <router-link
        v-for="item in NAV"
        :key="item.to"
        :to="item.to"
        @mouseenter="prefetchView(item.view)"
        @focus="prefetchView(item.view)"
        >{{ item.label }}</router-link
      >
    </nav>
    <h1>AI 数据可视化大屏</h1>
    <div class="datetime">{{ now }}</div>
  </header>
</template>

<style scoped>
.header {
  text-align: center;
  padding: 20px 0;
  position: relative;
  border-bottom: 1px solid var(--color-blue-a30);
}
h1 {
  font-size: 28px;
  color: var(--color-accent);
  letter-spacing: 4px;
  text-shadow: 0 0 10px var(--color-accent-a50);
}
.datetime {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--color-text-secondary);
}
.nav {
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 18px;
}
.nav a {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}
.nav a:hover {
  color: var(--color-accent-soft);
}
.nav a.router-link-active {
  color: var(--color-accent);
  text-shadow: 0 0 8px var(--color-accent-a50);
}

/* 窄屏（<= 960px）：导航 / 标题 / 时间不再绝对定位叠在一起，而是纵向堆叠。
   960px 这个阈值来自实测：居中标题（28px × 9 字 + 字距）左右各占约 145px，
   左侧导航至 308px 处，两者在视口 < 906px 时开始重叠，留出余量取 960px。 */
@media (max-width: 960px) {
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
  }
  .nav {
    position: static;
    transform: none;
    order: -1;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
  }
  .nav a {
    font-size: 13px;
  }
  h1 {
    font-size: 20px;
    letter-spacing: 2px;
  }
  .datetime {
    position: static;
    transform: none;
    font-size: 12px;
  }
}
</style>
