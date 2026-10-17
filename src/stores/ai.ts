import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { generateChartConfig, useMockLlm } from '@/api/llm'
import { fallbackChartConfig, validateChartConfig } from '@/utils/chartSchema'
import { applyRefine, describeRefine, type RefineAction } from '@/utils/chartOps'
import {
  MAX_SESSIONS,
  appendMessage,
  createSession,
  deriveTitle,
  isDefaultTitle,
  loadSessions,
  normalizeTitle,
  recentMessages,
  saveSessions,
  sortSessions,
  trimSessions
} from '@/utils/chatSession'
import type { ChartConfig, ChartType, ChatMessage, ExampleGroup } from '@/types'

// Day9：多轮对话只保留最近 N 条，控制上下文长度与 token 消耗
const HISTORY_LIMIT = 12

/** Day10：把底层异常翻译成「用户看得懂 + 知道该不该重试」的提示 */
function describeError(e: unknown): { message: string; retryable: boolean } {
  const raw = e instanceof Error ? e.message : String(e ?? '未知错误')
  const text = raw.toLowerCase()

  if (/401|403|unauthorized|invalid.*key|api.?key/.test(text)) {
    return { message: 'API Key 无效或权限不足，请检查 .env.local 配置', retryable: false }
  }
  if (/429|rate.?limit|too many/.test(text)) {
    return { message: '请求过于频繁（限流），稍后再试', retryable: true }
  }
  if (/timeout|etimedout|aborted/.test(text)) {
    return { message: '请求超时，网络或模型响应较慢', retryable: true }
  }
  if (/network|failed to fetch|load failed|econnrefused/.test(text)) {
    return { message: '网络异常，无法连接模型服务', retryable: true }
  }
  if (/50\d|server error|bad gateway/.test(text)) {
    return { message: '模型服务异常，请稍后重试', retryable: true }
  }
  if (/配置不合法|json|parse/.test(text)) {
    return { message: '模型返回的图表配置不合法，已切换为默认图表', retryable: true }
  }
  return { message: raw || '出图失败', retryable: true }
}

/**
 * Day8 / Day9 / Day10：AI 出图状态
 *
 * 流程：用户输入 → 请求层出图（LLM / Mock）→ 配置校验 → 存 Pinia → 视图渲染。
 * Day9：
 *  - 多轮上下文：把最近对话 + 当前配置交给模型，支持「在此基础上修改」；
 *  - 结果微调：`refine()` 在本地即时修改配置，无需再请求模型。
 * Day10：
 *  - 多会话：新建 / 切换 / 重命名 / 清空 / 删除，每个会话独立保存对话与图表；
 *  - 本地持久化：刷新页面不丢对话；
 *  - 错误分类：给出可操作提示与「是否可重试」。
 */
export const useAiStore = defineStore('ai', () => {
  const sessions = ref(sortSessions(loadSessions()))
  const activeId = ref<string>(sessions.value[0]?.id ?? '')

  const loading = ref(false)
  const error = ref<string | null>(null)
  const canRetry = ref(false)

  const mockMode = computed(() => useMockLlm())

  /** 当前会话（列表为空时返回 null，由 ensureActive 兜底） */
  const activeSession = computed(
    () => sessions.value.find((s) => s.id === activeId.value) ?? sessions.value[0] ?? null
  )
  const messages = computed<ChatMessage[]>(() => activeSession.value?.messages ?? [])
  const chartConfig = computed<ChartConfig | null>(() => activeSession.value?.chartConfig ?? null)
  const usedFallback = computed(() => activeSession.value?.usedFallback === true)
  const hasChart = computed(() => chartConfig.value !== null)
  /** 供视图渲染的会话列表（按最近活跃排序） */
  const sessionList = computed(() => sortSessions(sessions.value))

  // Day10：示例库按「看什么」分组，降低体验门槛
  const exampleGroups: ExampleGroup[] = [
    { name: '趋势', items: ['用折线图看近半年 GDP 趋势', '用折线图看近 12 个月客流量变化'] },
    { name: '构成', items: ['用饼图展示产业结构占比', '用漏斗图看政务办件转化流程'] },
    { name: '对比', items: ['用柱状图对比各区县数据', '用散点图看人口与 GDP 的相关性'] },
    { name: '评价', items: ['用雷达图评估城市综合能力', '用仪表盘展示智慧城市覆盖率'] }
  ]
  // 兼容 Day8/Day9 的扁平示例用法
  const examples = computed(() => exampleGroups.flatMap((g) => g.items))

  // ---------- 会话管理 ----------

  /** 保证至少存在一个会话 */
  function ensureActive() {
    if (activeSession.value) {
      if (activeId.value !== activeSession.value.id) activeId.value = activeSession.value.id
      return activeSession.value
    }
    const s = createSession()
    sessions.value = [s]
    activeId.value = s.id
    return s
  }

  function resetTransient() {
    error.value = null
    canRetry.value = false
    loading.value = false
  }

  /** 新建会话并切换过去 */
  function newSession(): string {
    const s = createSession()
    sessions.value = trimSessions([s, ...sessions.value], MAX_SESSIONS)
    activeId.value = s.id
    resetTransient()
    return s.id
  }

  function switchSession(id: string) {
    if (!sessions.value.some((s) => s.id === id)) return
    activeId.value = id
    resetTransient()
  }

  /** 重命名：空白输入回落到默认标题 */
  function renameSession(id: string, title: string) {
    const s = sessions.value.find((i) => i.id === id)
    if (!s) return
    s.title = normalizeTitle(title)
  }

  /** 清空当前会话的消息与图表（保留会话本身） */
  function clearMessages(id = activeId.value) {
    const s = sessions.value.find((i) => i.id === id)
    if (!s) return
    s.messages = []
    s.chartConfig = null
    s.usedFallback = false
    s.updatedAt = Date.now()
    resetTransient()
  }

  /** 删除会话；删空后自动补一个新会话，界面不会出现「无会话」空壳 */
  function deleteSession(id = activeId.value) {
    const rest = sessions.value.filter((s) => s.id !== id)
    sessions.value = rest
    if (!rest.length) {
      newSession()
      return
    }
    if (activeId.value === id) activeId.value = sortSessions(rest)[0].id
    resetTransient()
  }

  // ---------- 出图（Day8/9 逻辑 + Day10 会话化） ----------

  async function runPrompt(content: string, appendUser: boolean) {
    const session = ensureActive()
    if (!content || loading.value) return

    resetTransient()
    // Day9：先取上下文，再入队本轮用户消息
    const history = recentMessages(session, HISTORY_LIMIT)

    if (appendUser) {
      // Day10：首条提问自动作为会话标题
      if (isDefaultTitle(session.title)) session.title = deriveTitle(content)
      Object.assign(session, appendMessage(session, { role: 'user', content }))
    }
    session.usedFallback = false
    loading.value = true

    try {
      const raw = await generateChartConfig(content, {
        history,
        current: session.chartConfig
      })
      const cfg = validateChartConfig(raw)
      if (!cfg) throw new Error('模型返回的图表配置不合法')
      session.chartConfig = cfg
      Object.assign(
        session,
        appendMessage(session, {
          role: 'assistant',
          content: `已生成「${cfg.title || cfg.type}」图表，请在右侧预览。`
        })
      )
      sessions.value = sortSessions(sessions.value)
    } catch (e) {
      const { message, retryable } = describeError(e)
      error.value = message
      canRetry.value = retryable
      // 降级兜底：非法配置不崩页
      session.chartConfig = fallbackChartConfig()
      session.usedFallback = true
      Object.assign(
        session,
        appendMessage(session, {
          role: 'assistant',
          content: `出图失败：${message}${retryable ? '（可点击重试）' : ''}`
        })
      )
      sessions.value = sortSessions(sessions.value)
    } finally {
      loading.value = false
    }
  }

  function send(text: string) {
    const content = (text || '').trim()
    if (!content) return Promise.resolve()
    return runPrompt(content, true)
  }

  /** Day10：重试当前会话最后一次提问（不重复追加用户消息） */
  function retry() {
    const session = activeSession.value
    if (!session || loading.value) return Promise.resolve()
    const last = [...session.messages].reverse().find((m) => m.role === 'user')
    if (!last) return Promise.resolve()
    return runPrompt(last.content, false)
  }

  // ---------- Day9：本地即时微调（无需再次请求模型） ----------

  function refine(action: RefineAction) {
    const session = ensureActive()
    if (!session.chartConfig) return
    const next = applyRefine(session.chartConfig, action)
    Object.assign(session, {
      chartConfig: next,
      messages: [
        ...session.messages,
        { role: 'assistant' as const, content: `已微调图表：${describeRefine(action)}。`, createdAt: Date.now() }
      ],
      updatedAt: Date.now()
    })
    sessions.value = sortSessions(sessions.value)
  }

  // Day9：换类型的便捷方法
  function changeType(type: ChartType) {
    refine({ kind: 'changeType', type })
  }

  /** 兼容旧接口：重置即清空当前会话 */
  function reset() {
    clearMessages()
  }

  // 会话变化即落盘（标题 / 消息 / 图表）
  watch(sessions, (list) => saveSessions(list), { deep: true })

  return {
    // 状态
    sessions: sessionList,
    activeId,
    activeSession,
    messages,
    loading,
    error,
    canRetry,
    chartConfig,
    usedFallback,
    hasChart,
    mockMode,
    // 示例
    examples,
    exampleGroups,
    // 会话操作
    newSession,
    switchSession,
    renameSession,
    clearMessages,
    deleteSession,
    // 出图
    send,
    retry,
    refine,
    changeType,
    reset
  }
})
