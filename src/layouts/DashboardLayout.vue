<script setup lang="ts">
import { ref } from 'vue'
import { useScale } from '@/hooks/useScale'

// 1920×1080 设计稿整体等比缩放 + 居中
const { scale } = useScale(1920, 1080)
const now = ref(new Date().toLocaleString('zh-CN'))
setInterval(() => (now.value = new Date().toLocaleString('zh-CN')), 1000)
</script>

<template>
  <div class="scale-wrapper">
    <div
      class="screen"
      :style="{ transform: `scale(${scale})`, width: '1920px', height: '1080px' }"
    >
      <header class="header">
        <h1>AI 数据可视化大屏</h1>
        <div class="datetime">{{ now }}</div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.scale-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a1929;
}
.screen {
  transform-origin: center center;
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  display: flex;
  flex-direction: column;
}
.header {
  text-align: center;
  padding: 20px 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 150, 255, 0.3);
}
.header h1 {
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
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  gap: 20px;
  min-height: 0;
}
</style>
