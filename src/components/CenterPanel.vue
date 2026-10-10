<script setup lang="ts">
import BaseChart from '@/components/BaseChart.vue'
import ChartPanel from '@/components/ChartPanel.vue'
import { regionOption } from '@/config/dashboard'
</script>

<template>
  <section class="panel center">
    <ChartPanel title="重庆市各区县数据总览">
      <BaseChart :option="regionOption" />
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
