<script setup lang="ts">
// Day8：AI 自然语言出图 —— LLM/Mock → 配置 JSON → 校验 → 渲染
// Day9：多轮上下文 + 本地微调栏（改标题 / 换类型 / 增删数据）
// Day10：多会话管理（新建 / 切换 / 重命名 / 清空 / 删除 + 本地持久化）+ 示例库分组 + 错误提示与重试
// Day11：SSE 流式输出 + 中断生成 + 助手消息 Markdown 渲染
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ChartPanel from '@/components/ChartPanel.vue'
import ConfigChart from '@/components/ConfigChart.vue'
import PanelState from '@/components/PanelState.vue'
import { useAiStore } from '@/stores/ai'
import { DEFAULT_TITLE } from '@/utils/chatSession'
import { renderMarkdown } from '@/utils/markdown'
import type { ChartType } from '@/types'

const store = useAiStore()
const {
  sessions,
  activeId,
  messages,
  loading,
  isStreaming,
  error,
  canRetry,
  chartConfig,
  usedFallback,
  mockMode,
  exampleGroups
} = storeToRefs(store)

const input = ref('')
const showJson = ref(false)
const titleDraft = ref('')

// Day10：正在重命名的会话 id（null = 没在改名）
const renamingId = ref<string | null>(null)
const renameText = ref('')
const bodyRef = ref<HTMLElement | null>(null)

const TYPE_OPTIONS: { value: ChartType; label: string }[] = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'pie', label: '饼图' },
  { value: 'scatter', label: '散点图' },
  { value: 'radar', label: '雷达图' },
  { value: 'funnel', label: '漏斗图' },
  { value: 'gauge', label: '仪表盘' }
]

function send() {
  const text = input.value
  if (!text.trim() || loading.value) return
  void store.send(text)
  input.value = ''
}
function pickExample(text: string) {
  input.value = text
  send()
}

// ---------- Day10：会话操作 ----------
function onNew() {
  store.newSession()
  input.value = ''
}
function onClear() {
  store.clearMessages()
  showJson.value = false
}
function onDelete(id: string) {
  store.deleteSession(id)
}
function onRetry() {
  void store.retry()
}
function startRename(id: string, title: string) {
  renamingId.value = id
  renameText.value = title === DEFAULT_TITLE ? '' : title
  void nextTick(() => {
    const el = document.querySelector<HTMLInputElement>('.rename-input')
    el?.focus()
    el?.select()
  })
}
function commitRename() {
  if (!renamingId.value) return
  store.renameSession(renamingId.value, renameText.value)
  renamingId.value = null
  renameText.value = ''
}
function cancelRename() {
  renamingId.value = null
  renameText.value = ''
}
function titleOf(title: string) {
  return title || DEFAULT_TITLE
}

// ---------- Day9：本地微调 ----------
function applyTitle() {
  const t = titleDraft.value.trim()
  if (!t) return
  store.refine({ kind: 'setTitle', title: t })
  titleDraft.value = ''
}
function onTypeChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as ChartType
  store.changeType(v)
}
function appendPoint() {
  store.refine({ kind: 'appendPoint' })
}
function removeLast() {
  store.refine({ kind: 'removeLast' })
}

// 消息变化时滚动到底部，保证最新一轮可见
watch(
  () => [messages.value.length, loading.value, messages.value.map((m) => m.content).join('')],
  () => {
    void nextTick(() => {
      const el = bodyRef.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
)

/** Day11：中断当前流式输出 */
function onStop() {
  store.stopStreaming()
}

/** Day11：助手消息按 Markdown 渲染，用户消息保持原样 */
function renderMessage(role: string, content: string): string {
  return role === 'assistant' ? renderMarkdown(content) : ''
}

const configJson = computed(() =>
  chartConfig.value ? JSON.stringify(chartConfig.value, null, 2) : ''
)
</script>

<template>
  <section class="ai">
    <!-- Day10：最左 - 会话列表 -->
    <aside class="session-col">
      <button class="new-btn" @click="onNew">＋ 新建对话</button>

      <ul class="session-list">
        <li
          v-for="s in sessions"
          :key="s.id"
          :class="['session-item', { active: s.id === activeId }]"
          @click="store.switchSession(s.id)"
        >
          <input
            v-if="renamingId === s.id"
            v-model="renameText"
            class="rename-input"
            placeholder="输入会话名称"
            @click.stop
            @keyup.enter="commitRename"
            @keyup.esc="cancelRename"
            @blur="commitRename"
          />
          <template v-else>
            <span class="session-title" :title="titleOf(s.title)">{{ titleOf(s.title) }}</span>
            <span class="session-actions">
              <button class="icon-btn" title="重命名" @click.stop="startRename(s.id, s.title)">
                ✎
              </button>
              <button class="icon-btn" title="删除" @click.stop="onDelete(s.id)">✕</button>
            </span>
          </template>
        </li>
      </ul>

      <p class="session-count">共 {{ sessions.length }} 个对话 · 本地保存</p>
    </aside>

    <!-- 中：对话区 -->
    <div class="chat-col">
      <ChartPanel title="AI 自然语言出图（LLM → 配置 JSON → 校验 → 渲染）">
        <div class="chat-toolbar">
          <span class="cur-title">{{ titleOf(store.activeSession?.title ?? DEFAULT_TITLE) }}</span>
          <button class="ghost" :disabled="!messages.length" @click="onClear">清空对话</button>
        </div>

        <div ref="bodyRef" class="chat-body">
          <p v-if="mockMode" class="tip">
            演示模式：未检测到有效 API Key，正在使用内置 Mock（在 <code>.env.local</code>
            配置后可接入真实大模型）。
          </p>

          <!-- Day10：示例库分组 -->
          <div v-if="!messages.length" class="examples">
            <div v-for="g in exampleGroups" :key="g.name" class="example-group">
              <span class="label">{{ g.name }}</span>
              <button v-for="ex in g.items" :key="ex" class="chip" @click="pickExample(ex)">
                {{ ex }}
              </button>
            </div>
          </div>

          <!-- Day11：助手消息按 Markdown 渲染；流式中显示光标；中断后标注 -->
          <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
            <div
              v-if="m.role === 'assistant'"
              class="md"
              v-html="renderMessage(m.role, m.content)"
            ></div>
            <template v-else>{{ m.content }}</template>
            <span v-if="m.streaming" class="caret"></span>
            <span v-if="m.interrupted" class="interrupted">（已中断）</span>
          </div>
          <div v-if="loading" class="msg assistant typing">AI 正在生成图表…</div>
        </div>
      </ChartPanel>

      <div class="input-bar">
        <input
          v-model="input"
          placeholder="用一句话描述你想看的图表，例如：用饼图展示产业结构占比"
          @keyup.enter="send"
        />
        <button v-if="!isStreaming" :disabled="loading" @click="send">生成图表</button>
        <button v-else class="stop-btn" @click="onStop">停止</button>
      </div>
    </div>

    <!-- 右：预览区 -->
    <div class="preview-col">
      <ChartPanel title="图表预览">
        <PanelState v-if="loading" loading />
        <template v-else-if="chartConfig">
          <div v-if="usedFallback" class="warn">
            <span>出图失败，已降级展示默认图表</span>
            <button v-if="canRetry" class="retry-btn" @click="onRetry">重试</button>
          </div>
          <div class="preview-body">
            <ConfigChart :config="chartConfig" />
          </div>
        </template>
        <PanelState v-else empty empty-text="说出你的需求，AI 会在这里渲染图表" />
      </ChartPanel>

      <!-- Day9：微调栏 -->
      <div v-if="chartConfig" class="refine-bar">
        <span class="refine-label">微调：</span>
        <input
          v-model="titleDraft"
          class="title-input"
          placeholder="修改图表标题"
          @keyup.enter="applyTitle"
        />
        <button class="mini" @click="applyTitle">改标题</button>
        <select class="type-select" :value="chartConfig.type" @change="onTypeChange">
          <option v-for="t in TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <button class="mini" @click="appendPoint">＋ 加数据</button>
        <button class="mini" @click="removeLast">－ 删末项</button>
      </div>

      <!-- Day10：错误提示 + 重试 -->
      <div v-if="error && canRetry" class="error-box">
        <span class="error-text">最近一次错误：{{ error }}</span>
        <button class="retry-btn" @click="onRetry">重试</button>
      </div>
      <p v-else-if="error" class="err">最近一次错误：{{ error }}</p>

      <div v-if="chartConfig" class="json-box">
        <button class="json-toggle" @click="showJson = !showJson">
          {{ showJson ? '收起' : '查看' }}配置 JSON
        </button>
        <pre v-if="showJson" class="json">{{ configJson }}</pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ai {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}
/* Day10：会话列表栏 */
.session-col {
  width: 196px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 50, 100, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 8px;
  min-height: 0;
}
.new-btn {
  padding: 8px 10px;
  font-size: 13px;
  color: #0a1929;
  background: #00d4ff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.new-btn:hover {
  opacity: 0.88;
}
.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.session-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: #7eb8d8;
  cursor: pointer;
  border: 1px solid transparent;
}
.session-item:hover {
  background: rgba(0, 150, 255, 0.12);
  color: #b8e4ff;
}
.session-item.active {
  background: rgba(0, 212, 255, 0.16);
  border-color: rgba(0, 212, 255, 0.5);
  color: #00d4ff;
}
.session-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-actions {
  display: none;
  gap: 2px;
}
.session-item:hover .session-actions,
.session-item.active .session-actions {
  display: flex;
}
.icon-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  line-height: 1;
  font-size: 12px;
  color: #7eb8d8;
  background: transparent;
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
}
.icon-btn:hover {
  color: #00d4ff;
  border-color: #00d4ff;
}
.rename-input {
  width: 100%;
  padding: 3px 6px;
  font-size: 13px;
  color: #e0e6ed;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid #00d4ff;
  border-radius: 4px;
  outline: none;
}
.session-count {
  font-size: 11px;
  color: #5f8bab;
  text-align: center;
}
/* 对话 / 预览 */
.chat-col,
.preview-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(0, 150, 255, 0.25);
}
.cur-title {
  font-size: 13px;
  color: #9fe6ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ghost {
  flex: none;
  padding: 3px 10px;
  font-size: 12px;
  color: #7eb8d8;
  background: transparent;
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
}
.ghost:hover:not(:disabled) {
  color: #00d4ff;
  border-color: #00d4ff;
}
.ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.example-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.examples .label {
  font-size: 12px;
  color: #5f8bab;
  min-width: 28px;
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
/* Day11：流式光标 */
.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: #00d4ff;
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
.interrupted {
  margin-left: 6px;
  font-size: 12px;
  color: #ffb642;
  opacity: 0.9;
}
/* Day11：Markdown 渲染样式 */
.md :deep(p) {
  margin: 0 0 8px;
}
.md :deep(p:last-child) {
  margin-bottom: 0;
}
.md :deep(h1),
.md :deep(h2),
.md :deep(h3),
.md :deep(h4) {
  margin: 10px 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #9fe6ff;
  line-height: 1.4;
}
.md :deep(h1) {
  font-size: 17px;
}
.md :deep(h2) {
  font-size: 16px;
}
.md :deep(ul),
.md :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}
.md :deep(li) {
  margin: 2px 0;
}
.md :deep(code) {
  padding: 1px 5px;
  font-size: 12px;
  color: #00d4ff;
  background: rgba(0, 20, 40, 0.7);
  border-radius: 3px;
}
.md :deep(pre) {
  margin: 0 0 8px;
  padding: 10px;
  overflow-x: auto;
  background: rgba(0, 20, 40, 0.7);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
}
.md :deep(pre code) {
  padding: 0;
  color: #9fe6ff;
  background: transparent;
}
.md :deep(blockquote) {
  margin: 0 0 8px;
  padding: 4px 10px;
  font-size: 13px;
  color: #8fb6cf;
  border-left: 3px solid rgba(0, 212, 255, 0.5);
  background: rgba(0, 150, 255, 0.06);
}
.md :deep(a) {
  color: #00d4ff;
  text-decoration: underline;
}
.md :deep(strong) {
  color: #eaffff;
  font-weight: 600;
}
.md :deep(hr) {
  margin: 10px 0;
  border: none;
  border-top: 1px dashed rgba(0, 150, 255, 0.3);
}
.stop-btn {
  background: #ff5c5c !important;
  color: #fff !important;
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
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #ff9500;
  margin-bottom: 6px;
}
/* Day9：微调栏 */
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
/* Day10：错误提示 / 重试 */
.error-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  font-size: 12px;
  color: #ff8a8a;
  background: rgba(255, 80, 80, 0.08);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 6px;
}
.error-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.retry-btn {
  flex: none;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #0a1929;
  background: #ffb642;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.retry-btn:hover {
  opacity: 0.85;
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
@media (max-width: 1100px) {
  .ai {
    flex-direction: column;
  }
  .session-col {
    width: auto;
    max-height: 170px;
  }
}
</style>
