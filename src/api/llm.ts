import type { ChatMessage } from '@/types'
import { post } from './http'

const BASE_URL = import.meta.env.VITE_LLM_BASE_URL
const API_KEY = import.meta.env.VITE_LLM_API_KEY
const MODEL = import.meta.env.VITE_LLM_MODEL || 'deepseek-chat'

// 非流式：普通对话（Day 8–10 的 AI 出图会用它 + Function Calling）
export function chatCompletion(messages: ChatMessage[]) {
  return post<{ choices: { message: ChatMessage }[] }>(
    `${BASE_URL}/chat/completions`,
    { model: MODEL, messages }
  )
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
