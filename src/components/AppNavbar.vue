<template>
  <nav class="sticky top-0 z-10 border-b border-line bg-app/90 backdrop-blur">
    <div class="mx-auto flex max-w-[30rem] items-center gap-3 px-4 py-3">
      <button type="button" aria-label="Buka menu" :aria-expanded="!!openSidebar" aria-controls="app-sidebar" class="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink" @click="openSidebar?.()">☰</button>
      <picture class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft ring-2 ring-brand/40">
        <source srcset="/jr_new_logo.webp" type="image/webp" />
        <img src="/jr_new_logo.png" alt="Logo Jasa Raharja" class="h-9 w-9 object-contain" />
      </picture>
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