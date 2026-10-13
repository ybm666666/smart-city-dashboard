// 全局类型定义

// 大屏图表卡片
export interface ChartCard {
  id: string
  title: string
  type: ChartType
  data: unknown
}

// 通用图表类型（对应简历：折线/柱状/饼图/散点/仪表盘/雷达/漏斗等 6+ 类型）
// Day5：配置驱动通用图表组件覆盖的类型；map 留给 Day6 单独实现
export type ChartType =
  | 'line' // 折线图
  | 'bar' // 柱状图
  | 'pie' // 饼图
  | 'scatter' // 散点图
  | 'gauge' // 仪表盘
  | 'radar' // 雷达图
  | 'funnel' // 漏斗图
  | 'map' // 地图（Day6）

// 「名称 + 数值」对（饼图、漏斗图等类目数据通用）
export interface NameValue {
  name: string
  value: number
}

// 雷达图维度定义
export interface RadarIndicator {
  name: string
  max: number
}

// AI 出图的图表配置（由大模型返回，前端校验后渲染）
// Day5：配置驱动 —— 一份配置描述「类型 + 数据」，即可渲染出对应图表
export interface ChartConfig {
  type: ChartType
  title?: string
  /** 类目轴数据（line / bar / scatter） */
  xAxis?: string[]
  /** 单系列 [1,2,3] 或多系列 [[1,2],[3,4]]（line / bar / scatter） */
  series?: number[] | number[][]
  /** 类目数据（pie / funnel） */
  data?: NameValue[]
  /** 仪表盘参数（gauge） */
  gauge?: { value: number; max?: number; unit?: string }
  /** 雷达图维度（radar） */
  indicators?: RadarIndicator[]
  /** 雷达图数值（radar） */
  radarData?: number[]
}

// 对话消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
