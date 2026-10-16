import type { ChatMessage } from '@/types'
import { post } from './http'
import { mockChartFromPrompt } from '@/mock/llm'

const BASE_URL = import.meta.env.VITE_LLM_BASE_URL
const API_KEY = import.meta.env.VITE_LLM_API_KEY
const MODEL = import.meta.env.VITE_LLM_MODEL || 'deepseek-chat'

/** 是否配置了可用的 API Key（占位符视为未配置） */
export function hasApiKey(): boolean {
  return !!API_KEY && !/your-key|xxxx|placeholder|^sk-?$/i.test(API_KEY.trim())
}

/** 是否走 Mock 出图：未配置 Key，或显式开启 VITE_USE_MOCK_LLM */
export function useMockLlm(): boolean {
  return !hasApiKey() || import.meta.env.VITE_USE_MOCK_LLM === 'true'
}

// 非流式：普通对话（Day 8–10 的 AI 出图会用它 + Function Calling）
export function chatCompletion(messages: ChatMessage[]) {
  return post<{ choices: { message: ChatMessage }[] }>(`${BASE_URL}/chat/completions`, {
    model: MODEL,
    messages
  })
}

// ---------- Day8：Function Calling 出图 ----------

// 出图工具的 JSON Schema（OpenAI 兼容）
export const CHART_TOOL = {
  type: 'function',
  function: {
    name: 'render_chart',
    description:
      '根据用户的自然语言需求，生成一份可渲染的图表配置（只含类型与数据），由前端负责渲染。',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['line', 'bar', 'pie', 'scatter', 'gauge', 'radar', 'funnel'],
          description: '图表类型：折线 / 柱状 / 饼 / 散点 / 仪表盘 / 雷达 / 漏斗'
        },
        title: { type: 'string', description: '图表标题' },
        xAxis: {
          type: 'array',
          items: { type: 'string' },
          description: '类目轴（line / bar / scatter 需要）'
        },
        series: {
          type: 'array',
          items: { type: 'number' },
          description: '与 xAxis 对应的数值（line / bar / scatter 需要）'
        },
        data: {
          type: 'array',
          description: '名称 + 数值对（pie / funnel 需要）',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, value: { type: 'number' } },
            required: ['name', 'value']
          }
        },
        gauge: {
          type: 'object',
          description: '仪表盘参数（gauge 需要）',
          properties: {
            value: { type: 'number' },
            max: { type: 'number' },
            unit: { type: 'string' }
          },
          required: ['value']
        },
        indicators: {
          type: 'array',
          description: '雷达维度（radar 需要）',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, max: { type: 'number' } },
            required: ['name', 'max']
          }
        },
        radarData: {
          type: 'array',
          items: { type: 'number' },
          description: '与 indicators 对应的数值（radar 需要）'
        }
      },
      required: ['type']
    }
  }
} as const

const SYSTEM_PROMPT = `你是数据可视化助手。请根据用户的一句话需求，调用 render_chart 工具返回一份图表配置。要求：
- 只通过工具返回配置，不要输出多余解释；
- type 只能是 line / bar / pie / scatter / gauge / radar / funnel 之一；
- line/bar/scatter 必须给出 xAxis 与 series；
- pie/funnel 必须给出 data（每项含 name 与 value）；
- gauge 必须给出 gauge.value；
- radar 必须给出 indicators 与 radarData；
- 若用户未提供具体数据，可构造一组合理的示例数据。`

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string
      tool_calls?: { function?: { name?: string; arguments?: string } }[]
    }
  }[]
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Day8：自然语言 → 图表配置（原始结果）。
 * 返回原始对象 / JSON 字符串，统一交给 validateChartConfig 校验清洗。
 * - 无 Key 或开启 Mock：走内置规则生成；
 * - 有 Key：走 Function Calling（tool_choice 强制调用 render_chart）。
 */
export async function generateChartConfig(userText: string): Promise<unknown> {
  if (useMockLlm()) {
    await delay(600)
    return mockChartFromPrompt(userText)
  }

  const res = await post<ChatCompletionResponse>(`${BASE_URL}/chat/completions`, {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText }
    ],
    tools: [CHART_TOOL],
    tool_choice: { type: 'function', function: { name: 'render_chart' } }
  })

  const message = res?.choices?.[0]?.message
  const args = message?.tool_calls?.[0]?.function?.arguments
  // 优先取工具调用参数；部分模型可能直接返回 JSON 文本，作为兜底
  return args ?? message?.content ?? null
}

/**
 * 流式：SSE 逐字输出（Day 11–12 会用到）
 * - 用 Fetch + ReadableStream 读取
 * - 传入 AbortSignal 即可支持「中断生成」
 */
export async function chatStream(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
    signal
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) onDelta(delta)
      } catch {
        // 忽略无法解析的行
      }
    }
  }
}
