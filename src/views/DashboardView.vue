<script setup lang="ts">
import { ref } from 'vue'
import BaseChart from '@/components/BaseChart.vue'
import ChartPanel from '@/components/ChartPanel.vue'
import StatIndicator from '@/components/StatIndicator.vue'
import { buildOption } from '@/config/charts'

// 先用静态数据跑通，Day7 会改为由 Pinia + 请求层驱动
const gdpOption = ref(
  buildOption('line', {
    xAxis: ['2019', '2020', '2021', '2022', '2023', '2024'],
    series: [2.36, 2.5, 2.78, 2.92, 3.01, 3.15]
  })
)
const industryOption = ref(
  buildOption('pie', {
    data: [
      { value: 42, name: '电子信息' },
      { value: 28, name: '汽车制造' },
      { value: 18, name: '智能装备' },
      { value: 12, name: '新材料' }
    ]
  })
)
// 右侧两张图改为各自独立的数据，避免与 GDP 折线重复（原为占位）
const populationOption = ref(
  buildOption('bar', {
    xAxis: ['渝中', '江北', '渝北', '沙坪坝', '九龙坡', '南岸'],
    series: [57, 92, 220, 148, 121, 96]
  })
)
const trafficOption = ref(
  buildOption('line', {
    xAxis: ['07:00', '09:00', '11:00', '13:00', '17:00', '19:00', '21:00'],
    series: [1.2, 2.8, 1.6, 1.1, 3.0, 2.4, 1.5]
  })
)

const indicators = [
  { label: '智慧城市覆盖率', value: 87.5, unit: '%', decimals: 1 },
  { label: 'IoT设备接入数', value: 128, unit: '万' },
  { label: '数据中心PUE', value: 1.25, decimals: 2 },
  { label: '5G基站数', value: 8.6, unit: '万', decimals: 1 }
]
</script>

<template>
  <section class="panel side">
    <ChartPanel title="GDP增长趋势">
      <BaseChart :option="gdpOption" />
    </ChartPanel>
    <ChartPanel title="产业结构分布">
      <BaseChart :option="industryOption" />
    </ChartPanel>
  </section>

  <section class="panel center">
    <ChartPanel title="重庆市区域数据（Day5 通用图表 / Day6 自适应演示）">
      <div class="placeholder">
        <p>这里将放置配置驱动的通用图表组件（地图 / 柱状 / 折线 …）</p>
      </div>
    </ChartPanel>
  </section>

  <section class="panel side">
    <ChartPanel title="常住人口统计（万人）">
      <BaseChart :option="populationOption" />
    </ChartPanel>
    <ChartPanel title="交通运行指数">
      <BaseChart :option="trafficOption" />
    </ChartPanel>
  </section>

  <footer class="footer">
    <StatIndicator
      v-for="it in indicators"
      :key="it.label"
      v-bind="it"
    />
  </footer>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.side {
  flex: 1;
}
.center {
  flex: 1.5;
}
.placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a7a9e;
  font-size: 14px;
}
.footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  padding: 15px 40px;
  background: rgba(0, 50, 100, 0.2);
  border-top: 1px solid rgba(0, 150, 255, 0.3);
}
</style>
