<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import BaseChart from '@/components/BaseChart.vue'
import { buildOption } from '@/config/charts'
import { useDashboardStore } from '@/stores/dashboard'

/**
 * Day7：dataset 增量更新演示
 *
 * Pinia 维护一个滚动窗口的实时数据点，这里把「表头 + 数据点」组成
 * 二维 dataset 交给 buildOption，用 dataset + encode 渲染折线图。
 * 数据点变化时仅增量更新 dataset（配合 useEcharts 的 lazyUpdate）。
 */
const store = useDashboardStore()
const { realtime } = storeToRefs(store)

onMounted(() => store.startRealtime(1500))

const option = computed(() =>
  buildOption('line', {
    dataset: [['时间', '吞吐'], ...realtime.value.map((p) => [p.time, p.value])]
  })
)
</script>

<template>
  <section class="panel side">
    <ChartPanel title="实时数据流（dataset 增量更新）">
      <BaseChart :option="option" />
    </ChartPanel>
  </section>
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
</style>
