<template>
  <div v-if="open" class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <aside id="app-sidebar" role="dialog" aria-modal="true" class="absolute left-0 top-0 h-full w-72 bg-surface border-r border-line rounded-r-3xl shadow-pop flex flex-col overflow-auto" @keydown.esc="emit('close')">
      <div class="p-4 border-b border-line flex items-center justify-between">
        <p class="font-bold text-ink">Menu</p>
        <button type="button" class="rounded-full border border-line px-3 py-1 text-sm" @click="emit('close')">Tutup</button>
      </div>
      <nav class="p-2 space-y-1">
        <button type="button" class="w-full text-left rounded-2xl px-4 py-3 text-sm hover:bg-app" @click="go('/super-admin')">Setup Admin</button>
        <button type="button" class="w-full text-left rounded-2xl px-4 py-3 text-sm hover:bg-app" @click="go('/admin')">Setup Keringanan</button>
      </nav>
      <div class="border-t border-line p-3 space-y-2">
        <p class="text-xs font-semibold text-mu">Keringanan</p>
        <p v-if="admin.visibleKeringananList.length===0" class="text-xs text-mu">Tidak ada provisi aktif.</p>
        <div v-for="k in admin.visibleKeringananList" :key="k.id" class="flex items-center justify-between gap-2 rounded-2xl border border-line px-3 py-2">
          <span class="text-sm text-ink truncate">Keringanan {{ k.label }}</span>
          <button type="button" role="switch" :aria-checked="admin.activeKeringananId===k.id" :data-testid="`switch-${k.id}`" class="relative inline-flex h-6 w-11 items-center rounded-full transition" :class="admin.activeKeringananId===k.id ? 'bg-brand-strong' : 'bg-line'" @click="toggle(k.id)" @keydown.space.prevent="toggle(k.id)" @keydown.enter.prevent="toggle(k.id)">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="admin.activeKeringananId===k.id ? 'translate-x-6' : 'translate-x-1'"></span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/adminStore'
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const admin = useAdminStore()
const router = useRouter()
function go(path: string) { emit('close'); router.push(path) }
function toggle(id: string) { admin.setActiveKeringananId(admin.activeKeringananId === id ? null : id) }
</script>
