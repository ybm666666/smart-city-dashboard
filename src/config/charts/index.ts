import type { ChartOption } from '@/hooks/useEcharts'

// 主题色
export const theme = {
  blue: '#00d4ff',
  green: '#00ff88',
  orange: '#ff9500',
  purple: '#a855f7'
}

// 统一调色盘：多系列 / 多分类自动取色
export const palette = [
  theme.blue,
  theme.green,
  theme.orange,
  theme.purple,
  '#ff5c8a',
  '#4dd0e1'
]

// Day5：配置驱动通用图表组件支持的类型清单（6+）
// Day6：新增 map（地图热力，GeoJSON 需先注册）
export const CHART_TYPE_LIST = [
  'line',
  'bar',
  'pie',
  'scatter',
  'gauge',
  'radar',
  'funnel',
  'map'
] as const

const axisLine = { lineStyle: { color: 'rgba(0, 150, 255, 0.3)' } }
const axisLabel = { color: '#7eb8d8' }
const splitLine = { lineStyle: { color: 'rgba(0, 150, 255, 0.1)' } }
const legend = { bottom: 0, textStyle: { color: '#7eb8d8' } }

type NameValue = { name: string; value: number }

// 配置驱动的数据契约：不同类型使用其中不同字段
type ChartData = {
  title?: string
  xAxis?: string[]
  series?: number[] | number[][]
  data?: NameValue[]
  gauge?: { value: number; max?: number; unit?: string }
  indicators?: { name: string; max: number }[]
  radarData?: number[]
  // Day6：地图
  mapName?: string
  mapData?: NameValue[]
  visualMap?: { min: number; max: number }
}

function titleOf(title?: string): ChartOption {
  return title
    ? {
        title: {
          text: title,
          left: 'center',
          top: 4,
          textStyle: { color: '#7eb8d8', fontSize: 13, fontWeight: 'normal' }
        }
      }
    : {}
}

// 有标题时给图表顶部留出空间
function gridTop(hasTitle: boolean) {
  return hasTitle ? '28%' : '15%'
}

// line / bar / scatter 归一化系列：兼容单系列与多系列
function normalizeSeries(type: string, d: ChartData): ChartOption[] {
  const s = d.series
  if (!Array.isArray(s) || s.length === 0) return [{ type, data: [] }]
  const isMulti = Array.isArray(s[0])
  if (isMulti) {
    return (s as number[][]).map((arr) => ({ type, data: arr, smooth: type === 'line' }))
  }
  return [{ type, data: s as number[], smooth: type === 'line' }]
}

/**
 * 配置驱动：输入「类型 + 数据」，输出标准 ECharts option。
 * （对应简历：封装配置驱动通用图表组件）
 *
 * Day5：扩展为覆盖 7 种图表类型（line / bar / pie / scatter / gauge / radar / funnel）；
 * Day6：新增 map（GeoJSON 地图 + visualMap 热力），需配合 useMap 先注册地图；
 * 未知或非法类型统一降级为柱状图兜底，保证「非法配置不崩页」。
 */
export function buildOption(type: string, data: unknown): ChartOption {
  const d = (data || {}) as ChartData
  const base = titleOf(d.title)

  switch (type) {
    // 折线图 / 柱状图
    case 'line':
    case 'bar':
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'axis' },
        legend,
        grid: { left: '12%', right: '5%', top: gridTop(!!d.title), bottom: '15%' },
        xAxis: { type: 'category', data: d.xAxis, axisLine, axisLabel },
        yAxis: { type: 'value', axisLine, axisLabel, splitLine },
        series: normalizeSeries(type, d)
      }

    // 饼图
    case 'pie':
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item' },
        legend,
        series: [
          {
            type: 'pie',
            radius: ['40%', '68%'],
            center: ['50%', '48%'],
            label: { color: '#7eb8d8' },
            data: d.data
          }
        ]
      }

    // 散点图
    case 'scatter':
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item' },
        grid: { left: '12%', right: '5%', top: gridTop(!!d.title), bottom: '15%' },
        xAxis: { type: 'category', data: d.xAxis, axisLine, axisLabel },
        yAxis: { type: 'value', axisLine, axisLabel, splitLine },
        series: [
          { type: 'scatter', symbolSize: 14, data: d.series, itemStyle: { color: theme.blue } }
        ]
      }

    // 仪表盘
    case 'gauge': {
      const g = d.gauge || { value: 0 }
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'gauge',
            min: 0,
            max: g.max ?? 100,
            radius: '85%',
            center: ['50%', '58%'],
            progress: { show: true, width: 12, itemStyle: { color: theme.blue } },
            axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(0, 150, 255, 0.15)']] } },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: 'rgba(0, 150, 255, 0.4)' } },
            axisLabel: { color: '#7eb8d8', fontSize: 10 },
            pointer: { itemStyle: { color: theme.blue } },
            detail: {
              valueAnimation: true,
              formatter: `{value}${g.unit ?? ''}`,
              color: theme.green,
              fontSize: 22,
              offsetCenter: [0, '70%']
            },
            data: [{ value: g.value, name: d.title ?? '' }]
          }
        ]
      }
    }

    // 雷达图
    case 'radar':
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item' },
        radar: {
          indicator: d.indicators || [],
          radius: '62%',
          center: ['50%', '55%'],
          axisName: { color: '#7eb8d8', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(0, 150, 255, 0.15)' } },
          splitArea: { show: false },
          axisLine: { lineStyle: { color: 'rgba(0, 150, 255, 0.2)' } }
        },
        series: [
          {
            type: 'radar',
            symbolSize: 6,
            areaStyle: { opacity: 0.25 },
            data: [{ value: d.radarData || [], name: d.title ?? '指标' }]
          }
        ]
      }

    // 漏斗图
    case 'funnel':
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item' },
        legend,
        series: [
          {
            type: 'funnel',
            left: '12%',
            width: '76%',
            top: d.title ? 30 : 10,
            bottom: 30,
            minSize: '20%',
            label: { color: '#7eb8d8' },
            data: d.data
          }
        ]
      }

    // 地图（Day6）：GeoJSON 需先经 useMap → echarts.registerMap 注册
    case 'map': {
      const vm = d.visualMap
      const nums = (d.mapData || []).map((i) => i.value)
      const min = vm?.min ?? (nums.length ? Math.min(...nums) : 0)
      const max = vm?.max ?? (nums.length ? Math.max(...nums) : 100)
      return {
        ...base,
        color: palette,
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        visualMap: {
          min,
          max,
          left: 12,
          bottom: 12,
          calculable: true,
          text: ['高', '低'],
          textStyle: { color: '#7eb8d8' },
          inRange: { color: ['#0b3d66', '#00d4ff'] }
        },
        series: [
          {
            type: 'map',
            map: d.mapName || 'chongqing',
            roam: true,
            zoom: 1.1,
            label: { show: false },
            itemStyle: {
              areaColor: '#0d2a44',
              borderColor: 'rgba(0, 212, 255, 0.4)'
            },
            emphasis: {
              label: { show: true, color: '#ffffff' },
              itemStyle: { areaColor: theme.orange }
            },
            select: {
              label: { show: true, color: '#ffffff' },
              itemStyle: { areaColor: theme.green }
            },
            data: d.mapData || []
          }
        ]
      }
    }

    // 兜底：未知类型降级为柱状图，保证不崩页
    default:
      return { series: [{ type: 'bar', data: [] }] }
  }
}
