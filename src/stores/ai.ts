import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { generateChartConfig, useMockLlm } from '@/api/llm'
import { fallbackChartConfig, validateChartConfig } from '@/utils/chartSchema'
import { applyRefine, describeRefine, type RefineAction } from '@/utils/chartOps'
import type { ChartConfig, ChartType, ChatMessage } from '@/types'

// Day9：多轮对话只保留最近 N 条，控制上下文长度与 token 消耗
const HISTORY_LIMIT = 12

/**
 * Day8/Day9：AI 出图状态
 *
 * 流程：用户输入 → 请求层出图（LLM / Mock）→ 配置校验 → 存 Pinia → 视图渲染。
 * Day9 增强：
 *  - 多轮上下文：把最近对话 + 当前配置交给模型，支持「在此基础上修改」；
 *  - 结果微调：`refine()` 在本地即时修改配置（改标题 / 换类型 / 增删数据），无需再请求模型。
 */
export const useAiStore = defineStore('ai', () => {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // 当前要渲染的图表配置（AI 生成 + 校验后）
  const chartConfig = ref<ChartConfig | null>(null)
  // 是否使用了降级兜底图表（模型输出非法时）
  const usedFallback = ref(false)

  const mockMode = computed(() => useMockLlm())
  const hasChart = computed(() => chartConfig.value !== null)

  // 快捷示例，降低体验门槛
  const examples = [
    '用折线图看近半年 GDP 趋势',
    '用饼图展示产业结构占比',
    '用雷达图评估城市综合能力',
    '用仪表盘展示智慧城市覆盖率',
    '用柱状图对比各区县数据'
  ]

  // 最近的多轮上下文（不含本轮用户输入）
  function recentHistory(): ChatMessage[] {
    return messages.value.slice(-HISTORY_LIMIT)
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading.value) return

    error.value = null
    usedFallback.value = false

    // 先取上下文，再入队本轮用户消息
    const history = recentHistory()
    messages.value.push({ role: 'user', content })
    loading.value = true

    try {
      const raw = await generateChartConfig(content, {
        history,
        current: chartConfig.value
      })
      const cfg = validateChartConfig(raw)
      if (!cfg) throw new Error('模型返回的图表配置不合法')
      chartConfig.value = cfg
      messages.value.push({
        role: 'assistant',
        content: `已生成「${cfg.title || cfg.type}」图表，请在右侧预览。`
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '出图失败'
      // 降级兜底：非法配置不崩页
      chartConfig.value = fallbackChartConfig()
      usedFallback.value = true
      messages.value.push({
        role: 'assistant',
        content: `出图失败：${error.value}，已展示降级默认图表。`
      })
    } finally {
      loading.value = false
    }
  }

  // Day9：本地即时微调（无需再次请求模型）
  function refine(action: RefineAction) {
    if (!chartConfig.value) return
    chartConfig.value = applyRefine(chartConfig.value, action)
    messages.value.push({ role: 'assistant', content: `已微调图表：${describeRefine(action)}。` })
  }

  // Day9：换类型的便捷方法
  function changeType(type: ChartType) {
    refine({ kind: 'changeType', type })
  }

  function reset() {
    messages.value = []
    chartConfig.value = null
    error.value = null
    usedFallback.value = false
  }

  return {
    messages,
    loading,
    error,
    chartConfig,
    usedFallback,
    mockMode,
    hasChart,
    examples,
    send,
    refine,
    changeType,
    reset
  }
})
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { generateChartConfig, useMockLlm } from '@/api/llm'
import { fallbackChartConfig, validateChartConfig } from '@/utils/chartSchema'
import type { ChartConfig, ChatMessage } from '@/types'

/**
 * Day8：AI 出图状态
 *
 * 流程：用户输入 → 请求层出图（LLM / Mock）→ 配置校验 → 存 Pinia → 视图渲染。
 * 统一维护对话消息、加载态、错误态，以及「非法配置降级兜底」。
 */
export const useAiStore = defineStore('ai', () => {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // 当前要渲染的图表配置（AI 生成 + 校验后）
  const chartConfig = ref<ChartConfig | null>(null)
  // 是否使用了降级兜底图表（模型输出非法时）
  const usedFallback = ref(false)

  const mockMode = computed(() => useMockLlm())
  const hasChart = computed(() => chartConfig.value !== null)

  // 快捷示例，降低体验门槛
  const examples = [
    '用折线图看近半年 GDP 趋势',
    '用饼图展示产业结构占比',
    '用雷达图评估城市综合能力',
    '用仪表盘展示智慧城市覆盖率',
    '用柱状图对比各区县数据'
  ]

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading.value) return

    error.value = null
    usedFallback.value = false
    messages.value.push({ role: 'user', content })
    loading.value = true

    try {
      const raw = await generateChartConfig(content)
      const cfg = validateChartConfig(raw)
      if (!cfg) throw new Error('模型返回的图表配置不合法')
      chartConfig.value = cfg
      messages.value.push({
        role: 'assistant',
        content: `已生成「${cfg.title || cfg.type}」图表，请在右侧预览。`
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '出图失败'
      // 降级兜底：非法配置不崩页
      chartConfig.value = fallbackChartConfig()
      usedFallback.value = true
      messages.value.push({
        role: 'assistant',
        content: `出图失败：${error.value}，已展示降级默认图表。`
      })
    } finally {
      loading.value = false
    }
  }

  function reset() {
    messages.value = []
    chartConfig.value = null
    error.value = null
    usedFallback.value = false
  }

  return {
    messages,
    loading,
    error,
    chartConfig,
    usedFallback,
    mockMode,
    hasChart,
    examples,
    send,
    reset
  }
})
