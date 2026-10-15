import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  RadarChart,
  FunnelChart,
  MapChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  RadarComponent,
  GeoComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Day4：ECharts 按需引入 —— 只注册用到的图表与组件，显著减小打包体积
// （替代原来 `import * as echarts from 'echarts'` 的全量引入）
// Day5：随「配置驱动通用图表组件（6+ 类型）」补充仪表盘 / 雷达 / 漏斗图与雷达坐标系
// Day6：补充地图能力 —— MapChart + GeoComponent + VisualMapComponent（热力）
// Day7：DatasetComponent 用于 dataset 源数据 + 增量更新
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  RadarChart,
  FunnelChart,
  MapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  RadarComponent,
  GeoComponent,
  VisualMapComponent,
  CanvasRenderer
])

// 宽松的 option 类型：避免 ECharts 深层联合类型导致的编译报错
export type ChartOption = Record<string, any>

type EChartsInstance = ReturnType<typeof echarts.init>

/** 事件绑定回调：拿到实例后由调用方注册交互事件（如 click） */
export type ChartEventBinder = (chart: EChartsInstance) => void

/**
 * 通用 ECharts 组合式函数（对应简历：封装图表、处理实例销毁防止内存泄漏）
 * - 自动 init / resize / dispose
 * - 通过 ResizeObserver 监听容器尺寸变化
 * - Day6：新增 onEvents 回调，便于绑定地图 / 图表点击等交互
 * - Day7：
 *   1. 新增 `enabled` 开关，配合 useInView 做「懒渲染」（未进入视口不 init）；
 *   2. option 更新使用 lazyUpdate，减少 dataset 增量 / 高频更新时的重绘次数。
 */
export function useEcharts(
  elRef: Ref<HTMLElement | undefined>,
  option: Ref<ChartOption>,
  onEvents?: ChartEventBinder,
  enabled?: Ref<boolean>
) {
  const chart = shallowRef<EChartsInstance>()
  let observer: ResizeObserver | null = null

  const canInit = () => !enabled || enabled.value

  function init() {
    if (!elRef.value || chart.value || !canInit()) return
    chart.value = echarts.init(elRef.value)
    chart.value.setOption(option.value)
    // 实例就绪后绑定交互事件（Day6）
    if (chart.value) onEvents?.(chart.value)
  }
  function resize() {
    chart.value?.resize()
  }
  function observeResize() {
    if (!elRef.value || observer) return
    observer = new ResizeObserver(() => resize())
    observer.observe(elRef.value)
  }

  watch(
    option,
    (val) => {
      // notMerge=false 时按需增量合并；lazyUpdate 合并到下一帧统一重绘
      chart.value?.setOption(val, { notMerge: false, lazyUpdate: true })
    },
    { deep: true }
  )

  // 懒渲染：进入视口（enabled 变 true）后再初始化实例
  if (enabled) {
    watch(enabled, (val) => {
      if (val) {
        init()
        observeResize()
      }
    })
  }

  onMounted(() => {
    init()
    observeResize()
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
