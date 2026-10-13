<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from '@/components/BaseChart.vue'
import { buildOption } from '@/config/charts'
import type { ChartConfig } from '@/types'

/**
 * Day5：配置驱动通用图表组件
 *
 * 调用方只需传入一份配置（类型 + 数据），组件内部统一调用 buildOption
 * 生成标准 ECharts option，再交给 BaseChart 渲染。
 * 支持 6+ 类型：line / bar / pie / scatter / gauge / radar / funnel。
 */
interface Props {
  config: ChartConfig
  height?: string
}
const props = withDefaults(defineProps<Props>(), { height: '100%' })

// 配置变化时自动重新生成 option（BaseChart 内部 watch 增量更新）
const option = computed(() => buildOption(props.config.type, props.config))
</script>

<template>
  <BaseChart :option="option" :height="height" />
</template>
