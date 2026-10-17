/**
 * Day11：轻量级 Markdown 渲染（零依赖）
 *
 * 为什么自己写：
 * - 助手回复多为「标题 / 列表 / 行内代码 / 加粗」这类简单结构，引入 marked + DOMPurify
 *   会显著增加包体，而本项目只需要一个可控的小子集；
 * - 自己实现可以先做 HTML 转义再渲染，从根上避免 XSS。
 *
 * 支持：标题(#1-6)、无序/有序列表、引用、水平线、围栏代码块、行内代码、
 *      加粗、斜体、删除线、链接（仅 http/https/相对路径）。
 * 安全：全程先转义 < > & " '，链接 href 做协议白名单过滤。
 */

/** HTML 转义：渲染前必须执行 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 链接协议白名单：只允许 http/https/mailto 与站内相对路径，阻断 javascript: */
function safeUrl(url: string): string | null {
  const u = url.trim()
  if (/^(https?:\/\/|mailto:|\/|#|\.\/|\.\.\/)/i.test(u)) return u
  // 形如 example.com/path 的裸域名也放行
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(u)) return `https://${u}`
  return null
}

/** 行内元素渲染（输入必须已转义） */
function renderInline(escaped: string): string {
  let out = escaped

  // 行内代码优先，避免其中的 * _ 被当作强调符号
  const codes: string[] = []
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(`<code>${code}</code>`)
    return `\u0000CODE${codes.length - 1}\u0000`
  })

  // 链接 [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, url: string) => {
    const href = safeUrl(url)
    if (!href) return m
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  })

  // 加粗 / 斜体 / 删除线
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 还原行内代码
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? '')
  return out
}

/**
 * 主入口：Markdown 文本 → 安全 HTML
 * @param src 原始 Markdown（可含未转义字符）
 */
export function renderMarkdown(src: string): string {
  if (!src) return ''

  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // 围栏代码块 ```
    if (/^\s*```/.test(line)) {
      const lang = line.replace(/^\s*```/, '').trim()
      const buf: string[] = []
      i += 1
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        buf.push(lines[i])
        i += 1
      }
      i += 1 // 跳过结尾 ```
      const cls = lang ? ` class="lang-${escapeHtml(lang)}"` : ''
      html.push(`<pre><code${cls}>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    // 空行
    if (!line.trim()) {
      i += 1
      continue
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(escapeHtml(heading[2].trim()))}</h${level}>`)
      i += 1
      continue
    }

    // 水平线
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      html.push('<hr />')
      i += 1
      continue
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      html.push(`<blockquote>${renderInline(escapeHtml(buf.join(' ')))}</blockquote>`)
      continue
    }

    // 无序列表
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''))
        i += 1
      }
      html.push(
        `<ul>${items.map((t) => `<li>${renderInline(escapeHtml(t))}</li>`).join('')}</ul>`
      )
      continue
    }

    // 有序列表
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i += 1
      }
      html.push(
        `<ol>${items.map((t) => `<li>${renderInline(escapeHtml(t))}</li>`).join('')}</ol>`
      )
      continue
    }

    // 普通段落：吸收连续非空行
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{1,6}\s|```|[-*+]\s|\d+\.\s|>)/.test(lines[i])
    ) {
      buf.push(lines[i].trim())
      i += 1
    }
    html.push(`<p>${renderInline(escapeHtml(buf.join(' ')))}</p>`)
  }

  return html.join('\n')
}

/** 纯文本摘要（用于列表预览、标题截断等场景） */
export function toPlainText(src: string, max = 60): string {
  const t = (src || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}
