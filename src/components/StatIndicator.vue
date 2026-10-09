<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  label: string
  value: number
  unit?: string
  decimals?: number
  duration?: number
}
const props = withDefaults(defineProps<Props>(), {
  unit: '',
  decimals: 0,
  duration: 1500
})

// 数字滚动动画（从 0 缓动到目标值）
const display = ref(0)

onMounted(() => {
  const start = performance.now()
  function tick(now: number) {
    const p = Math.min((now - start) / props.duration, 1)
    const easeOut = 1 - Math.pow(1 - p, 3)
    display.value = props.value * easeOut
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
</script>

<template>
  <div class="indicator">
    <span class="label">{{ label }}</span>
    <span class="value">{{ display.toFixed(decimals) }}</span>
    <span v-if="unit" class="unit">{{ unit }}</span>
  </div>
</template>

<style scoped>
.indicator {
  text-align: center;
}
.label {
  display: block;
  font-size: 12px;
  color: #7eb8d8;
  margin-bottom: 5px;
}
.value {
  font-size: 28px;
  font-weight: bold;
  color: #00ff88;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
  font-family: 'Courier New', monospace;
}
.unit {
  font-size: 14px;
  color: #7eb8d8;
  margin-left: 4px;
}
</style>
