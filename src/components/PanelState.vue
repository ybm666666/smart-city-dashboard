<script setup lang="ts">
/**
 * Day7：数据状态占位组件
 *
 * 统一处理「加载中 / 加载失败（可重试）/ 空数据」三种非正常态，
 * 让各视图只关注「有数据时怎么渲染」，避免在业务组件里重复写三态逻辑。
 * 有数据时通过默认插槽渲染真实内容。
 */
interface Props {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
}
withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  empty: false,
  emptyText: '暂无数据'
})

defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <!-- 加载态 -->
  <div v-if="loading" class="state">
    <span class="spinner" />
    <p>数据加载中…</p>
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
  color: #7eb8d8;
  font-size: 14px;
}
.state.error .msg {
  color: #ff8a8a;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 212, 255, 0.25);
  border-top-color: #00d4ff;
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
  color: #0a1929;
  background: #00d4ff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.retry:hover {
  opacity: 0.85;
}
</style>
