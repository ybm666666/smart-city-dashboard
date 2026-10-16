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
