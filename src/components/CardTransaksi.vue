<template>
  <BaseCard data-testid="card-transaksi">
    <h2 class="text-lg font-bold text-ink">Jenis Transaksi</h2>
    <p class="text-sm text-mu mt-1">Pilih transaksi yang akan dilakukan di Samsat.</p>

    <form class="mt-4 space-y-4" @submit.prevent="onLanjutkan">
      <div>
        <label for="transaksi" class="block text-sm font-semibold text-ink">Transaksi</label>
        <div class="mt-2">
          <AppSelect
            id="transaksi"
            :model-value="store.transaksi ?? ''"
            :options="OPSI_SELECT"
            placeholder="Pilih jenis transaksi…"
            @update:model-value="onSelect"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!store.transaksi"
        @click="onLanjutkan"
      >
        Lanjutkan
      </button>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import BaseCard from './BaseCard.vue'
import AppSelect from './ui/AppSelect.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import type { KodeTransaksi } from '../domain/types'

const store = useKalkulatorStore()

const OPSI: { kode: KodeTransaksi; label: string }[] = [
  { kode: 'PERPANJANGAN', label: 'Perpanjangan / Pengesahan' },
  { kode: 'BALIK_NAMA', label: 'Balik Nama' },
  { kode: 'MUTASI_MASUK', label: 'Mutasi Masuk' },
  { kode: 'MUTASI_KELUAR', label: 'Mutasi Keluar' }
]

const OPSI_SELECT = computed(() => OPSI.map((t) => ({ value: t.kode, label: t.label })))

function onSelect(v: string) {
  store.pilihTransaksi(v as KodeTransaksi)
}

function focusCard(testid: string) {
  const el = document.querySelector(`[data-testid="${testid}"]`) as HTMLElement | null
  if (!el) return
  const reduced =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true
  el.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}

async function onLanjutkan() {
  store.lanjutkan()
  await nextTick()
  if (store.step >= 2) focusCard('card-data')
}
</script>
