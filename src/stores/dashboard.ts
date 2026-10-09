import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChartCard, ChatMessage } from '@/types'

// 大屏数据状态（对应简历：Pinia 管理状态）
export const useDashboardStore = defineStore('dashboard', () => {
  const charts = ref<ChartCard[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])

  function setCharts(list: ChartCard[]) {
    charts.value = list
  }
  function setLoading(v: boolean) {
    loading.value = v
  }
  function setError(msg: string | null) {
    error.value = msg
  }
  function pushMessage(message: ChatMessage) {
    messages.value.push(message)
  }
  // 流式对话时往最后一条 assistant 消息追加内容
  function appendToLast(text: string) {
    const last = messages.value[messages.value.length - 1]
    if (last) last.content += text
  }

  return {
    charts,
    loading,
    error,
    messages,
    setCharts,
    setLoading,
    setError,
    pushMessage,
    appendToLast
  }
})
