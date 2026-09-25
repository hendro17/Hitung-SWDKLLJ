// usePwaInstall — tangkap beforeinstallprompt, expose canInstall/promptInstall + deteksi iOS (T030)
// State shared module-level agar Navbar + Sidebar sinkron.
import { onMounted, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const canInstall = ref(false)
const isIos = ref(false)
const isInstalled = ref(false)
const showManual = ref(false)
let deferred: BeforeInstallPromptEvent | null = null
let listening = false

function ensureListener() {
  if (listening || typeof window === 'undefined') return
  listening = true
  const ua = navigator.userAgent
  isIos.value = /iphone|ipad|ipod/i.test(ua) && !window.matchMedia('(display-mode: standalone)').matches
  isInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    canInstall.value = true
    showManual.value = false
  })
  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    isInstalled.value = true
    deferred = null
  })
}

export function usePwaInstall() {
  function promptInstall() {
    if (!deferred) {
      showManual.value = true
      return
    }
    showManual.value = false
    void deferred.prompt()
    void deferred.userChoice.then(() => {
      deferred = null
      canInstall.value = false
    })
  }

  onMounted(ensureListener)
  ensureListener()

  return { canInstall, promptInstall, isIos, isInstalled, showManual }
}