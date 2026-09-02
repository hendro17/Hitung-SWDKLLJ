// useTheme — terang/gelap class html.dark, persist localStorage, sinkron meta theme-color (ui-components §1)
import { computed, onMounted, ref } from 'vue'

const THEME_KEY = 'hitung-swdkllj-theme'

function applyMeta(theme: 'light' | 'dark') {
  const metas = document.querySelectorAll('meta[name="theme-color"]')
  metas.forEach((m) => m.setAttribute('content', theme === 'dark' ? '#0b1c30' : '#0e6db8'))
}

export function useTheme() {
  const stored = ((): 'light' | 'dark' | null => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      /* ignore */
    }
    return null
  })()
  const theme = ref<'light' | 'dark'>(
    stored ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  const isDark = computed(() => theme.value === 'dark')

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
    applyMeta(theme.value)
    try {
      localStorage.setItem(THEME_KEY, theme.value)
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    theme.value = isDark.value ? 'light' : 'dark'
    apply()
  }

  onMounted(apply)

  return { theme, isDark, toggle }
}