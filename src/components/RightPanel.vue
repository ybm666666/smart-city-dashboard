<script setup lang="ts">
import BaseChart from '@/components/BaseChart.vue'
import ChartPanel from '@/components/ChartPanel.vue'
import { populationOption, trafficOption } from '@/config/dashboard'
</script>

<template>
  <section class="panel side">
    <ChartPanel title="常住人口统计（万人）">
      <BaseChart :option="populationOption" />
    </ChartPanel>
    <ChartPanel title="交通运行指数">
      <BaseChart :option="trafficOption" />
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
