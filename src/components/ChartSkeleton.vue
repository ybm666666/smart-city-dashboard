<script setup lang="ts">
/**
 * Day13：骨架屏 / 图表占位组件
 *
 * 用途有两处：
 * 1. 图表懒渲染期间（useInView 尚未触发）先渲染占位，避免容器「先塌陷后撑开」的布局抖动；
 * 2. 数据加载中（PanelState 的 loading）用骨架屏替代转圈，改善弱网首屏体感。
 *
 * 纯 CSS 实现，不引入任何依赖，也不额外请求资源。
 */
interface Props {
  /** 变体：图表 / 整屏面板 / 地图 / 指标卡 */
  variant?: 'chart' | 'panel' | 'map' | 'stat'
  /** 柱状占位条数量（variant=chart 时生效） */
  bars?: number
}

withDefaults(defineProps<Props>(), { variant: 'chart', bars: 5 })
</script>

<template>
  <div class="skeleton" :class="variant" aria-hidden="true">
    <!-- 图表 / 面板：标题条 + 柱条 -->
    <template v-if="variant === 'chart' || variant === 'panel'">
      <div v-if="variant === 'panel'" class="sk-title" />
      <div class="sk-bars">
        <span
          v-for="i in bars"
          :key="i"
          class="sk-bar"
          :style="{ height: `${28 + ((i * 37) % 66)}%` , animationDelay: `${i * 90}ms` }"
        />
      </div>
    </template>

    <!-- 地图：区县轮廓感的圆形占位 -->
    <template v-else-if="variant === 'map'">
      <div class="sk-map">
        <span class="sk-ring" />
        <span class="sk-ring inner" />
      </div>
    </template>

    <!-- 指标卡：数字行 + 说明行 -->
    <template v-else>
      <div class="sk-line w60" />
      <div class="sk-line w35" />
    </template>
  </div>
</template>

<style scoped>
.skeleton {
  width: 100%;
  height: 100%;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

/* 统一微光动画：比 spinner 更贴近最终布局，视觉上不跳动 */
.sk-title,
.sk-bar,
.sk-ring,
.sk-line {
  position: relative;
  overflow: hidden;
  background: var(--color-blue-a12);
  border-radius: 4px;
}
.sk-title::after,
.sk-bar::after,
.sk-ring::after,
.sk-line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-accent-a22),
    transparent
  );
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

.sk-title {
  height: 14px;
  width: 40%;
  flex: none;
  animation-delay: 0ms;
}

.sk-bars {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 4px 0;
}
.sk-bar {
  flex: 1;
  border-radius: 4px 4px 2px 2px;
}

/* 地图占位：同心圆示意 */
.sk-map {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sk-ring {
  width: 62%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  max-height: 100%;
}
.sk-ring.inner {
  position: absolute;
  width: 34%;
}

.sk-line {
  height: 14px;
  border-radius: 4px;
  animation-delay: 0ms;
}
.sk-line.w60 {
  width: 60%;
}
.sk-line.w35 {
  width: 35%;
}

@media (prefers-reduced-motion: reduce) {
  .sk-title::after,
  .sk-bar::after,
  .sk-ring::after,
  .sk-line::after {
    animation: none;
  }
}
</style>
