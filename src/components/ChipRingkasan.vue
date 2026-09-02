<template>
  <div data-testid="chip-ringkasan" class="flex flex-wrap gap-2 rounded-full text-sm font-medium text-ink">
    <span v-for="(c, i) in chips" :key="i" class="rounded-full bg-brand-soft px-3 py-1">{{ c }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import { useTarifStore } from '../stores/tarifStore'
import { batasFamily, familyGolongan, labelPilihanPilihanCc } from '../domain/denda'

const store = useKalkulatorStore()
const tarifStore = useTarifStore()

const LABEL_TRANSAKSI: Record<string, string> = {
  PERPANJANGAN: 'Perpanjangan / Pengesahan',
  BALIK_NAMA: 'Balik Nama',
  MUTASI_MASUK: 'Mutasi Masuk',
  MUTASI_KELUAR: 'Mutasi Keluar'
}

const chips = computed<string[]>(() => {
  const list: string[] = []
  if (store.transaksi && LABEL_TRANSAKSI[store.transaksi]) list.push(LABEL_TRANSAKSI[store.transaksi])
  const row = store.input.golongan ? tarifStore.records.find((r) => r.golongan === store.input.golongan) : undefined
  if (row) list.push(row.deskripsi)
  if (store.input.pilihanCc && store.input.golongan) {
    const b = batasFamily(familyGolongan(store.input.golongan))
    if (b !== null) {
      const label = labelPilihanPilihanCc(store.input.pilihanCc, b)
      if (label) list.push(label)
    }
  }
  return list
})
</script>