<script setup lang="ts">
interface Props {
  title: string
}
defineProps<Props>()
</script>

<template>
  <!-- 图表卡片外壳：科技感边框 + 标题，内容用插槽 -->
  <div class="chart-box">
    <h3>{{ title }}</h3>
    <div class="chart-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chart-box {
  background: rgba(0, 50, 100, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-height: 180px;
}
.chart-box::before,
.chart-box::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
}
.chart-box::before {
  top: 0;
  left: 0;
  border-top: 2px solid #00d4ff;
  border-left: 2px solid #00d4ff;
}
.chart-box::after {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid #00d4ff;
  border-right: 2px solid #00d4ff;
}
h3 {
  font-size: 14px;
  color: #00d4ff;
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid #00d4ff;
}
.chart-body {
  flex: 1;
  min-height: 0;
}
</style>
