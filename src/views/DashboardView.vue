<script setup lang="ts">
// Day3 组件化：视图只做「组装」，具体图表与数据都在各自组件 / 配置里
import LeftPanel from '@/components/LeftPanel.vue'
import CenterPanel from '@/components/CenterPanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import IndicatorBar from '@/components/IndicatorBar.vue'
</script>

<template>
  <LeftPanel />
  <CenterPanel />
  <RightPanel />
  <IndicatorBar />
</template>
