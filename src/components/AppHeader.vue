<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

// 顶栏：标题 + 导航 + 实时时间（Day3 从 DashboardLayout 抽出）
// Day5：新增「图表图库」入口；Day6：新增「地图联动」入口；Day8：新增「AI 出图」入口
const now = ref(new Date().toLocaleString('zh-CN'))
let timer: number | undefined

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
      <router-link to="/">数据大屏</router-link>
      <router-link to="/gallery">图表图库</router-link>
      <router-link to="/map">地图联动</router-link>
      <router-link to="/ai">AI 出图</router-link>
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
  border-bottom: 1px solid rgba(0, 150, 255, 0.3);
}
h1 {
  font-size: 28px;
  color: #00d4ff;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}
.datetime {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #7eb8d8;
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
  color: #7eb8d8;
  text-decoration: none;
}
.nav a.router-link-active {
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}
</style>
