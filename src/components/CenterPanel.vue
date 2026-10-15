<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useDashboardStore } from '@/stores/dashboard'

// Day7：数据来自 Pinia（请求层注入）
const store = useDashboardStore()
const { regionConfig } = storeToRefs(store)
</script>

<template>
  <section class="panel center">
    <ChartPanel title="重庆市各区县数据总览">
      <PanelState :empty="!regionConfig">
        <ConfigChart v-if="regionConfig" :config="regionConfig" />
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
.center {
  flex: 1.5;
}
</style>
