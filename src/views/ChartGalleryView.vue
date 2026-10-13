<script setup lang="ts">
// Day5：图表图库 —— 用同一份「配置驱动通用图表组件」渲染 6+ 类型，验证组件通用性
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import { chartDemos } from '@/config/charts/demos'
</script>

<template>
  <section class="gallery">
    <ChartPanel v-for="item in chartDemos" :key="item.key" :title="item.title">
      <ConfigChart :config="item.config" />
    </ChartPanel>
  </section>
</template>

<style scoped>
.gallery {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 20px;
  min-height: 0;
}
</style>
