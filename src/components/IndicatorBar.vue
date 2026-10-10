<script setup lang="ts">
import StatIndicator from '@/components/StatIndicator.vue'
import { indicators } from '@/config/dashboard'
</script>

<template>
  <footer class="footer">
    <StatIndicator v-for="it in indicators" :key="it.label" v-bind="it" />
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
