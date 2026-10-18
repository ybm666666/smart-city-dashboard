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
// Day12-hotfix：height 默认改为像素值。
// 原因：外层 flex 链路高度是 auto 派生，`height: 100%` 无法解析出确定高度，
// ECharts 初始化时容器高度塌陷，地图被压成一条细带。像素高度可确定性生效。
const props = withDefaults(defineProps<Props>(), { height: '360px' })

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
      <p class="hint">
        地图数据为本地内置文件（<code>public/geojson/chongqing.json</code>），
        若仍失败请检查该文件是否随构建产物一起发布
      </p>
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
  /* Day12-hotfix：百分比高度在 flex 链上可能塌陷为极小值，
     导致地图被压成一条细带；给一个最小高度兜底，保证绘图区域充足 */
  min-height: 320px;
}
.map-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.map-state.error {
  color: var(--color-danger);
}
.map-state .hint {
  font-size: 12px;
  color: var(--color-text-subtle);
}
</style>
