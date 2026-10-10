import type { ChartOption } from '@/hooks/useEcharts'
import { buildOption } from './charts'

/**
 * 大屏数据配置中心（Day3 组件化：把写死的图表数据从视图里抽离出来）
 * 现在用静态数据；Day7 会改为由 Pinia + 请求层注入。
 */

// 左栏
export const gdpOption: ChartOption = buildOption('line', {
  xAxis: ['2019', '2020', '2021', '2022', '2023', '2024'],
  series: [2.36, 2.5, 2.78, 2.92, 3.01, 3.15]
})

export const industryOption: ChartOption = buildOption('pie', {
  data: [
    { value: 42, name: '电子信息' },
    { value: 28, name: '汽车制造' },
    { value: 18, name: '智能装备' },
    { value: 12, name: '新材料' }
  ]
})

// 中栏（中心区）
export const regionOption: ChartOption = buildOption('bar', {
  xAxis: ['渝北', '九龙坡', '渝中', '江北', '沙坪坝', '南岸', '巴南', '北碚'],
  series: [220, 148, 121, 96, 92, 78, 65, 52]
})

// 右栏
export const populationOption: ChartOption = buildOption('bar', {
  xAxis: ['渝中', '江北', '渝北', '沙坪坝', '九龙坡', '南岸'],
  series: [57, 92, 220, 148, 121, 96]
})

export const trafficOption: ChartOption = buildOption('line', {
  xAxis: ['07:00', '09:00', '11:00', '13:00', '17:00', '19:00', '21:00'],
  series: [1.2, 2.8, 1.6, 1.1, 3.0, 2.4, 1.5]
})

// 底部指标
export interface Indicator {
  label: string
  value: number
  unit?: string
  decimals?: number
}

export const indicators: Indicator[] = [
  { label: '智慧城市覆盖率', value: 87.5, unit: '%', decimals: 1 },
  { label: 'IoT设备接入数', value: 128, unit: '万' },
  { label: '数据中心PUE', value: 1.25, decimals: 2 },
  { label: '5G基站数', value: 8.6, unit: '万', decimals: 1 }
]
