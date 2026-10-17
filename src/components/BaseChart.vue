<script setup lang="ts">
import { ref, toRef, type Ref } from 'vue'
import { useEcharts, type ChartOption } from '@/hooks/useEcharts'
import { useInView } from '@/hooks/useInView'
import ChartSkeleton from '@/components/ChartSkeleton.vue'

interface Props {
  option: ChartOption
  height?: string
  /** Day13：懒渲染等待期间是否显示骨架屏占位（默认开启） */
  skeleton?: boolean
}
const props = withDefaults(defineProps<Props>(), { height: '100%', skeleton: true })

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
  <!--
    Day13：占位与 ECharts 容器是「兄弟节点 + 绝对定位覆盖」关系，
    这样骨架屏卸载时不会与 echarts.init 追加的 canvas 抢同一个父容器，
    避免出现「先塌陷再撑开」或 canvas 与占位相互挤压的抖动。
  -->
  <div class="chart-host" :style="{ height }">
    <div ref="el" class="base-chart" />
    <ChartSkeleton v-if="skeleton && !inView" class="chart-skeleton" />
  </div>
</template>

<style scoped>
.chart-host {
  position: relative;
  width: 100%;
}
.base-chart {
  width: 100%;
  height: 100%;
}
.chart-skeleton {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
