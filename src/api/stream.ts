import { chatStream, useMockLlm } from './llm'
import type { ChartConfig, ChatMessage } from '@/types'

/**
 * Day11：助手回复的流式输出
 *
 * - 真实模式：走 `chatStream`（SSE，Fetch + ReadableStream）
 * - Mock 模式：本地按句块「打字机」式吐字，保证无 Key 时也能演示流式体验
 * - 统一支持 AbortSignal → 视图层可随时「中断生成」
 */

/** 按标点/换行切块，模拟模型的自然吐字节奏 */
function chunkify(text: string, size = 3): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

const TYPE_LABEL: Record<string, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  scatter: '散点图',
  radar: '雷达图',
  funnel: '漏斗图',
  gauge: '仪表盘'
}

/** 由图表配置生成一段结构化说明（Markdown），用于 Mock 流式演示 */
export function buildMockReply(prompt: string, chart?: ChartConfig | null): string {
  const type = chart ? TYPE_LABEL[chart.type] ?? chart.type : '图表'
  const title = chart?.title || '未命名图表'
  const count = chart?.series?.length ?? 0
  // series 元素可能是数字或数字数组（多系列），两种形态都要能取长度
  const first = chart?.series?.[0]
  const points = Array.isArray(first)
    ? first.length
    : chart?.data?.length ?? (typeof first === 'number' ? 1 : 0)

  return [
    `### 已生成${type}：${title}`,
    '',
    `你的需求是「${prompt}」，我据此生成了上面的图表。`,
    '',
    '**图表要点**',
    '',
    `- 类型：${type}`,
    `- 系列数：${count} 个`,
    `- 数据点：${points} 个`,
    '',
    '**下一步可以做**',
    '',
    '1. 在右侧「微调」栏直接改标题、换类型或增删数据',
    '2. 继续对话让我调整数据或换一种呈现方式',
    '3. 点击「停止」可随时中断本次输出',
    '',
    '> 提示：当前为演示模式，配置 API Key 后将由真实模型流式生成。'
  ].join('\n')
}

/**
 * 流式获取助手回复
 * @param prompt 用户本轮提问
 * @param chart  当前图表配置（用于生成上下文相关的说明）
 * @param onDelta 收到增量文本的回调
 * @param signal  中断信号
 */
export async function streamAssistantReply(
  prompt: string,
  chart: ChartConfig | null,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (useMockLlm()) {
    const full = buildMockReply(prompt, chart)
    for (const piece of chunkify(full, 3)) {
      await sleep(18, signal)
      onDelta(piece)
    }
    return
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是智慧城市数据可视化助手。请用简洁的 Markdown 说明刚生成的图表要点与可行的下一步。'
    },
    { role: 'user', content: prompt }
  ]
  await chatStream(messages, onDelta, signal)
}
