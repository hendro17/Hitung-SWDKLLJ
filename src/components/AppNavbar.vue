<template>
  <nav class="sticky top-0 z-10 border-b border-line bg-app/90 backdrop-blur">
    <div class="mx-auto flex max-w-[30rem] items-center gap-3 px-4 py-3">
      <button type="button" aria-label="Buka menu" :aria-expanded="!!openSidebar" aria-controls="app-sidebar" class="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink" @click="openSidebar?.()">☰</button>
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-cyan text-white shadow-card" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-base font-extrabold leading-tight text-ink">Hitung SWDKLLJ</p>
        <p class="truncate text-xs font-medium text-mu">Kalkulator Jasa Raharja</p>
      </div>

      <button
        v-if="install.canInstall.value"
        id="btn-install"
        type="button"
        class="rounded-full bg-brand-strong px-4 py-2 text-sm font-semibold text-white"
        @click="install.promptInstall()"
      >
        Pasang App
      </button>

      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-surface"
        :aria-label="'Ganti tema terang/gelap'"
        @click="theme.toggle()"
      >
        <svg v-if="theme.isDark.value" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </button>
    </div>

    <p v-if="install.isIos.value" id="hint-ios" class="px-4 pb-2 text-xs text-mu">
      Tips iPhone: buka menu Bagikan lalu pilih Tambahkan ke Layar Utama untuk memasang aplikasi.
    </p>
  </nav>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useTheme } from '../composables/useTheme'
import { usePwaInstall } from '../composables/usePwaInstall'

const theme = useTheme()
const install = usePwaInstall()
const openSidebar = inject<() => void>('openSidebar')
</script>