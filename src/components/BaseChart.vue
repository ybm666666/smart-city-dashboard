<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useEcharts, type ChartOption } from '@/hooks/useEcharts'

interface Props {
  option: ChartOption
  height?: string
}
const props = withDefaults(defineProps<Props>(), { height: '100%' })

const el = ref<HTMLElement>()
const optionRef = toRef(props, 'option') as unknown as import('vue').Ref<ChartOption>
useEcharts(el, optionRef)
</script>

<template>
  <div ref="el" class="base-chart" :style="{ height }"></div>
</template>

<style scoped>
.base-chart {
  width: 100%;
}
</style>
