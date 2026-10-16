import type { ChartConfig, ChartType, NameValue, RadarIndicator } from '@/types'

// Day5：与 config/charts 的 buildOption 保持一致，覆盖 6+ 图表类型
// Day6：补充 map（GeoJSON 地图热力）
// Day8：新增「从模型文本提取 JSON」「按类型深度校验」「非法配置降级兜底」，
//        让大模型返回的配置在渲染前经过严格过滤，保证「非法配置不崩页」。
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

/** 从模型返回的文本中提取 JSON（兼容 ```json 代码块 / 前后带解释文字） */
export function extractJson(text: unknown): unknown {
  if (typeof text !== 'string') return text
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fence ? fence[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

// ---------- 基础类型清洗 ----------
function toNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

function toNumberArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null
  const out: number[] = []
  for (const item of v) {
    const n = toNumber(item)
    if (n === null) return null
    out.push(n)
  }
  return out
}

function toNameValues(v: unknown): NameValue[] | null {
  if (!Array.isArray(v)) return null
  const out: NameValue[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') return null
    const o = item as Record<string, unknown>
    const value = toNumber(o.value)
    if (value === null || o.name == null) return null
    out.push({ name: String(o.name), value })
  }
  return out
}

/**
 * 按类型深度校验 / 归一化大模型返回的图表配置。
 * 合法返回清洗后的配置对象；非法返回 null（由调用方降级兜底）。
 */
export function validateChartConfig(input: unknown): ChartConfig | null {
  const obj = typeof input === 'string' ? extractJson(input) : input
  if (!obj || typeof obj !== 'object') return null

  const cfg = obj as Record<string, unknown>
  const type = cfg.type
  if (typeof type !== 'string' || !VALID_TYPES.includes(type as ChartType)) return null

  const out: ChartConfig = { type: type as ChartType }
  if (cfg.title != null) out.title = String(cfg.title)

  switch (type) {
    case 'line':
    case 'bar':
    case 'scatter': {
      if (!Array.isArray(cfg.xAxis) || cfg.xAxis.length === 0) return null
      out.xAxis = (cfg.xAxis as unknown[]).map((i) => String(i))

      const s = cfg.series
      // 多系列：[[..],[..]]；单系列：[..]
      if (Array.isArray(s) && s.length > 0 && Array.isArray(s[0])) {
        const multi = (s as unknown[]).map(toNumberArray)
        if (multi.some((m) => m === null)) return null
        out.series = multi as number[][]
      } else {
        const single = toNumberArray(s)
        if (!single) return null
        out.series = single
      }
      return out
    }

    case 'pie':
    case 'funnel': {
      const data = toNameValues(cfg.data)
      if (!data || data.length === 0) return null
      out.data = data
      return out
    }

    case 'gauge': {
      const g = (cfg.gauge || {}) as Record<string, unknown>
      const value = toNumber(g.value)
      if (value === null) return null
      const gauge: NonNullable<ChartConfig['gauge']> = { value, max: toNumber(g.max) ?? 100 }
      if (g.unit != null) gauge.unit = String(g.unit)
      out.gauge = gauge
      return out
    }

    case 'radar': {
      if (!Array.isArray(cfg.indicators) || cfg.indicators.length === 0) return null
      const indicators: RadarIndicator[] = []
      for (const item of cfg.indicators) {
        const o = item as Record<string, unknown>
        const max = toNumber(o?.max)
        if (max === null || o?.name == null) return null
        indicators.push({ name: String(o.name), max })
      }
      out.indicators = indicators
      out.radarData = toNumberArray(cfg.radarData) ?? indicators.map(() => 0)
      return out
    }

    case 'map': {
      if (cfg.mapName != null) out.mapName = String(cfg.mapName)
      const mapData = toNameValues(cfg.mapData)
      if (mapData) out.mapData = mapData
      return out
    }

    default:
      return null
  }
}

/** 降级兜底：模型输出异常时，返回一份安全的默认配置，保证界面不崩 */
export function fallbackChartConfig(): ChartConfig {
  return {
    type: 'line',
    title: '默认图表（降级兜底）',
    xAxis: ['A', 'B', 'C'],
    series: [1, 2, 3]
  }
}
