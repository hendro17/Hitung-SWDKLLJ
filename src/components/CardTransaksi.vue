<template>
  <BaseCard data-testid="card-transaksi">
    <h2 class="text-lg font-bold text-ink">Jenis Transaksi</h2>
    <p class="text-sm text-mu mt-1">Pilih transaksi yang akan dilakukan di Samsat.</p>

    <form class="mt-4 space-y-4" @submit.prevent="store.lanjutkan()">
      <div>
        <label for="transaksi" class="block text-sm font-semibold text-ink">Transaksi</label>
        <select
          id="transaksi"
          class="mt-1 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          :value="store.transaksi ?? ''"
          @change="onChange"
        >
          <option value="" disabled>Pilih jenis transaksi…</option>
          <option v-for="t in OPSI" :key="t.kode" :value="t.kode">{{ t.label }}</option>
        </select>
      </div>

      <button
        type="submit"
        class="w-full rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!store.transaksi"
        @click="store.lanjutkan()"
      >
        Lanjutkan
      </button>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import type { KodeTransaksi } from '../domain/types'

const store = useKalkulatorStore()

const OPSI: { kode: KodeTransaksi; label: string }[] = [
  { kode: 'PERPANJANGAN', label: 'Perpanjangan / Pengesahan' },
  { kode: 'BALIK_NAMA', label: 'Balik Nama' },
  { kode: 'MUTASI_MASUK', label: 'Mutasi Masuk' },
  { kode: 'MUTASI_KELUAR', label: 'Mutasi Keluar' }
]

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as KodeTransaksi
  store.pilihTransaksi(v)
}
</script>