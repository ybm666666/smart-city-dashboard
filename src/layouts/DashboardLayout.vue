<script setup lang="ts">
import { computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useScale } from '@/hooks/useScale'
import { useResponsive } from '@/hooks/useResponsive'

// Day2：1920×1080 设计稿整体等比缩放 + 居中（大屏场景）
const { scale } = useScale(1920, 1080)
// Day6：真实屏幕适配 —— 小屏（移动 / 平板）切换为流式布局（非等比）
const { device } = useResponsive()

const flowMode = computed(() => device.value === 'mobile' || device.value === 'tablet')

// 大屏模式：固定 1920×1080 后整体缩放；流式模式：随视口自适应，不做整体拉伸
const screenStyle = computed(() =>
  flowMode.value
    ? {}
    : { transform: `scale(${scale.value})`, width: '1920px', height: '1080px' }
)
</script>

<template>
  <div class="scale-wrapper" :class="{ flow: flowMode }">
    <div class="screen" :class="{ flow: flowMode }" :style="screenStyle">
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
/* Day6：流式模式允许纵向滚动，避免小屏内容被裁切 */
.scale-wrapper.flow {
  align-items: flex-start;
  justify-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
}
.screen {
  transform-origin: center center;
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  display: flex;
  flex-direction: column;
}
.screen.flow {
  width: 100%;
  min-height: 100vh;
  height: auto;
}
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  gap: 20px;
  min-height: 0;
}
/* Day6：流式模式下三栏改为纵向堆叠（CSS Grid / Flex 流式布局） */
.screen.flow .main-content {
  flex-direction: column;
}
</style>
