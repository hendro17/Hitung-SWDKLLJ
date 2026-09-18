import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAdminStore } from '../stores/adminStore'
import {
  observeKeringanan,
  loadKeringananCache,
  shouldRefetch,
  markFetched,
} from '../services/adminService'
import type { Unsubscribe } from 'firebase/firestore'

let unsub: Unsubscribe | null = null

/** true setelah daftar keringanan siap tampil (cache / snapshot pertama / timeout pengaman). */
export const keringananLoaded = ref(false)
function markLoaded() { keringananLoaded.value = true }

/**
 * Tunggu daftar keringanan siap. Resolve true bila sudah siap,
 * false bila timeout (offline + cache kosong) — layar loading tidak boleh gantung.
 */
export function awaitKeringanan(timeoutMs = 10000): Promise<boolean> {
  if (keringananLoaded.value) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => { stop(); resolve(keringananLoaded.value) }, timeoutMs)
    const stop = watch(keringananLoaded, (v) => { if (v) { clearTimeout(timer); stop(); resolve(true) } })
  })
}

/**
 * Sync manual paksa: resubscribe snapshot melewati cadence 12 jam.
 * Resolve true saat snapshot pertama tiba, false bila timeout/offline.
 * Module-scope agar bisa dipanggil dari tombol Muat ulang tanpa useKeringanan().
 */
export function refreshKeringanan(): Promise<boolean> {
  const admin = useAdminStore()
  return new Promise<boolean>((resolve) => {
    try {
      unsub?.()
      unsub = null
      let done = false
      const timer = setTimeout(() => { if (!done) { done = true; resolve(false) } }, 15000)
      unsub = observeKeringanan((list) => {
        admin.setKeringananList(list)
        markFetched()
        markLoaded()
        if (!done) { done = true; clearTimeout(timer); resolve(true) }
      })
    } catch { resolve(false) }
  })
}

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
        markLoaded()
      })
    } catch {/* Firestore offline — use cache */}
  }

  function start() {    // fallback cache immediate
    const cached = loadKeringananCache()
    if (cached.length) { admin.setKeringananList(cached); markLoaded() }
    setTimeout(() => markLoaded(), 12000) // pengaman: jangan gantung loading bila offline + cache kosong
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
