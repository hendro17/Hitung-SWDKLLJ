<template>
  <div v-if="open" class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <dialog id="app-sidebar" ref="panelRef" :open="open" aria-modal="true" aria-label="Menu navigasi" class="absolute left-0 top-0 h-full w-72 bg-surface border-r border-line rounded-r-3xl shadow-pop flex flex-col overflow-auto" @keydown.esc="emit('close')">
      <div class="p-4 border-b border-line flex items-center justify-between">
        <p class="font-bold text-ink">Menu</p>
        <button type="button" class="rounded-full border border-line px-3 py-1 text-sm text-ink" @click="emit('close')">Tutup</button>
      </div>
      <nav class="p-2 space-y-1">
        <button type="button" class="w-full text-left rounded-2xl px-4 py-3 text-sm text-ink hover:bg-app" @click="go('/super-admin')">Setup Admin</button>
        <button type="button" class="w-full text-left rounded-2xl px-4 py-3 text-sm text-ink hover:bg-app" @click="go('/admin')">Setup Keringanan</button>
      </nav>
      <div class="border-t border-line p-3 space-y-2">
        <p class="text-xs font-semibold text-mu">Keringanan</p>
        <p v-if="admin.visibleKeringananList.length===0" class="text-xs text-mu">Tidak ada provisi aktif.</p>
        <div v-for="k in admin.visibleKeringananList" :key="k.id" class="flex items-center justify-between gap-2 rounded-2xl border border-line px-3 py-2">
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-ink truncate">Keringanan {{ k.label }}</span>
            <span class="block text-xs" :class="sisaHari(k) <= 7 ? 'font-semibold text-red-600' : 'text-mu'">berakhir dalam {{ sisaHari(k) }} hari</span>
          </span>
          <button type="button" role="switch" :aria-checked="admin.activeKeringananId===k.id" :data-testid="`switch-${k.id}`" class="relative inline-flex h-6 w-11 items-center rounded-full transition" :class="admin.activeKeringananId===k.id ? 'bg-brand-strong' : 'bg-line'" @click="toggle(k.id)" @keydown.space.prevent="toggle(k.id)" @keydown.enter.prevent="toggle(k.id)">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="admin.activeKeringananId===k.id ? 'translate-x-6' : 'translate-x-1'"></span>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/adminStore'
import { sisaHariKeringanan } from '../domain/keringanan'
import type { KeringananDoc } from '../domain/keringanan'
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const admin = useAdminStore()
const router = useRouter()
const panelRef = ref<HTMLElement | null>(null)
function go(path: string) { emit('close'); router.push(path) }
function toggle(id: string) { admin.setActiveKeringananId(admin.activeKeringananId === id ? null : id) }
function sisaHari(k: KeringananDoc): number { return sisaHariKeringanan(k) }
function cycleTab(e: KeyboardEvent, first: HTMLElement, last: HTMLElement) {
  const active = document.activeElement
  let wrapTo: HTMLElement | null = null
  if (e.shiftKey) {
    if (active === first) wrapTo = last
  } else if (active === last) {
    wrapTo = first
  }
  if (!wrapTo) return
  e.preventDefault()
  wrapTo.focus()
}
function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key !== 'Tab' || !panelRef.value) return
  const items = panelRef.value.querySelectorAll<HTMLElement>('button:not([disabled])')
  if (items.length === 0) return
  cycleTab(e, items[0], items[items.length - 1])
}
watch(() => props.open, async (v) => {
  if (v) {
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    panelRef.value?.querySelector<HTMLElement>('button')?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
