import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { KeringananDoc } from '../domain/keringanan'
import { filterVisibleKeringanan } from '../domain/keringanan'
import { loadKeringananCache } from '../services/keringananService'

const LS_SESSION = 'admin_session_hash'
const LS_UNTIL = 'admin_session_until'
const LS_LABEL = 'admin_session_label'
const LS_ACTIVE = 'activeKeringananId'
const LS_LIST = 'keringanan_list'

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

export const useAdminStore = defineStore('admin', () => {
  const sessionHash = ref<string | null>(safeGet(LS_SESSION))
  const sessionUntil = ref<string | null>(safeGet(LS_UNTIL))
  const sessionLabel = ref<string | null>(safeGet(LS_LABEL))
  const keringananList = ref<KeringananDoc[]>(loadKeringananCache())
  const activeKeringananId = ref<string | null>(safeGet(LS_ACTIVE))

  const isAuthenticated = computed(() => !!sessionHash.value)

  const visibleKeringananList = computed(() => filterVisibleKeringanan(keringananList.value))

  const selectedKeringanan = computed(() => {
    if (!activeKeringananId.value) return null
    return visibleKeringananList.value.find((d) => d.id === activeKeringananId.value) ?? null
  })

  // expired auto-reset
  watch(visibleKeringananList, (vis) => {
    if (activeKeringananId.value && !vis.find((d) => d.id === activeKeringananId.value)) {
      activeKeringananId.value = null
    }
  })

  watch(activeKeringananId, (v) => {
    try {
      if (v) localStorage.setItem(LS_ACTIVE, v)
      else localStorage.removeItem(LS_ACTIVE)
    } catch {}
  })

  function setSession(hash: string, until: string, label: string) {
    sessionHash.value = hash; sessionUntil.value = until; sessionLabel.value = label
    try {
      localStorage.setItem(LS_SESSION, hash)
      localStorage.setItem(LS_UNTIL, until)
      localStorage.setItem(LS_LABEL, label)
    } catch {}
  }

  function resetSession() {
    sessionHash.value = null; sessionUntil.value = null; sessionLabel.value = null
    try { localStorage.removeItem(LS_SESSION); localStorage.removeItem(LS_UNTIL); localStorage.removeItem(LS_LABEL) } catch {}
  }

  function setKeringananList(list: KeringananDoc[]) {
    keringananList.value = list
    try { localStorage.setItem(LS_LIST, JSON.stringify(list)) } catch {}
  }

  function setActiveKeringananId(id: string | null) {
    // exclusive: set or toggle off
    activeKeringananId.value = id
  }

  return { sessionHash, sessionUntil, sessionLabel, isAuthenticated, keringananList, visibleKeringananList, selectedKeringanan, activeKeringananId, setSession, resetSession, setKeringananList, setActiveKeringananId }
})
