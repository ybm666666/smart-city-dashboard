<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from '@/components/BaseChart.vue'
import { buildOption } from '@/config/charts'
import { CHONGQING_MAP } from '@/config/mapData'
import { useMap } from '@/hooks/useMap'
import type { ChartConfig } from '@/types'

/**
 * Day6：地图组件
 *
 * 流程：useMap 异步加载并注册 GeoJSON → 注册完成后用 buildOption('map', config)
 * 生成 ECharts option → 交给 BaseChart 渲染（热力 / visualMap）。
 * 地图点击通过 BaseChart 冒泡的 chart-click 事件，转成 select(name) 供联动使用。
 */
interface Props {
  config: ChartConfig
  height?: string
}
const props = withDefaults(defineProps<Props>(), { height: '100%' })

const emit = defineEmits<{ (e: 'select', name: string): void }>()

const mapName = props.config.mapName || CHONGQING_MAP.name
const mapUrl = props.config.mapUrl || CHONGQING_MAP.url

const { ready, pending, error } = useMap(mapName, mapUrl)

const option = computed(() => buildOption('map', { ...props.config, mapName }))

function onChartClick(params: { name?: string }) {
  if (params && typeof params.name === 'string' && params.name) {
    emit('select', params.name)
  }
}
</script>

<template>
  <div class="map-chart" :style="{ height }">
    <div v-if="pending" class="map-state">地图数据加载中…</div>
    <div v-else-if="error" class="map-state error">
      <p>地图加载失败：{{ error }}</p>
      <p class="hint">请检查网络，或替换 GeoJSON 地址（默认使用阿里云 DataV.GeoAtlas）</p>
    </div>
    <BaseChart
      v-else-if="ready"
      :option="option"
      :height="height"
      @chart-click="onChartClick"
    />
  </div>
</template>

<style scoped>
.map-chart {
  width: 100%;
}
.map-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #7eb8d8;
  font-size: 13px;
}
.map-state.error {
  color: #ff8a8a;
}
.map-state .hint {
  font-size: 12px;
  color: #5b7f9c;
}
</style>
