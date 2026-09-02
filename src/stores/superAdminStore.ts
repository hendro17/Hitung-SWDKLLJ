import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { getAuthInstance } from '../services/firebase'

export const useSuperAdminStore = defineStore('superAdmin', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  let unsub: (() => void) | null = null

  const isSuperAdmin = computed(() => {
    if (!user.value?.email) return false
    const allow = (import.meta.env.VITE_SUPER_ADMIN_EMAILS as string || '').split(',').map((s: string) => s.trim().toLowerCase())
    return allow.includes(user.value.email.toLowerCase())
  })

  function initAuth() {
    if (unsub) return
    unsub = onAuthStateChanged(getAuthInstance(), (u) => { user.value = u; loading.value = false })
  }

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(getAuthInstance(), email, password)
    user.value = cred.user
  }

  async function logout() {
    await signOut(getAuthInstance())
    user.value = null
  }

  return { user, loading, isSuperAdmin, initAuth, login, logout }
})
