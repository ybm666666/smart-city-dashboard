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
// Day7：新增 dataset（ECharts 数据集，二维表），用 dataset + encode 渲染，支持增量更新
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
  /** ECharts dataset 源数据（Day7）：首行为表头，之后每行一条记录 */
  dataset?: (string | number)[][]
}

// 底部指标（Day3 起用；Day7 随数据层抽到全局类型）
export interface Indicator {
  label: string
  value: number
  unit?: string
  decimals?: number
}

// Day7：大屏数据契约 —— 请求层返回、Pinia 存储，替代原静态配置
export interface DashboardData {
  /** GDP 趋势（line） */
  gdp: ChartConfig
  /** 产业结构（pie） */
  industry: ChartConfig
  /** 区县总览（bar） */
  region: ChartConfig
  /** 常住人口（bar） */
  population: ChartConfig
  /** 交通运行指数（line） */
  traffic: ChartConfig
  /** 底部指标 */
  indicators: Indicator[]
}

// Day7：实时数据点（dataset 增量更新演示）
export interface RealtimePoint {
  time: string
  value: number
}

// 对话消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Day10：消息时间戳，用于会话排序与展示 */
  createdAt?: number
}

// Day10：AI 出图会话（一个会话 = 一段独立对话 + 它产出的图表配置）
export interface ChatSession {
  id: string
  /** 会话标题：默认由首条提问推导，可手动重命名 */
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  /** 该会话当前渲染的图表配置 */
  chartConfig: ChartConfig | null
  /** 该会话是否展示的是降级兜底图表 */
  usedFallback?: boolean
}

// Day10：示例库分组
export interface ExampleGroup {
  name: string
  items: string[]
}
