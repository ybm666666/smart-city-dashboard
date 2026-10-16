<script setup lang="ts">
// Day8：AI 自然语言出图 —— LLM/Mock → 配置 JSON → 校验 → 渲染
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useAiStore } from '@/stores/ai'

const store = useAiStore()
const { messages, loading, error, chartConfig, usedFallback, mockMode, examples } = storeToRefs(store)

const input = ref('')
const showJson = ref(false)

function send() {
  const text = input.value
  if (!text.trim()) return
  void store.send(text)
  input.value = ''
}
function pickExample(text: string) {
  input.value = text
  send()
}

const configJson = computed(() =>
  chartConfig.value ? JSON.stringify(chartConfig.value, null, 2) : ''
)
</script>

<template>
  <section class="ai">
    <!-- 左：对话区 -->
    <div class="chat-col">
      <ChartPanel title="AI 自然语言出图（LLM → 配置 JSON → 校验 → 渲染）">
        <div class="chat-body">
          <p v-if="mockMode" class="tip">
            演示模式：未检测到有效 API Key，正在使用内置 Mock（在 <code>.env.local</code> 配置后可接入真实大模型）。
          </p>

          <div v-if="!messages.length" class="examples">
            <span class="label">试试：</span>
            <button v-for="ex in examples" :key="ex" class="chip" @click="pickExample(ex)">
              {{ ex }}
            </button>
          </div>

          <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">{{ m.content }}</div>
          <div v-if="loading" class="msg assistant typing">AI 正在生成图表…</div>
        </div>
      </ChartPanel>

      <div class="input-bar">
        <input
          v-model="input"
          placeholder="用一句话描述你想看的图表，例如：用饼图展示产业结构占比"
          @keyup.enter="send"
        />
        <button :disabled="loading" @click="send">生成图表</button>
      </div>
    </div>

    <!-- 右：预览区 -->
    <div class="preview-col">
      <ChartPanel title="图表预览">
        <PanelState v-if="loading" loading />
        <template v-else-if="chartConfig">
          <div v-if="usedFallback" class="warn">出图失败，已降级展示默认图表</div>
          <div class="preview-body">
            <ConfigChart :config="chartConfig" />
          </div>
        </template>
        <PanelState v-else empty empty-text="说出你的需求，AI 会在这里渲染图表" />
      </ChartPanel>

      <div v-if="chartConfig" class="json-box">
        <button class="json-toggle" @click="showJson = !showJson">
          {{ showJson ? '收起' : '查看' }}配置 JSON
        </button>
        <pre v-if="showJson" class="json">{{ configJson }}</pre>
      </div>
      <p v-if="error" class="err">最近一次错误：{{ error }}</p>
    </div>
  </section>
</template>

<style scoped>
.ai {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}
.chat-col,
.preview-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.tip {
  font-size: 12px;
  color: #7eb8d8;
  margin-bottom: 10px;
  line-height: 1.5;
}
.tip code {
  color: #00d4ff;
}
.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.examples .label {
  font-size: 13px;
  color: #7eb8d8;
}
.chip {
  padding: 4px 10px;
  font-size: 12px;
  color: #7eb8d8;
  background: rgba(0, 150, 255, 0.1);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  color: #00d4ff;
  border-color: #00d4ff;
}
.msg {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  max-width: 85%;
  font-size: 14px;
  line-height: 1.5;
}
.msg.user {
  background: rgba(0, 212, 255, 0.15);
  color: #e0e6ed;
  margin-left: auto;
}
.msg.assistant {
  background: rgba(0, 255, 136, 0.1);
  color: #d6ffe9;
}
.typing {
  color: #7eb8d8;
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
  outline: none;
}
.input-bar input:focus {
  border-color: #00d4ff;
}
.input-bar button {
  padding: 10px 20px;
  background: #00d4ff;
  border: none;
  border-radius: 6px;
  color: #0a1929;
  font-weight: 600;
  cursor: pointer;
}
.input-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.preview-body {
  flex: 1;
  min-height: 0;
}
.warn {
  font-size: 12px;
  color: #ff9500;
  margin-bottom: 6px;
}
.json-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.json-toggle {
  align-self: flex-start;
  padding: 4px 12px;
  font-size: 12px;
  color: #7eb8d8;
  background: transparent;
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
}
.json {
  max-height: 200px;
  overflow: auto;
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #9fe6ff;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
}
.err {
  font-size: 12px;
  color: #ff8a8a;
}
</style>
