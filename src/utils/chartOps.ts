import type { ChartConfig, ChartType, NameValue } from '@/types'

/**
 * Day9：图表结果微调（本地、即时、确定性）
 *
 * 在「已生成图表」的基础上做微调：改标题 / 换类型 / 追加数据点 / 删除末项。
 * 这些操作不依赖大模型，前端直接计算，交互零延迟；也可作为模型微调失败时的兜底。
 * 所有函数均为纯函数：不改动入参，返回新的 ChartConfig。
 */
export type RefineAction =
  | { kind: 'setTitle'; title: string }
  | { kind: 'changeType'; type: ChartType }
  | { kind: 'appendPoint'; name?: string; value?: number }
  | { kind: 'removeLast' }

const TYPE_CN: Record<ChartType, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  scatter: '散点图',
  gauge: '仪表盘',
  radar: '雷达图',
  funnel: '漏斗图',
  map: '地图'
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** 取「类目名称」列表（兼容各类图表的数据结构） */
function names(cfg: ChartConfig): string[] {
  if (cfg.xAxis?.length) return [...cfg.xAxis]
  if (cfg.data?.length) return cfg.data.map((d) => d.name)
  if (cfg.indicators?.length) return cfg.indicators.map((i) => i.name)
  return []
}

/** 取「数值」列表（取首个系列） */
function values(cfg: ChartConfig): number[] {
  const s = cfg.series
  if (Array.isArray(s)) {
    if (s.length && Array.isArray(s[0])) return [...(s[0] as number[])]
    return [...(s as number[])]
  }
  if (cfg.data?.length) return cfg.data.map((d) => d.value)
  if (cfg.radarData?.length) return [...cfg.radarData]
  if (cfg.gauge) return [cfg.gauge.value]
  return []
}

/** 归一化为「名称 + 数值」对，便于跨类型复用数据 */
function toNameValues(cfg: ChartConfig): NameValue[] {
  const n = names(cfg)
  const v = values(cfg)
  const len = Math.max(n.length, v.length)
  const out: NameValue[] = []
  for (let i = 0; i < len; i++) out.push({ name: n[i] ?? `类目${i + 1}`, value: v[i] ?? 0 })
  return out
}

/** 改标题（空字符串则清除标题） */
export function setTitle(cfg: ChartConfig, title: string): ChartConfig {
  const next = clone(cfg)
  const t = title.trim()
  if (t) next.title = t
  else delete next.title
  return next
}

/** 换图表类型（尽量复用已有数据；map 依赖地理数据，不做类型转换） */
export function changeType(cfg: ChartConfig, type: ChartType): ChartConfig {
  if (type === 'map') return clone(cfg)

  const base = toNameValues(cfg)
  const nList = base.length ? base.map((d) => d.name) : ['A', 'B', 'C']
  const vList = base.length ? base.map((d) => d.value) : [1, 2, 3]

  const next: ChartConfig = { type }
  if (cfg.title) next.title = cfg.title

  switch (type) {
    case 'line':
    case 'bar':
    case 'scatter':
      next.xAxis = nList
      next.series = vList
      break
    case 'pie':
    case 'funnel':
      next.data = nList.map((name, i) => ({ name, value: vList[i] ?? 0 }))
      break
    case 'gauge': {
      const maxV = Math.max(100, ...vList.map((v) => Math.abs(v)))
      const gauge: NonNullable<ChartConfig['gauge']> = {
        value: vList[vList.length - 1] ?? 0,
        max: maxV
      }
      if (cfg.gauge?.unit) gauge.unit = cfg.gauge.unit
      next.gauge = gauge
      break
    }
    case 'radar':
      next.indicators = nList.map((name, i) => ({
        name,
        max: Math.max(100, Math.ceil(Math.abs(vList[i] ?? 0) * 1.2))
      }))
      next.radarData = vList
      break
    default:
      break
  }
  return next
}

/** 追加一个数据点 / 维度 */
export function appendPoint(cfg: ChartConfig, name?: string, value?: number): ChartConfig {
  const next = clone(cfg)
  const existing = toNameValues(next)
  const n = name?.trim() || `类目${existing.length + 1}`
  const v =
    typeof value === 'number' && Number.isFinite(value) ? value : Math.round(Math.random() * 80 + 20)

  switch (next.type) {
    case 'line':
    case 'bar':
    case 'scatter':
      next.xAxis = [...(next.xAxis ?? []), n]
      next.series = [...values(next), v]
      break
    case 'pie':
    case 'funnel':
      next.data = [...(next.data ?? []), { name: n, value: v }]
      break
    case 'radar':
      next.indicators = [
        ...(next.indicators ?? []),
        { name: n, max: Math.max(100, Math.ceil(Math.abs(v) * 1.2)) }
      ]
      next.radarData = [...(next.radarData ?? []), v]
      break
    default:
      break
  }
  return next
}

/** 删除最后一个数据点 / 维度 */
export function removeLast(cfg: ChartConfig): ChartConfig {
  const next = clone(cfg)
  switch (next.type) {
    case 'line':
    case 'bar':
    case 'scatter': {
      if (next.xAxis?.length) next.xAxis = next.xAxis.slice(0, -1)
      const s = next.series
      if (Array.isArray(s)) {
        if (s.length && Array.isArray(s[0])) {
          next.series = (s as number[][]).map((a) => a.slice(0, -1))
        } else {
          next.series = (s as number[]).slice(0, -1)
        }
      }
      break
    }
    case 'pie':
    case 'funnel':
      if (next.data?.length) next.data = next.data.slice(0, -1)
      break
    case 'radar':
      if (next.indicators?.length) next.indicators = next.indicators.slice(0, -1)
      if (next.radarData?.length) next.radarData = next.radarData.slice(0, -1)
      break
    default:
      break
  }
  return next
}

/** 统一入口：按 action 应用微调 */
export function applyRefine(cfg: ChartConfig, action: RefineAction): ChartConfig {
  switch (action.kind) {
    case 'setTitle':
      return setTitle(cfg, action.title)
    case 'changeType':
      return changeType(cfg, action.type)
    case 'appendPoint':
      return appendPoint(cfg, action.name, action.value)
    case 'removeLast':
      return removeLast(cfg)
    default:
      return clone(cfg)
  }
}

/** 生成微调操作的中文描述（用于对话消息） */
export function describeRefine(action: RefineAction): string {
  switch (action.kind) {
    case 'setTitle':
      return `修改标题为「${action.title}」`
    case 'changeType':
      return `切换为${TYPE_CN[action.type]}`
    case 'appendPoint':
      return '追加一个数据点'
    case 'removeLast':
      return '删除最后一个数据点'
    default:
      return '微调图表'
  }
}
