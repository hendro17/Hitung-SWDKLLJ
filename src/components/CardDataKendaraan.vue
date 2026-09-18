<template>
  <BaseCard data-testid="card-data">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-ink">Data Kendaraan</h2>
        <p class="text-sm text-mu mt-1">Lengkapi data untuk menghitung premi.</p>
      </div>
      <button
        type="button"
        class="rounded-full text-sm font-semibold text-brand underline-offset-2 hover:underline"
        @click="store.hitungUlang()"
      >
        Ubah
      </button>
    </div>

    <p v-if="!tarifStore.tariffAvailable" class="mt-3 rounded-2xl bg-warn/10 px-4 py-2 text-sm font-medium text-warn" role="alert">
      Data tarif tidak tersedia — muat ulang atau perbarui aplikasi
    </p>

    <form class="mt-4 space-y-4" @submit.prevent="onHitung">
      <div>
        <label for="tanggal" class="block text-sm font-semibold text-ink">Tanggal jatuh tempo</label>
        <div class="mt-2">
          <DatePicker id="tanggal" v-model="tanggalModel" placeholder="Pilih tanggal jatuh tempo" />
        </div>
      </div>

      <div>
        <label for="jenis" class="block text-sm font-semibold text-ink">Jenis kendaraan</label>
        <div class="mt-2">
          <AppSelect
            id="jenis"
            v-model="golonganModel"
            :options="golonganOptions"
            placeholder="Pilih jenis kendaraan…"
          />
        </div>
      </div>

      <fieldset v-if="radioBatas !== null">
        <legend class="text-sm font-semibold text-ink">CC mesin</legend>
        <div class="mt-2 flex gap-2">
          <label
            v-for="(o, oi) in OPSI_RADIO"
            :key="oi"
            class="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink has-checked:border-brand has-checked:bg-brand-soft"
          >
            <input
              type="radio"
              name="cc"
              :value="o.value"
              :checked="store.input.pilihanCc === o.value"
              class="accent-brand"
              :aria-label="o.label"
              @change="store.pilihRadioCc(o.value)"
            />
            {{ o.label }}
          </label>
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          class="w-full rounded-2xl bg-brand-strong px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!bolehHitung"
          @click="onHitung"
        >
          Hitung Premi SWDKLLJ
        </button>
        <p v-if="!bolehHitung" class="mt-2 text-center text-sm text-mu">Lengkapi tanggal jatuh tempo dan jenis kendaraan.</p>
      </div>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import BaseCard from './BaseCard.vue'
import AppSelect from './ui/AppSelect.vue'
import DatePicker from './ui/DatePicker.vue'
import { useKalkulatorStore } from '../stores/kalkulatorStore'
import { useTarifStore } from '../stores/tarifStore'
import { batasFamily, familyGolongan } from '../domain/denda'
import type { Golongan, PilihanCc } from '../domain/types'

const store = useKalkulatorStore()
const tarifStore = useTarifStore()

const radioBatas = computed<number | null>(() =>
  store.input.golongan ? batasFamily(familyGolongan(store.input.golongan)) : null
)

const OPSI_RADIO = computed(() => {
  const b = radioBatas.value
  const opsi: { value: PilihanCc; label: string }[] = []
  if (b === null) return opsi
  opsi.push({ value: 'bawah', label: `≤ ${b}cc` }, { value: 'atas', label: `> ${b}cc` })
  return opsi
})

const golonganOptions = computed(() =>
  tarifStore.records.map((r) => ({ value: r.golongan, label: r.deskripsi }))
)

function toIso(t: Date | null): string {
  if (!t) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`
}

const tanggalModel = computed({
  get: () => toIso(store.input.tanggalJatuhTempo),
  set: (v: string) => store.setTanggal(v ? parseTanggal(v) : null),
})

const golonganModel = computed<string>({
  get: () => store.input.golongan ?? '',
  set: (v) => {
    if (v) store.pilihGolongan(v as Golongan)
  }
})

function parseTanggal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const bolehHitung = computed(
  () => tarifStore.tariffAvailable && store.input.golongan !== null && store.input.tanggalJatuhTempo !== null
)

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

async function onHitung() {
  store.hitung()
  await nextTick()
  if (store.step >= 3) focusCard('card-hasil')
}
</script>
