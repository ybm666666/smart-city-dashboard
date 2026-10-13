import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  RadarChart,
  FunnelChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  RadarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Day4：ECharts 按需引入 —— 只注册用到的图表与组件，显著减小打包体积
// （替代原来 `import * as echarts from 'echarts'` 的全量引入）
// Day5：随「配置驱动通用图表组件（6+ 类型）」补充仪表盘 / 雷达 / 漏斗图与雷达坐标系
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  RadarChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  RadarComponent,
  CanvasRenderer
])

// 宽松的 option 类型：避免 ECharts 深层联合类型导致的编译报错
export type ChartOption = Record<string, any>

type EChartsInstance = ReturnType<typeof echarts.init>

/**
 * 通用 ECharts 组合式函数（对应简历：封装图表、处理实例销毁防止内存泄漏）
 * - 自动 init / resize / dispose
 * - 通过 ResizeObserver 监听容器尺寸变化
 */
export function useEcharts(elRef: Ref<HTMLElement | undefined>, option: Ref<ChartOption>) {
  const chart = shallowRef<EChartsInstance>()
  let observer: ResizeObserver | null = null

  function init() {
    if (!elRef.value) return
    chart.value = echarts.init(elRef.value)
    chart.value.setOption(option.value)
  }
  function resize() {
    chart.value?.resize()
  }

  watch(
    option,
    (val) => {
      // notMerge=false 时按需增量合并，避免整图重绘
      chart.value?.setOption(val, { notMerge: false })
    },
    { deep: true }
  )

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
