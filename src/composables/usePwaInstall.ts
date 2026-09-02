// usePwaInstall — tangkap beforeinstallprompt, expose canInstall/promptInstall + deteksi iOS (T030)
import { onMounted, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePwaInstall() {
  const canInstall = ref(false)
  const isIos = ref(false)
  let deferred: BeforeInstallPromptEvent | null = null

  function promptInstall() {
    if (!deferred) return
    void deferred.prompt()
  }

  onMounted(() => {
    const ua = navigator.userAgent
    isIos.value = /iphone|ipad|ipod/i.test(ua) && !window.matchMedia('(display-mode: standalone)').matches

    const handler = (e: Event) => {
      e.preventDefault()
      deferred = e as BeforeInstallPromptEvent
      canInstall.value = true
    }
    window.addEventListener('beforeinstallprompt', handler)
  })

  return { canInstall, promptInstall, isIos }
}