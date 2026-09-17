import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      beforeEnter: (_to, _from, next) => {
        if (import.meta.env.VITE_FEATURE_ADMIN !== 'true') { next('/'); return }
        // Purge sesi admin kedaluwarsa (today > validUntil): cegah sesi basi
        // lolos sebagai authenticated. Entry tetap terbuka — AdminView
        // tampilkan form login bila belum authenticated.
        try {
          const until = localStorage.getItem('admin_session_until')
          if (until) {
            const [y, m, d] = until.split('-').map(Number)
            const end = new Date(y, m - 1, d)
            const today = new Date()
            const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            if (midnight > end) {
              localStorage.removeItem('admin_session_hash')
              localStorage.removeItem('admin_session_until')
              localStorage.removeItem('admin_session_label')
            }
          }
        } catch {/* storage private mode — ignore */}
        next()
      }
    },
    {
      path: '/super-admin',
      name: 'super-admin',
      component: () => import('../views/SuperAdminView.vue'),
      beforeEnter: (_to, _from, next) => {
        // Flag saja di guard; Auth + allowlist VITE_SUPER_ADMIN_EMAILS
        // dienforce di view via superAdminStore.isSuperAdmin (butuh
        // Firebase Auth async, tak bisa dicek sinkron di sini).
        if (import.meta.env.VITE_FEATURE_SUPER_ADMIN !== 'true') { next('/'); return }
        next()
      }
    }
  ]
})

export default router
