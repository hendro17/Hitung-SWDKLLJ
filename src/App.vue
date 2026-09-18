<script setup lang="ts">
import { ref, provide } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppNavbar from './components/AppNavbar.vue'
import { Toaster } from 'vue-sonner'
import { Analytics } from '@vercel/analytics/vue'
import { useKeringanan } from './composables/useKeringanan'

const sidebarOpen = ref(false)
provide('sidebarOpen', sidebarOpen)
useKeringanan()
function openSidebar() { sidebarOpen.value = true }
provide('openSidebar', openSidebar)
</script>

<template>
  <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
  <div class="min-h-screen bg-app">
    <a
      href="#mulai"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-2xl focus:bg-brand-strong focus:px-4 focus:py-2 focus:text-white"
    >
      Lewati ke konten
    </a>

    <AppNavbar />
    <main id="mulai">
      <RouterView />
    </main>

    <footer class="mx-auto max-w-[30rem] px-4 pb-8 text-center text-xs leading-relaxed text-mu">
      Developed by JR-Lampung Innovation Team · Tarif dasar mengacu pada PMK No. 16/PMK.010/2017 · Hasil perhitungan bersifat estimasi — penetapan resmi mengikuti ketentuan saat melakukan transaksi di SAMSAT.
    </footer>
  </div>
  <Toaster position="bottom-right" richColors />
  <Analytics />
</template>
