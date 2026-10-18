<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import MapChart from '@/components/MapChart.vue'
import StatIndicator from '@/components/StatIndicator.vue'
import { CHONGQING_MAP, districtStats } from '@/config/mapData'
import type { ChartConfig, NameValue } from '@/types'

/**
 * Day6：地图联动演示页
 *
 * - 左侧：重庆市区县热力图，支持指标切换（GDP / 人口 / 综合指数）
 * - 右侧：点击地图区县 → 联动展示该区县详情（指标 + 三次产业结构）
 */
type MetricKey = 'gdp' | 'population' | 'index'

const metrics: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'gdp', label: 'GDP', unit: '亿元' },
  { key: 'population', label: '常住人口', unit: '万人' },
  { key: 'index', label: '综合指数', unit: '' }
]

const metric = ref<MetricKey>('gdp')
const selected = ref(districtStats[0])

const values = computed<NameValue[]>(() =>
  districtStats.map((d) => ({ name: d.name, value: d[metric.value] }))
)

const range = computed(() => {
  const nums = values.value.map((v) => v.value)
  return { min: Math.min(...nums), max: Math.max(...nums) }
})

const mapConfig = computed<ChartConfig>(() => ({
  type: 'map',
  title: '重庆市各区县热力分布',
  mapName: CHONGQING_MAP.name,
  mapUrl: CHONGQING_MAP.url,
  mapData: values.value,
  visualMap: { min: range.value.min, max: range.value.max }
}))

const detailConfig = computed<ChartConfig>(() => ({
  type: 'pie',
  data: [
    { name: '第一产业', value: selected.value.industry[0] },
    { name: '第二产业', value: selected.value.industry[1] },
    { name: '第三产业', value: selected.value.industry[2] }
  ]
}))

function onSelect(name: string) {
  const hit = districtStats.find((d) => d.name === name)
  if (hit) selected.value = hit
}
</script>

<template>
  <section class="panel map-panel">
    <ChartPanel title="重庆市地图（点击区县联动右侧）">
      <div class="tools">
        <button
          v-for="m in metrics"
          :key="m.key"
          :class="{ active: metric === m.key }"
          @click="metric = m.key"
        >
          {{ m.label }}
        </button>
      </div>
      <MapChart :config="mapConfig" @select="onSelect" />
    </ChartPanel>
  </section>

  <section class="panel detail-panel">
    <ChartPanel :title="`${selected.name} · 区县详情`">
      <div class="stats">
        <StatIndicator label="GDP" :value="selected.gdp" unit="亿元" />
        <StatIndicator label="常住人口" :value="selected.population" unit="万人" />
        <StatIndicator label="综合指数" :value="selected.index" />
      </div>
      <ConfigChart :config="detailConfig" />
    </ChartPanel>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.map-panel {
  flex: 1.6;
}
.detail-panel {
  flex: 1;
}
.tools {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.tools button {
  padding: 4px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-surface-panel-strong);
  border: 1px solid var(--color-blue-a30);
  border-radius: 4px;
  cursor: pointer;
}
.tools button.active {
  color: var(--color-bg-base);
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}
</style>
