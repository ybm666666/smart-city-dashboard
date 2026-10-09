/// <reference types="vite/client" />

// 让 import.meta.env 有类型提示
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_LLM_BASE_URL: string
  readonly VITE_LLM_API_KEY: string
  readonly VITE_LLM_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 让 .vue 文件在 TS 中可被 import
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
