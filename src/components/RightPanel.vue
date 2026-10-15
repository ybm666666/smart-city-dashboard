<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useDashboardStore } from '@/stores/dashboard'

// Day7：数据来自 Pinia（请求层注入）
const store = useDashboardStore()
const { populationConfig, trafficConfig } = storeToRefs(store)
</script>

<template>
  <section class="panel side">
    <ChartPanel title="常住人口统计（万人）">
      <PanelState :empty="!populationConfig">
        <ConfigChart v-if="populationConfig" :config="populationConfig" />
      </PanelState>
    </ChartPanel>
    <ChartPanel title="交通运行指数">
      <PanelState :empty="!trafficConfig">
        <ConfigChart v-if="trafficConfig" :config="trafficConfig" />
      </PanelState>
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
