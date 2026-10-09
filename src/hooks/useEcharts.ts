import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'
import * as echarts from 'echarts'

// 宽松的 option 类型：避免 echarts 全量包里 EChartsOption 深层联合类型导致的编译报错
export type ChartOption = Record<string, any>

/**
 * 通用 ECharts 组合式函数（对应简历：封装图表、处理实例销毁防止内存泄漏）
 * - 自动 init / resize / dispose
 * - 通过 ResizeObserver 监听容器尺寸变化
 */
export function useEcharts(elRef: Ref<HTMLElement | undefined>, option: Ref<ChartOption>) {
  const chart = shallowRef<echarts.ECharts>()
  let observer: ResizeObserver | null = null

  function init() {
    if (!elRef.value) return
    chart.value = echarts.init(elRef.value)
    chart.value.setOption(option.value)
  }
  function resize() { chart.value?.resize() }

  watch(option, (val) => { chart.value?.setOption(val, { notMerge: false }) }, { deep: true })

  onMounted(() => {
    init()
    if (elRef.value) {
      observer = new ResizeObserver(() => resize())
      observer.observe(elRef.value)
    }
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    // 关键：销毁实例 + 解绑监听，防止内存泄漏
    window.removeEventListener('resize', resize)
    observer?.disconnect()
    observer = null
    chart.value?.dispose()
    chart.value = undefined
  })

  return { chart, resize }
}

export { echarts }
