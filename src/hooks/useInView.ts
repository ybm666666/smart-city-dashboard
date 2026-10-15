import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Day7：懒渲染 —— 用 IntersectionObserver 判断元素是否进入视口。
 *
 * 图表只在「即将可见」时才初始化 ECharts 实例，减少首屏初始化开销
 * （大屏 / 图库中大量图表时收益明显）。元素首次进入视口后即断开观察。
 */
export function useInView(
  elRef: Ref<HTMLElement | undefined>,
  options: IntersectionObserverInit = {}
) {
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  function stop() {
    observer?.disconnect()
    observer = null
  }

  onMounted(() => {
    if (!elRef.value) return

    // 兼容不支持 IntersectionObserver 的环境：直接视为可见
    if (typeof IntersectionObserver === 'undefined') {
      inView.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inView.value = true
            stop()
            break
          }
        }
      },
      // 提前 120px 触发，滚动到附近就开始渲染
      { rootMargin: '120px', threshold: 0.01, ...options }
    )
    observer.observe(elRef.value)
  })

  onBeforeUnmount(stop)

  return { inView }
}
