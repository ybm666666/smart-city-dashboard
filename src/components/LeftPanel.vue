<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useDashboardStore } from '@/stores/dashboard'

// Day7：数据来自 Pinia（请求层注入），配置驱动渲染交给 ConfigChart（内部 buildOption）
const store = useDashboardStore()
const { gdpConfig, industryConfig } = storeToRefs(store)
</script>

<template>
  <section class="panel side">
    <ChartPanel title="GDP增长趋势（万亿元）">
      <PanelState :empty="!gdpConfig">
        <ConfigChart v-if="gdpConfig" :config="gdpConfig" />
      </PanelState>
    </ChartPanel>
    <ChartPanel title="产业结构分布">
      <PanelState :empty="!industryConfig">
        <ConfigChart v-if="industryConfig" :config="industryConfig" />
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
