// 全局类型定义

// 大屏图表卡片
export interface ChartCard {
  id: string
  title: string
  type: ChartType
  data: unknown
}

// 通用图表类型（对应简历：折线/柱状/饼图/地图等 6+ 类型）
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'map' | 'gauge'

// AI 出图的图表配置（由大模型返回，前端校验后渲染）
export interface ChartConfig {
  type: ChartType
  title?: string
  xAxis?: string[]
  series?: number[]
  data?: { name: string; value: number }[]
}

// 对话消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
