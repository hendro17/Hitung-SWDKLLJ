<template>
  <BaseCard data-testid="card-hasil" aria-live="polite">
    <h2 class="text-lg font-bold text-ink">Hasil Perhitungan</h2>
    <p class="text-sm text-mu mt-1">Estimasi tarif SWDKLLJ Anda.</p>

    <ChipRingkasan class="mt-4" />
    <span v-if="store.hasil?.keringananDiterapkan" data-testid="badge-keringanan" class="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">keringanan:aktif</span>

    <!-- Status khusus: block / lunas (diperluas Phase 5) -->
    <div v-if="store.hasil && store.hasil.status === 'belum-jatuh-tempo'" class="mt-5 rounded-2xl border border-line p-4 text-center font-semibold text-ink">
      Premi Belum Jatuh Tempo / Masih Berlaku
    </div>
    <div v-else-if="store.hasil && store.hasil.status === 'lunas'" class="mt-5 rounded-2xl border border-line p-4 text-center font-semibold text-ink">
      Lunas — Premi Rp 0
    </div>

    <dl v-else-if="store.hasil" class="mt-5 divide-y divide-line text-sm tabular-nums">
      <div class="flex items-center justify-between gap-4 py-2">
        <dt class="text-mu">Keterlambatan</dt>
        <dd class="font-semibold text-warn">{{ store.hasil.keterlambatan }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-2">
        <dt class="text-mu">Pokok berjalan</dt>
        <dd>{{ formatUang(store.hasil.pokokBerjalan) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-2">
        <dt class="text-mu">Denda berjalan</dt>
        <dd>{{ formatUang(store.hasil.dendaBerjalan) }}</dd>
      </div>
      <!-- Cap 4 tunggakan (business-logic §8): k>4 tidak pernah dirender; selective keringanan: tampil 0(keringanan) hanya bila nilai normal >0 -->
      <template v-for="k in MAKS_SLOT_TUNGGAKAN" :key="k">
        <div v-if="slotVisible(k, 'pokok')" class="flex items-center justify-between gap-4 py-2">
          <dt class="text-mu">Pokok tunggakan {{ k }}</dt>
          <dd>{{ slotPokok(k) === 0 && isKeringananSlot(k, 'pokok') ? 'Rp 0 (keringanan)' : formatUang(slotPokok(k)) }}</dd>
        </div>
        <div v-if="slotVisible(k, 'denda')" class="flex items-center justify-between gap-4 py-2">
          <dt class="text-mu">Denda tunggakan {{ k }}</dt>
          <dd>{{ slotDenda(k) === 0 && isKeringananSlot(k, 'denda') ? 'Rp 0 (keringanan)' : formatUang(slotDenda(k)) }}</dd>
        </div>
      </template>
      <div v-if="store.hasil.pokokProrata > 0" class="flex items-center justify-between gap-4 py-2">
        <dt class="text-mu">Pokok prorata ({{ store.hasil.bulanProrata }} bulan)</dt>
        <dd>{{ formatUang(store.hasil.pokokProrata) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-2">
        <dt class="font-semibold text-ink">Total estimasi</dt>
        <dd class="text-lg font-bold text-brand">{{ formatUang(store.hasil.totalPremi) }}</dd>
      </div>
    </dl>

    <div v-if="store.hasil" class="mt-4 rounded-2xl bg-brand-soft p-4">
      <p class="text-sm font-semibold text-ink">Jatuh tempo selanjutnya</p>
      <p class="text-lg font-bold text-brand">{{ formatTanggal(store.hasil.jatuhTempoSelanjutnya) }}</p>
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-2xl border-2 border-brand px-4 py-3 font-semibold text-brand hover:bg-brand-soft"
      @click="store.hitungUlang()"
    >
      Hitung Ulang
    </button>
  </BaseCard>
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue'
import ChipRingkasan from './ChipRingkasan.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import { useAdminStore } from '../stores/adminStore'

const store = useKalkulatorStore()
const admin = useAdminStore()

function isKeringananSlot(k: number, kind: 'pokok' | 'denda'): boolean {
  const d = admin.selectedKeringanan
  if (!d) return false
  const key = `${kind}Tunggakan${k}` as keyof typeof d
  return !!d[key]
}
function slotVisible(k: number, kind: 'pokok' | 'denda'): boolean {
  const v = kind === 'pokok' ? slotPokok(k) : slotDenda(k)
  if (v > 0) return true
  if (!isKeringananSlot(k, kind)) return false
  // keringanan 0: tampil hanya bila base normal >0 (slot ada)
  const h = store.hasil
  if (!h) return false
  const tunggakan = Math.min(Math.max(h.totalOverdueYears, 0), 4)
  return k <= tunggakan
}

/** Cap slot tunggakan 1..4 (business-logic §8 / domain-api §3) — jangan render k>4. */
const MAKS_SLOT_TUNGGAKAN = 4

const fmtUang = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const fmtTanggal = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

function formatUang(v: number) {
  return fmtUang.format(v)
}
function formatTanggal(d: Date) {
  return fmtTanggal.format(d)
}

function slotPokok(k: number) {
  const h = store.hasil
  if (!h) return 0
  return h[`pokokTunggakan${k}` as keyof typeof h] as number
}
function slotDenda(k: number) {
  const h = store.hasil
  if (!h) return 0
  return h[`dendaTunggakan${k}` as keyof typeof h] as number
}
</script>