<script setup lang="ts">
import { ref } from 'vue'
import type { ChatMessage } from '@/types'

// Day 11–12 会接入 SSE 流式对话；此处先放占位骨架
const messages = ref<ChatMessage[]>([])
const input = ref('')

function send() {
  if (!input.value.trim()) return
  messages.value.push({ role: 'user', content: input.value })
  input.value = ''
}
</script>

<template>
  <section class="panel chat">
    <ChartPanel title="AI 对话（Day 11–12 接入 SSE 流式输出）">
      <div class="chat-body">
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
          {{ m.content }}
        </div>
      </div>
    </ChartPanel>
    <div class="input-bar">
      <input v-model="input" placeholder="用一句话描述你想看的图表…" @keyup.enter="send" />
      <button @click="send">发送</button>
    </div>
  </section>
</template>

<script lang="ts">
import ChartPanel from '@/components/ChartPanel.vue'
export default { components: { ChartPanel } }
</script>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-body {
  height: 100%;
  overflow-y: auto;
}
.msg {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  max-width: 80%;
  font-size: 14px;
}
.msg.user {
  background: rgba(0, 212, 255, 0.15);
  margin-left: auto;
}
.msg.assistant {
  background: rgba(0, 255, 136, 0.1);
}
.input-bar {
  display: flex;
  gap: 10px;
}
.input-bar input {
  flex: 1;
  padding: 10px;
  background: rgba(0, 50, 100, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 6px;
  color: #e0e6ed;
}
.input-bar button {
  padding: 10px 20px;
  background: #00d4ff;
  border: none;
  border-radius: 6px;
  color: #0a1929;
  cursor: pointer;
}
</style>
