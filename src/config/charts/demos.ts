import type { ChartConfig } from '@/types'

// Day5：配置驱动通用图表组件示例
// 每份配置只描述「类型 + 数据」，渲染完全交给 ConfigChart → buildOption
export interface ChartDemo {
  key: string
  title: string
  config: ChartConfig
}

export const chartDemos: ChartDemo[] = [
  {
    key: 'line',
    title: '折线图 · GDP 趋势（万亿元）',
    config: {
      type: 'line',
      xAxis: ['2019', '2020', '2021', '2022', '2023', '2024'],
      series: [2.36, 2.5, 2.78, 2.92, 3.01, 3.15]
    }
  },
  {
    key: 'bar',
    title: '柱状图 · 区县数据',
    config: {
      type: 'bar',
      xAxis: ['渝北', '九龙坡', '渝中', '江北', '沙坪坝', '南岸'],
      series: [220, 148, 121, 96, 92, 78]
    }
  },
  {
    key: 'pie',
    title: '饼图 · 产业结构占比',
    config: {
      type: 'pie',
      data: [
        { value: 42, name: '电子信息' },
        { value: 28, name: '汽车制造' },
        { value: 18, name: '智能装备' },
        { value: 12, name: '新材料' }
      ]
    }
  },
  {
    key: 'scatter',
    title: '散点图 · 区域数据分布',
    config: {
      type: 'scatter',
      xAxis: ['渝北', '九龙坡', '渝中', '江北', '沙坪坝', '南岸'],
      series: [220, 148, 121, 96, 92, 78]
    }
  },
  {
    key: 'gauge',
    title: '仪表盘 · 智慧城市覆盖率',
    config: {
      type: 'gauge',
      gauge: { value: 87.5, max: 100, unit: '%' }
    }
  },
  {
    key: 'radar',
    title: '雷达图 · 城市能力评估',
    config: {
      type: 'radar',
      indicators: [
        { name: '交通', max: 100 },
        { name: '环保', max: 100 },
        { name: '医疗', max: 100 },
        { name: '教育', max: 100 },
        { name: '安全', max: 100 }
      ],
      radarData: [85, 72, 90, 78, 88]
    }
  },
  {
    key: 'funnel',
    title: '漏斗图 · 政务服务转化',
    config: {
      type: 'funnel',
      data: [
        { value: 100, name: '访问' },
        { value: 78, name: '注册' },
        { value: 52, name: '实名' },
        { value: 30, name: '办件' },
        { value: 12, name: '结办' }
      ]
    }
  }
]
