import type { ChartConfig, ChartType } from '@/types'

// Day5：与 config/charts 的 buildOption 保持一致，覆盖 6+ 图表类型（map 留给 Day6）
const VALID_TYPES: ChartType[] = [
  'line',
  'bar',
  'pie',
  'scatter',
  'gauge',
  'radar',
  'funnel',
  'map'
]

/**
 * 校验大模型返回的图表配置。
 * 合法返回配置对象；非法返回 null（由调用方做降级兜底，保证「非法配置不崩页」）。
 */
export function validateChartConfig(input: unknown): ChartConfig | null {
  if (!input || typeof input !== 'object') return null
  const cfg = input as Record<string, unknown>
  if (typeof cfg.type !== 'string' || !VALID_TYPES.includes(cfg.type as ChartType)) {
    return null
  }
  return cfg as unknown as ChartConfig
}

// 降级兜底：模型输出异常时，返回一份安全的默认配置
export function fallbackChartConfig(): ChartConfig {
  return {
    type: 'line',
    title: '默认图表（降级兜底）',
    xAxis: ['A', 'B', 'C'],
    series: [1, 2, 3]
  }
}
