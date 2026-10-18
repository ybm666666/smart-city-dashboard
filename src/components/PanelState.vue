<script setup lang="ts">
/**
 * Day7：数据状态占位组件
 *
 * 统一处理「加载中 / 加载失败（可重试）/ 空数据」三种非正常态，
 * 让各视图只关注「有数据时怎么渲染」，避免在业务组件里重复写三态逻辑。
 * 有数据时通过默认插槽渲染真实内容。
 *
 * Day13：加载态新增 `skeleton` 开关 —— 打开后不再显示转圈，而是渲染
 * 与图表同构的骨架屏，弱网下首屏布局提前成型，数据回来时只做内容替换，
 * 不会出现「空白屏 → 突然撑开」的跳动。
 */
import ChartSkeleton from '@/components/ChartSkeleton.vue'

interface Props {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
  /** Day13：加载态是否用骨架屏代替 spinner */
  skeleton?: boolean
}
withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  empty: false,
  emptyText: '暂无数据',
  skeleton: false
})

defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <!-- 加载态：骨架屏 or 转圈 -->
  <div v-if="loading" class="state" :class="{ sk: skeleton }">
    <ChartSkeleton v-if="skeleton" variant="panel" :bars="6" />
    <template v-else>
      <span class="spinner" />
      <p>数据加载中…</p>
    </template>
  </div>

  <!-- 错误态（可重试） -->
  <div v-else-if="error" class="state error">
    <p class="msg">加载失败：{{ error }}</p>
    <button class="retry" @click="$emit('retry')">重新加载</button>
  </div>

  <!-- 空态 -->
  <div v-else-if="empty" class="state empty">
    <p class="msg">{{ emptyText }}</p>
    <button class="retry" @click="$emit('retry')">刷新</button>
  </div>

  <!-- 正常：渲染真实内容 -->
  <slot v-else />
</template>

<style scoped>
.state {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
/* Day13：骨架屏态要铺满可用空间，与真实图表区域高度一致 */
.state.sk {
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  min-height: 180px;
  padding: 4px;
  box-sizing: border-box;
}
.state.error .msg {
  color: var(--color-danger);
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-accent-a25);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.retry {
  padding: 5px 16px;
  font-size: 13px;
  color: var(--color-bg-base);
  background: var(--color-accent);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.retry:hover {
  opacity: 0.85;
}
</style>
