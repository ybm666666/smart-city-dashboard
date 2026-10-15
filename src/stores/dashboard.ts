import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchDashboardData, fetchRealtimePoint } from '@/api/dashboard'
import type { ChatMessage, DashboardData, Indicator, RealtimePoint } from '@/types'

// 大屏数据状态（对应简历：Pinia 管理状态）
// Day7：数据改由请求层异步加载（替代原静态配置），并统一维护加载 / 错误 / 空三态；
//        同时维护一个实时数据序列，用于演示图表的 dataset 增量更新。
export const useDashboardStore = defineStore('dashboard', () => {
  // ---------- 大屏数据 ----------
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false) // 是否已成功拉取（用于缓存判断）

  const indicatorList = computed<Indicator[]>(() => data.value?.indicators ?? [])
  const gdpConfig = computed(() => data.value?.gdp ?? null)
  const industryConfig = computed(() => data.value?.industry ?? null)
  const regionConfig = computed(() => data.value?.region ?? null)
  const populationConfig = computed(() => data.value?.population ?? null)
  const trafficConfig = computed(() => data.value?.traffic ?? null)

  // 空态：已加载、无错误，但没有任何指标数据
  const empty = computed(
    () => loaded.value && !loading.value && !error.value && indicatorList.value.length === 0
  )

  /**
   * 加载大屏数据
   * @param force 忽略缓存强制重新拉取（错误 / 空态重试、手动刷新）
   */
  async function loadDashboard(force = false) {
    if (loading.value) return
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      data.value = await fetchDashboardData()
      loaded.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '数据加载失败'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  // 错误态 / 空态的统一重试入口
  function retry() {
    return loadDashboard(true)
  }

  // ---------- 实时序列（dataset 增量更新演示）----------
  const realtime = ref<RealtimePoint[]>([])
  const REALTIME_MAX = 20
  let rtTimer: number | undefined

  async function tickRealtime() {
    const point = await fetchRealtimePoint()
    realtime.value.push(point)
    // 滚动窗口：仅保留最近 N 个点，避免数组无限增长
    if (realtime.value.length > REALTIME_MAX) {
      realtime.value.splice(0, realtime.value.length - REALTIME_MAX)
    }
  }

  function startRealtime(interval = 1500) {
    stopRealtime()
    void tickRealtime()
    rtTimer = window.setInterval(() => void tickRealtime(), interval)
  }
  function stopRealtime() {
    if (rtTimer !== undefined) {
      window.clearInterval(rtTimer)
      rtTimer = undefined
    }
  }

  // ---------- 对话（AI 出图，Day 8–12）----------
  const messages = ref<ChatMessage[]>([])
  function pushMessage(message: ChatMessage) {
    messages.value.push(message)
  }
  // 流式对话时往最后一条 assistant 消息追加内容
  function appendToLast(text: string) {
    const last = messages.value[messages.value.length - 1]
    if (last) last.content += text
  }

  return {
    data,
    loading,
    error,
    loaded,
    empty,
    indicatorList,
    gdpConfig,
    industryConfig,
    regionConfig,
    populationConfig,
    trafficConfig,
    loadDashboard,
    retry,
    realtime,
    startRealtime,
    stopRealtime,
    messages,
    pushMessage,
    appendToLast
  }
})
