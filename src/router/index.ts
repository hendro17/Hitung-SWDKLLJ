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
        next()
      }
    },
    {
      path: '/super-admin',
      name: 'super-admin',
      component: () => import('../views/SuperAdminView.vue'),
      beforeEnter: (_to, _from, next) => {
        if (import.meta.env.VITE_FEATURE_SUPER_ADMIN !== 'true') { next('/'); return }
        next()
      }
    }
  ]
})

export default router
