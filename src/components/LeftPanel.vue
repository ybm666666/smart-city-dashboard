<script setup lang="ts">
import BaseChart from '@/components/BaseChart.vue'
import ChartPanel from '@/components/ChartPanel.vue'
import { gdpOption, industryOption } from '@/config/dashboard'
</script>

<template>
  <section class="panel side">
    <ChartPanel title="GDP增长趋势（万亿元）">
      <BaseChart :option="gdpOption" />
    </ChartPanel>
    <ChartPanel title="产业结构分布">
      <BaseChart :option="industryOption" />
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
