// kalkulatorStore — state machine wizard (data-model §3); setup store. Tarif guard FR-008.
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Golongan, HasilPerhitungan, KendaraanInput, KodeTransaksi, PilihanCc } from '../domain/types'
import { hitungPerhitungan } from '../domain/hitung'
import { useTarifStore } from './tarifStore'
import { defaultPilihanCc, konfirmasiGolongan } from '../domain/denda'
import { applyKeringananSelective } from '../domain/keringanan'
import { useAdminStore } from './adminStore'

export const useKalkulatorStore = defineStore('kalkulator', () => {
  const tarifStore = useTarifStore()

  const step = ref<1 | 2 | 3>(1)
  const transaksi = ref<KodeTransaksi | null>(null)
  const input = ref<KendaraanInput>({ tanggalJatuhTempo: null, golongan: null, pilihanCc: null })
  const hasil = ref<HasilPerhitungan | null>(null)

  const adminStore = useAdminStore()
  const keringananAktif = computed(() => !!adminStore.selectedKeringanan)

  const tarifTerpilih = computed(() =>
    input.value.golongan ? tarifStore.records.find((r) => r.golongan === input.value.golongan) ?? null : null
  )

  function resetFormData() {
    input.value = { tanggalJatuhTempo: null, golongan: null, pilihanCc: null }
    hasil.value = null
  }

  function pilihTransaksi(kode: KodeTransaksi) {
    // FR-003 Option A: ganti transaksi saat wizard sudah lanjut → reset penuh
    if (transaksi.value && transaksi.value !== kode) resetFormData()
    transaksi.value = kode
    step.value = 1
  }

  function lanjutkan() {
    if (!transaksi.value) return
    step.value = 2
  }

  function setTanggal(t: Date | null) {
    input.value.tanggalJatuhTempo = t
  }

  function pilihGolongan(g: Golongan) {
    input.value.golongan = g
    // prefill radio CC dari default_cc baris (keputusan 2026-08-28 sesi 2); tidak memblokir Hitung
    const row = tarifStore.records.find((r) => r.golongan === g)
    input.value.pilihanCc = row ? defaultPilihanCc(g, row.defaultCc) : null
  }

  function pilihRadioCc(pilihan: PilihanCc) {
    if (!input.value.golongan || pilihan === null) return
    input.value.golongan = konfirmasiGolongan(input.value.golongan, pilihan)
    input.value.pilihanCc = pilihan
  }

  function hitung(hariIni: Date = new Date()) {
    if (!transaksi.value || !input.value.tanggalJatuhTempo || !input.value.golongan) return
    if (!tarifStore.tariffAvailable) return
    const tarif = tarifStore.records.find((r) => r.golongan === input.value.golongan)
    if (!tarif) return
    const base = hitungPerhitungan(
      {
        transaksi: transaksi.value,
        dueDateOriginal: input.value.tanggalJatuhTempo,
        golongan: input.value.golongan,
        pilihanCc: input.value.pilihanCc ?? undefined
      },
      tarif,
      hariIni,
      false
    )
    const doc = adminStore.selectedKeringanan
    hasil.value = doc ? applyKeringananSelective(base, doc) : base
    step.value = 3
  }

  /** "Hitung Ulang" / "Ubah" → reset ke kondisi awal (FR-003, SC-005) */
  function hitungUlang() {
    resetFormData()
    step.value = 1
  }

  function resetPenuh() {
    transaksi.value = null
    hitungUlang()
  }

  return {
    step,
    transaksi,
    input,
    hasil,
    tarifTerpilih,
    pilihTransaksi,
    lanjutkan,
    setTanggal,
    pilihGolongan,
    pilihRadioCc,
    hitung,
    hitungUlang,
    resetPenuh,
    keringananAktif
  }
})