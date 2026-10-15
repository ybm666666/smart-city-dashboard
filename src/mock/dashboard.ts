import type { DashboardData } from '@/types'

/**
 * Day7：内置 Mock 数据
 *
 * Day3–Day6 大屏图表的数据原本以静态配置形式写死在 `config/dashboard.ts`，
 * Day7 起统一收敛到数据层：请求层在「无真实后端」时回退到这份 Mock，
 * 组件只消费 Pinia 中的 `DashboardData`，不再直接依赖静态配置。
 *
 * 接入真实后端后，把 `.env` 里的 `VITE_USE_MOCK` 设为 `false` 即可切到接口。
 */
export const MOCK_DASHBOARD: DashboardData = {
  // 左栏
  gdp: {
    type: 'line',
    xAxis: ['2019', '2020', '2021', '2022', '2023', '2024'],
    series: [2.36, 2.5, 2.78, 2.92, 3.01, 3.15]
  },
  industry: {
    type: 'pie',
    data: [
      { value: 42, name: '电子信息' },
      { value: 28, name: '汽车制造' },
      { value: 18, name: '智能装备' },
      { value: 12, name: '新材料' }
    ]
  },
  // 中栏（中心区）
  region: {
    type: 'bar',
    xAxis: ['渝北', '九龙坡', '渝中', '江北', '沙坪坝', '南岸', '巴南', '北碚'],
    series: [220, 148, 121, 96, 92, 78, 65, 52]
  },
  // 右栏
  population: {
    type: 'bar',
    xAxis: ['渝中', '江北', '渝北', '沙坪坝', '九龙坡', '南岸'],
    series: [57, 92, 220, 148, 121, 96]
  },
  traffic: {
    type: 'line',
    xAxis: ['07:00', '09:00', '11:00', '13:00', '17:00', '19:00', '21:00'],
    series: [1.2, 2.8, 1.6, 1.1, 3.0, 2.4, 1.5]
  },
  // 底部指标
  indicators: [
    { label: '智慧城市覆盖率', value: 87.5, unit: '%', decimals: 1 },
    { label: 'IoT设备接入数', value: 128, unit: '万' },
    { label: '数据中心PUE', value: 1.25, decimals: 2 },
    { label: '5G基站数', value: 8.6, unit: '万', decimals: 1 }
  ]
}
