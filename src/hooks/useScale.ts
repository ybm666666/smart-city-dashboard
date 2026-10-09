import { onMounted, onBeforeUnmount, ref } from 'vue'

/**
 * 大屏自适应（对应简历：scale 等比缩放 + ResizeObserver，兼容 1920×1080 ~ 4K）
 * 以 1920×1080 为设计稿，整体等比缩放并居中。
 */
export function useScale(designWidth = 1920, designHeight = 1080) {
  const scale = ref(1)
  let observer: ResizeObserver | null = null

  function calc() {
    const w = window.innerWidth
    const h = window.innerHeight
    // 取宽高缩放比例中较小者，保证内容完整显示、不变形
    scale.value = Math.min(w / designWidth, h / designHeight)
  }

  onMounted(() => {
    calc()
    observer = new ResizeObserver(calc)
    observer.observe(document.body)
    window.addEventListener('resize', calc)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', calc)
    observer?.disconnect()
  })

  return { scale }
}
