// 全局类型定义

// 大屏图表卡片
export interface ChartCard {
  id: string
  title: string
  type: ChartType
  data: unknown
}

// 通用图表类型（对应简历：折线/柱状/饼图/散点/仪表盘/雷达/漏斗/地图等 6+ 类型）
// Day5：配置驱动通用图表组件覆盖 7 类型；Day6：新增 map（GeoJSON 地图 / 热力）
export type ChartType =
  | 'line' // 折线图
  | 'bar' // 柱状图
  | 'pie' // 饼图
  | 'scatter' // 散点图
  | 'gauge' // 仪表盘
  | 'radar' // 雷达图
  | 'funnel' // 漏斗图
  | 'map' // 地图（Day6）

// 「名称 + 数值」对（饼图、漏斗图、地图热力等类目数据通用）
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
// Day6：新增地图相关字段（mapName / mapUrl / mapData / visualMap）
export interface ChartConfig {
  type: ChartType
  title?: string
  /** 类目轴数据（line / bar / scatter） */
  xAxis?: string[]
  /** 单系列 [1,2,3] 或多系列 [[1,2],[3,4]]（line / bar / scatter） */
  series?: number[] | number[][]
  /** 类目数据（pie / funnel / map 热力） */
  data?: NameValue[]
  /** 仪表盘参数（gauge） */
  gauge?: { value: number; max?: number; unit?: string }
  /** 雷达图维度（radar） */
  indicators?: RadarIndicator[]
  /** 雷达图数值（radar） */
  radarData?: number[]
  /** 地图名称，需先经 echarts.registerMap 注册（map，Day6） */
  mapName?: string
  /** 地图 GeoJSON 地址（map，Day6；组件内按需异步加载） */
  mapUrl?: string
  /** 地图热力数据（map，Day6） */
  mapData?: NameValue[]
  /** 地图热力 visualMap 区间（map，Day6） */
  visualMap?: { min: number; max: number }
}

// 对话消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
