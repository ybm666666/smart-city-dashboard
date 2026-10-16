<script setup lang="ts">
// Day8：AI 自然语言出图 —— LLM/Mock → 配置 JSON → 校验 → 渲染
// Day9：多轮上下文（在此基础上修改）+ 结果微调（改标题 / 换类型 / 追加 / 删除）
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useAiStore } from '@/stores/ai'
import type { ChartType } from '@/types'

const store = useAiStore()
const { messages, loading, error, chartConfig, usedFallback, mockMode, examples } = storeToRefs(store)

const input = ref('')
const showJson = ref(false)
// Day9：微调工具类
const titleDraft = ref('')
const typeDraft = ref<ChartType>('line')
const TYPE_OPTIONS: { value: ChartType; label: string }[] = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'pie', label: '饼图' },
  { value: 'scatter', label: '散点图' },
  { value: 'gauge', label: '仪表盘' },
  { value: 'radar', label: '雷达图' },
  { value: 'funnel', label: '漏斗图' }
]

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

// Day9：本地即时微调
function applyTitle() {
  if (!titleDraft.value.trim()) return
  store.refine({ kind: 'setTitle', title: titleDraft.value })
  titleDraft.value = ''
}
function applyType() {
  store.changeType(typeDraft.value)
}
function appendPoint() {
  store.refine({ kind: 'appendPoint' })
}
function removeLast() {
  store.refine({ kind: 'removeLast' })
}

const configJson = computed(() =>
  chartConfig.value ? JSON.stringify(chartConfig.value, null, 2) : ''
)
</script>

<template>
  <section class="ai">
    <!-- 左：对话区 -->
    <div class="chat-col">
      <ChartPanel title="AI 自然语言出图（多轮对话 + 结果微调）">
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
          placeholder="描述图表，或在此基础上修改，例如：把标题改成城市概览、换成柱状图"
          @keyup.enter="send"
        />
        <button :disabled="loading" @click="send">生成 / 修改</button>
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

      <!-- Day9：结果微调工具条 -->
      <div v-if="chartConfig" class="refine-bar">
        <span class="refine-label">微调：</span>
        <input v-model="titleDraft" class="title-input" placeholder="新标题" @keyup.enter="applyTitle" />
        <button class="mini" @click="applyTitle">改标题</button>
        <select v-model="typeDraft" class="type-select">
          <option v-for="t in TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <button class="mini" @click="applyType">换类型</button>
        <button class="mini" @click="appendPoint">+ 数据点</button>
        <button class="mini" @click="removeLast">− 数据点</button>
      </div>

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
.refine-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 50, 100, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
}
.refine-label {
  font-size: 12px;
  color: #7eb8d8;
}
.title-input {
  flex: 1;
  min-width: 100px;
  padding: 5px 8px;
  font-size: 12px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  color: #e0e6ed;
  outline: none;
}
.type-select {
  padding: 5px 8px;
  font-size: 12px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  color: #e0e6ed;
  outline: none;
}
.mini {
  padding: 5px 10px;
  font-size: 12px;
  color: #00d4ff;
  background: rgba(0, 150, 255, 0.1);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.mini:hover {
  border-color: #00d4ff;
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
