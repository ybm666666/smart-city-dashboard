<script setup lang="ts">
// Day3 组件化：视图只做「组装」，具体图表与数据都在各自组件 / 配置里
// Day7：视图挂载时触发数据加载（Pinia + 请求层），并统一处理加载 / 错误 / 空态
import { onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import LeftPanel from '@/components/LeftPanel.vue'
import CenterPanel from '@/components/CenterPanel.vue'
import RightPanel from '@/components/RightPanel.vue'
import RealTimePanel from '@/components/RealTimePanel.vue'
import IndicatorBar from '@/components/IndicatorBar.vue'
import PanelState from '@/components/PanelState.vue'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const { loading, error, empty } = storeToRefs(store)

// 进入大屏即拉取数据；离开时停止实时轮询，避免定时器泄漏
onMounted(() => store.loadDashboard())
onBeforeUnmount(() => store.stopRealtime())
</script>

<template>
  <!-- Day7：整屏数据三态 —— 加载中 / 加载失败（可重试）/ 空数据 -->
  <PanelState v-if="loading" class="full" loading />
  <PanelState v-else-if="error" class="full" :error="error" @retry="store.retry()" />
  <PanelState
    v-else-if="empty"
    class="full"
    empty
    empty-text="暂无大屏数据"
    @retry="store.retry()"
  />
  <template v-else>
    <LeftPanel />
    <CenterPanel />
    <RightPanel />
    <RealTimePanel />
    <IndicatorBar />
  </template>
</template>

<style scoped>
.full {
  flex: 1;
}
</style>
