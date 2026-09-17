import { onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '../stores/adminStore'
import {
  observeKeringanan,
  loadKeringananCache,
  shouldRefetch,
  markFetched,
} from '../services/adminService'
import type { Unsubscribe } from 'firebase/firestore'

let unsub: Unsubscribe | null = null

export function useKeringanan() {
  const admin = useAdminStore()

  function subscribe() {
    try {
      // Cadence >12h (CHK011/FR-012): onSnapshot realtime sudah live;
      // resubscribe paksa hanya bila fetch terakhir basi agar kuota Spark hemat.
      if (!shouldRefetch()) return
      unsub?.()
      unsub = observeKeringanan((list) => {
        admin.setKeringananList(list)
        markFetched()
      })
    } catch {/* Firestore offline — use cache */}
  }

  function start() {
    // fallback cache immediate
    const cached = loadKeringananCache()
    if (cached.length) admin.setKeringananList(cached)
    subscribe()
    const onOnline = () => {
      try { subscribe() } catch {/* offline resubscribe — ignore */}
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
