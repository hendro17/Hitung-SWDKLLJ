import { onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '../stores/adminStore'
import { observeKeringananCollection, loadKeringananCache } from '../services/keringananService'
import type { Unsubscribe } from 'firebase/firestore'

let unsub: Unsubscribe | null = null

export function useKeringanan() {
  const admin = useAdminStore()

  function start() {
    // fallback cache immediate
    const cached = loadKeringananCache()
    if (cached.length) admin.setKeringananList(cached)
    try {
      unsub = observeKeringananCollection((list) => admin.setKeringananList(list))
    } catch {}
    const onOnline = () => {
      try { unsub?.(); unsub = observeKeringananCollection((list) => admin.setKeringananList(list)) } catch {}
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }

  onMounted(() => {
    const cleanup = start()
    onUnmounted(() => { unsub?.(); cleanup?.() })
  })

  return { start }
}
