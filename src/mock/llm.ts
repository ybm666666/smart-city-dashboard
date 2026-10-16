import type { ChartConfig, ChartType } from '@/types'
import { appendPoint, changeType, removeLast, setTitle } from '@/utils/chartOps'

/**
 * Day8：内置「出图」Mock
 *
 * 当没有配置有效的大模型 API Key（或显式开启 `VITE_USE_MOCK_LLM`）时，
 * 用一套基于关键词的规则把自然语言映射成图表配置，保证「无 Key 也能演示出图流程」。
 * 接入真实大模型后，走 api/llm.ts 的 Function Calling，本文件不再参与。
 *
 * Day9：补充 `mockRefine` —— 在既有图表上按指令做本地微调（改标题 / 换类型 / 增删数据）。
 */
const AREA = ['渝中', '江北', '渝北', '沙坪坝', '九龙坡', '南岸']
const AREA_VALUE = [57, 92, 220, 148, 121, 96]
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月']
const MONTH_VALUE = [120, 150, 132, 180, 210, 196]

export function mockChartFromPrompt(prompt: string): ChartConfig {
  const p = prompt || ''
  const title = p.length > 18 ? `${p.slice(0, 18)}…` : p || 'AI 生成图表'

  // 饼图：占比 / 构成 / 比例 / 份额
  if (/饼|占比|构成|比例|份额/.test(p)) {
    return {
      type: 'pie',
      title,
      data: [
        { value: 42, name: '电子信息' },
        { value: 28, name: '汽车制造' },
        { value: 18, name: '智能装备' },
        { value: 12, name: '新材料' }
      ]
    }
  }
  // 漏斗图：转化 / 流程
  if (/漏斗|转化|流程|留存/.test(p)) {
    return {
      type: 'funnel',
      title,
      data: [
        { value: 100, name: '访问' },
        { value: 78, name: '注册' },
        { value: 52, name: '实名' },
        { value: 30, name: '办件' },
        { value: 12, name: '结办' }
      ]
    }
  }
  // 雷达图：能力 / 多维 / 评估
  if (/雷达|能力|多维|评估/.test(p)) {
    return {
      type: 'radar',
      title,
      indicators: [
        { name: '交通', max: 100 },
        { name: '环保', max: 100 },
        { name: '医疗', max: 100 },
        { name: '教育', max: 100 },
        { name: '安全', max: 100 }
      ],
      radarData: [85, 72, 90, 78, 88]
    }
  }
  // 仪表盘：进度 / 完成率 / 覆盖率 / 达标
  if (/仪表|进度|完成率|覆盖率|达标/.test(p)) {
    return { type: 'gauge', title, gauge: { value: 87.5, max: 100, unit: '%' } }
  }
  // 散点图：相关性 / 分布
  if (/散点|相关性|分布/.test(p)) {
    return { type: 'scatter', title, xAxis: AREA, series: AREA_VALUE }
  }
  // 柱状图：柱 / 条形 / 排名 / 对比
  if (/柱|条形|排名|对比/.test(p)) {
    return { type: 'bar', title, xAxis: AREA, series: AREA_VALUE }
  }
  // 默认折线图：趋势
  return { type: 'line', title, xAxis: MONTHS, series: MONTH_VALUE }
}

const TYPE_KEYWORDS: [RegExp, ChartType][] = [
  [/折线/, 'line'],
  [/柱状|柱形|条形/, 'bar'],
  [/饼/, 'pie'],
  [/散点/, 'scatter'],
  [/仪表/, 'gauge'],
  [/雷达/, 'radar'],
  [/漏斗/, 'funnel']
]

/**
 * Day9：本地微调 Mock —— 把「修改指令」映射为对当前图表的确定性改动。
 * 顺序：改标题 → 换类型 → 追加数据 → 删除数据 → 兜底（把整句作为新标题）。
 */
export function mockRefine(current: ChartConfig, instruction: string): ChartConfig {
  const p = instruction || ''

  // 改标题：匹配「标题/改成/改为/换成/设为 + 内容」
  const titleMatch = p.match(/(?:标题|title)\s*(?:改成|改为|换成|设为|:|：|为)?\s*["“「]?([^"”」]+)["”」]?/i)
  if (titleMatch && titleMatch[1]) return setTitle(current, titleMatch[1].trim())

  // 换类型
  for (const [re, type] of TYPE_KEYWORDS) {
    if (re.test(p)) return changeType(current, type)
  }

  // 追加数据点
  if (/追加|增加|再加|添加|新增/.test(p)) return appendPoint(current)

  // 删除末项
  if (/删除|删掉|去掉|移除|减少/.test(p)) return removeLast(current)

  // 兜底：把整句作为新标题
  return setTitle(current, p.slice(0, 18))
}
import type { ChartConfig } from '@/types'

/**
 * Day8：内置「出图」Mock
 *
 * 当没有配置有效的大模型 API Key（或显式开启 `VITE_USE_MOCK_LLM`）时，
 * 用一套基于关键词的规则把自然语言映射成图表配置，保证「无 Key 也能演示出图流程」。
 * 接入真实大模型后，走 api/llm.ts 的 Function Calling，本文件不再参与。
 */
const AREA = ['渝中', '江北', '渝北', '沙坪坝', '九龙坡', '南岸']
const AREA_VALUE = [57, 92, 220, 148, 121, 96]
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月']
const MONTH_VALUE = [120, 150, 132, 180, 210, 196]

export function mockChartFromPrompt(prompt: string): ChartConfig {
  const p = prompt || ''
  const title = p.length > 18 ? `${p.slice(0, 18)}…` : p || 'AI 生成图表'

  // 饼图：占比 / 构成 / 比例 / 份额
  if (/饼|占比|构成|比例|份额/.test(p)) {
    return {
      type: 'pie',
      title,
      data: [
        { value: 42, name: '电子信息' },
        { value: 28, name: '汽车制造' },
        { value: 18, name: '智能装备' },
        { value: 12, name: '新材料' }
      ]
    }
  }
  // 漏斗图：转化 / 流程
  if (/漏斗|转化|流程|留存/.test(p)) {
    return {
      type: 'funnel',
      title,
      data: [
        { value: 100, name: '访问' },
        { value: 78, name: '注册' },
        { value: 52, name: '实名' },
        { value: 30, name: '办件' },
        { value: 12, name: '结办' }
      ]
    }
  }
  // 雷达图：能力 / 多维 / 评估
  if (/雷达|能力|多维|评估/.test(p)) {
    return {
      type: 'radar',
      title,
      indicators: [
        { name: '交通', max: 100 },
        { name: '环保', max: 100 },
        { name: '医疗', max: 100 },
        { name: '教育', max: 100 },
        { name: '安全', max: 100 }
      ],
      radarData: [85, 72, 90, 78, 88]
    }
  }
  // 仪表盘：进度 / 完成率 / 覆盖率 / 达标
  if (/仪表|进度|完成率|覆盖率|达标/.test(p)) {
    return { type: 'gauge', title, gauge: { value: 87.5, max: 100, unit: '%' } }
  }
  // 散点图：相关性 / 分布
  if (/散点|相关性|分布/.test(p)) {
    return { type: 'scatter', title, xAxis: AREA, series: AREA_VALUE }
  }
  // 柱状图：柱 / 条形 / 排名 / 对比
  if (/柱|条形|排名|对比/.test(p)) {
    return { type: 'bar', title, xAxis: AREA, series: AREA_VALUE }
  }
  // 默认折线图：趋势
  return { type: 'line', title, xAxis: MONTHS, series: MONTH_VALUE }
}
