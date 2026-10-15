import { get } from './http'
import { MOCK_DASHBOARD } from '@/mock/dashboard'
import type { DashboardData, RealtimePoint } from '@/types'

/**
 * Day7：数据请求层
 *
 * - 有真实后端时走 `http` 封装（axios 拦截器统一鉴权 / 异常处理）；
 * - 默认（`VITE_USE_MOCK` 未显式关闭）回退到内置 Mock，便于无后端演示与联调切换；
 * - `VITE_MOCK_SCENARIO` 可在本地预览 **空态 / 错误态**（normal | empty | error），
 *   用来验证 Day7 的加载态 / 错误态 / 空态三态处理。
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const SCENARIO = import.meta.env.VITE_MOCK_SCENARIO || 'normal'

// 空数据（用于演示「空态」渲染）
const EMPTY_DASHBOARD: DashboardData = {
  gdp: { type: 'line', xAxis: [], series: [] },
  industry: { type: 'pie', data: [] },
  region: { type: 'bar', xAxis: [], series: [] },
  population: { type: 'bar', xAxis: [], series: [] },
  traffic: { type: 'line', xAxis: [], series: [] },
  indicators: []
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// 深拷贝，避免调用方改动 Mock 源数据
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** 拉取大屏总览数据（图表配置 + 底部指标） */
export async function fetchDashboardData(): Promise<DashboardData> {
  if (!USE_MOCK) return get<DashboardData>('/dashboard/overview')

  await delay(700) // 模拟网络延迟，便于观察加载态
  if (SCENARIO === 'error') throw new Error('接口请求失败（HTTP 500）')
  if (SCENARIO === 'empty') return clone(EMPTY_DASHBOARD)
  return clone(MOCK_DASHBOARD)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 拉取一个实时数据点（用于 dataset 增量更新演示） */
export async function fetchRealtimePoint(): Promise<RealtimePoint> {
  if (!USE_MOCK) return get<RealtimePoint>('/dashboard/realtime')

  await delay(200)
  const d = new Date()
  // 正弦波 + 随机扰动，模拟随时间波动的指标
  const base = 60 + Math.sin(Date.now() / 3000) * 15
  return {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    value: Math.round((base + Math.random() * 10) * 10) / 10
  }
}
