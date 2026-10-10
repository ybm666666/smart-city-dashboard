<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { useScale } from '@/hooks/useScale'

// 1920×1080 设计稿整体等比缩放 + 居中
const { scale } = useScale(1920, 1080)
</script>

<template>
  <div class="scale-wrapper">
    <div
      class="screen"
      :style="{ transform: `scale(${scale})`, width: '1920px', height: '1080px' }"
    >
      <AppHeader />
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
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  gap: 20px;
  min-height: 0;
}
</style>
