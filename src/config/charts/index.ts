import type { ChartOption } from '@/hooks/useEcharts'

// 主题色
export const theme = {
  blue: '#00d4ff',
  green: '#00ff88',
  orange: '#ff9500',
  purple: '#a855f7'
}

const axisLine = { lineStyle: { color: 'rgba(0, 150, 255, 0.3)' } }
const axisLabel = { color: '#7eb8d8' }
const splitLine = { lineStyle: { color: 'rgba(0, 150, 255, 0.1)' } }

type ChartData = {
  xAxis?: string[]
  series?: number[]
  data?: { name: string; value: number }[]
}

/**
 * 配置驱动：输入「类型 + 数据」，输出标准 ECharts option
 * （对应简历：封装配置驱动通用图表组件）。Day5 会扩展为覆盖 6+ 图表类型。
 */
export function buildOption(type: string, data: unknown): ChartOption {
  const d = (data || {}) as ChartData

  if (type === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: ['40%', '70%'], data: d.data }]
    }
  }

  if (type === 'line' || type === 'bar') {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '12%', right: '5%', top: '15%', bottom: '15%' },
      xAxis: { type: 'category', data: d.xAxis, axisLine, axisLabel },
      yAxis: { type: 'value', axisLine, axisLabel, splitLine },
      series: [{ type, data: d.series, smooth: type === 'line' }]
    }
  }

  return { series: [{ type: 'bar', data: [] }] }
}
