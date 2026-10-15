<script setup lang="ts">
import { ref, toRef, type Ref } from 'vue'
import { useEcharts, type ChartOption } from '@/hooks/useEcharts'
import { useInView } from '@/hooks/useInView'

interface Props {
  option: ChartOption
  height?: string
}
const props = withDefaults(defineProps<Props>(), { height: '100%' })

// Day6：把 ECharts 的点击事件冒泡成组件事件，供地图 / 图表联动使用
const emit = defineEmits<{ (e: 'chart-click', params: Record<string, any>): void }>()

const el = ref<HTMLElement>()
// Day4：用 toRef 直接取 props.option 的响应式引用，去掉原来的强制类型转换
const optionRef: Ref<ChartOption> = toRef(props, 'option')

// Day7：懒渲染 —— 容器进入视口后才初始化 ECharts 实例，减少首屏开销
const { inView } = useInView(el)

useEcharts(
  el,
  optionRef,
  (chart) => {
    chart.on('click', (params: unknown) => {
      emit('chart-click', params as Record<string, any>)
    })
  },
  inView
)
</script>

<template>
  <div ref="el" class="base-chart" :style="{ height }"></div>
</template>

<style scoped>
.base-chart {
  width: 100%;
}
</style>
