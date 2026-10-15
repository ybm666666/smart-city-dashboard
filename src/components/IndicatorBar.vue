<script setup lang="ts">
import { storeToRefs } from 'pinia'
import StatIndicator from '@/components/StatIndicator.vue'
import { useDashboardStore } from '@/stores/dashboard'

// Day7：底部指标改为消费 Pinia 中的实时数据（原静态配置已迁到数据层）
const store = useDashboardStore()
const { indicatorList } = storeToRefs(store)
</script>

<template>
  <footer class="footer">
    <StatIndicator v-for="it in indicatorList" :key="it.label" v-bind="it" />
  </footer>
</template>

<style scoped>
.footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  padding: 15px 40px;
  background: rgba(0, 50, 100, 0.2);
  border-top: 1px solid rgba(0, 150, 255, 0.3);
}
</style>
