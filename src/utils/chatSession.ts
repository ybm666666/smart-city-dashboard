import type { ChartConfig, ChatMessage, ChatSession } from '@/types'

/**
 * Day10：AI 出图会话工具（纯函数 + 轻量持久化）
 *
 * 把「一次对话 + 它产出的图表」封装成可新建 / 重命名 / 清空 / 删除的会话，
 * 不依赖 Vue / Pinia，便于测试与复用；持久化只做最薄的 localStorage 读写。
 */
export const STORAGE_KEY = 'smart-city-ai-sessions'
export const MAX_SESSIONS = 20
export const DEFAULT_TITLE = '新对话'

let seq = 0

/** 生成会话 id（时间戳 + 自增，避免同毫秒冲突） */
export function createId(prefix = 'chat'): string {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`
}

/** 新建一个空会话 */
export function createSession(title = DEFAULT_TITLE): ChatSession {
  const now = Date.now()
  return {
    id: createId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    chartConfig: null,
    usedFallback: false
  }
}

/** 由提问文本推导会话标题（压缩空白、超长截断） */
export function deriveTitle(text: string, max = 16): string {
  const t = (text || '').trim().replace(/\s+/g, ' ')
  if (!t) return DEFAULT_TITLE
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/** 判断是否还是系统默认标题（用户没手动改过名） */
export function isDefaultTitle(title: string): boolean {
  const t = (title || '').trim()
  return t === '' || t === DEFAULT_TITLE || /^新对话\s*\d+$/.test(t)
}

/** 重命名归一化：空白输入回落默认标题；超长截断 */
export function normalizeTitle(title: string, max = 20): string {
  const t = (title || '').trim().replace(/\s+/g, ' ')
  if (!t) return DEFAULT_TITLE
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/** 追加一条消息（补时间戳） */
export function appendMessage(session: ChatSession, message: ChatMessage): ChatSession {
  return {
    ...session,
    messages: [...session.messages, { ...message, createdAt: message.createdAt ?? Date.now() }],
    updatedAt: Date.now()
  }
}

/** 会话内最近 N 条消息（多轮上下文用） */
export function recentMessages(session: ChatSession, limit = 12): ChatMessage[] {
  return session.messages.slice(-limit)
}

/** 按更新时间倒序（最近活跃的排前面） */
export function sortSessions(list: ChatSession[]): ChatSession[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

/** 裁剪会话数量，超出上限丢弃最旧的 */
export function trimSessions(list: ChatSession[], max = MAX_SESSIONS): ChatSession[] {
  return sortSessions(list).slice(0, max)
}

// ---------- 持久化（localStorage） ----------

function isMessage(v: unknown): v is ChatMessage {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    (o.role === 'user' || o.role === 'assistant' || o.role === 'system') &&
    typeof o.content === 'string'
  )
}

/**
 * 反序列化持久化数据：localStorage 属不可信来源，逐字段校验，
 * 非法数据直接丢弃，保证「脏数据不进 store」。
 */
export function parseSessions(raw: unknown): ChatSession[] {
  if (!Array.isArray(raw)) return []
  const out: ChatSession[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id) continue
    const messages = Array.isArray(o.messages) ? o.messages.filter(isMessage) : []
    const createdAt = typeof o.createdAt === 'number' ? o.createdAt : Date.now()
    out.push({
      id: o.id,
      title: typeof o.title === 'string' && o.title ? o.title : DEFAULT_TITLE,
      createdAt,
      updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : createdAt,
      messages,
      chartConfig: (o.chartConfig as ChartConfig | null) ?? null,
      usedFallback: o.usedFallback === true
    })
  }
  return trimSessions(out)
}

/** 读取本地会话（无数据 / 解析失败都返回空数组） */
export function loadSessions(): ChatSession[] {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return []
    return parseSessions(JSON.parse(text))
  } catch {
    return []
  }
}

/** 写入本地会话（存储不可用 / 超配额时静默失败，降级为「仅内存」） */
export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimSessions(sessions)))
  } catch {
    // 隐私模式或超配额：忽略
  }
}

/** 清空本地会话 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略
  }
}
