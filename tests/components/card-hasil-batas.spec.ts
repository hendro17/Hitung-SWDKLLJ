// T045 (US3) — CardHasil: status keterlambatan & batas periode penagihan.
// ui-components.md §3 CardHasil · domain-api §6.1–6.2 · business-logic §8, §6.1.
// Pola: konstruk hasil lewat hitungPerhitungan (store.hitung → domain), bukan mock objek;
// hariIni diinjeksi, tarif dari fixture mirror src/data/tarif-swdkllj.csv (C1 dst).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardHasil from '../../src/components/CardHasil.vue'
import { useKalkulatorStore } from '../../src/stores/kalkulatorStore'
import { useTarifStore } from '../../src/stores/tarifStore'
import { hitungPerhitungan } from '../../src/domain/hitung'
import type { Golongan, KodeTransaksi, TarifGolongan } from '../../src/domain/types'

// Fixture 9 baris = isi PERSIS src/data/tarif-swdkllj.csv (pola tests/unit/hitung.spec.ts)
const TARIF: TarifGolongan[] = [
  { golongan: 'A', deskripsi: 'Kendaraan Khusus (Ambulance, Damkar, dsb)', defaultCc: 2499, kartuDana: 3000, tarifPokok: 0, tarifDendaMaksimal: 0, konstantaDendaTriwulan: 0, konstantaPokokPerbulan: 0 },
  { golongan: 'B', deskripsi: 'Alat Berat (Exavator, Crane, dsb)', defaultCc: 2499, kartuDana: 3000, tarifPokok: 20000, tarifDendaMaksimal: 20000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'C1', deskripsi: 'Sepeda Motor Roda 2 / Roda 3', defaultCc: 150, kartuDana: 3000, tarifPokok: 32000, tarifDendaMaksimal: 32000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'C2', deskripsi: 'Sepeda Motor Sport > 250cc', defaultCc: 255, kartuDana: 3000, tarifPokok: 80000, tarifDendaMaksimal: 80000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'DP', deskripsi: 'Minibus, Jeep, Sedan, Pickup Ang. Barang', defaultCc: 1500, kartuDana: 3000, tarifPokok: 140000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'DU', deskripsi: 'Minibus Angkutan Umum sd. 1600cc', defaultCc: 1500, kartuDana: 3000, tarifPokok: 70000, tarifDendaMaksimal: 70000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'EP', deskripsi: 'Bus dan Microbus Bukan Ang. Umum', defaultCc: 3000, kartuDana: 3000, tarifPokok: 150000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'EU', deskripsi: 'Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc', defaultCc: 3000, kartuDana: 3000, tarifPokok: 87000, tarifDendaMaksimal: 87000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'F', deskripsi: 'Truck / Ang. Barang > 2400cc', defaultCc: 2499, kartuDana: 3000, tarifPokok: 160000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 }
]

const C1 = TARIF.find((t) => t.golongan === 'C1')!
const HARI_INI = new Date(2026, 7, 27) // 27 Agu 2026 (sama dgn hitung.spec.ts)

async function mountHasil(transaksi: KodeTransaksi, due: Date, golongan: Golongan = 'C1', hariIni: Date = HARI_INI) {
  const tarif = useTarifStore()
  tarif.loadRecords(TARIF)
  const store = useKalkulatorStore()
  store.pilihTransaksi(transaksi)
  store.lanjutkan()
  store.input.tanggalJatuhTempo = due
  store.input.golongan = golongan
  store.hitung(hariIni) // → hitungPerhitungan(input, tarifC1, hariIni, false)
  return { wrapper: mount(CardHasil), store }
}

describe('CardHasil status khusus — belum-jatuh-tempo (T045/US3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('PERPANJANGAN tunggakanCount=0 && gapDays>30 → pesan tunggal eksak menggantikan baris', async () => {
    const due = new Date(2026, 9, 6) // 6 Okt 2026 — gap 40 hari
    const { wrapper, store } = await mountHasil('PERPANJANGAN', due)
    expect(store.hasil?.status).toBe('belum-jatuh-tempo')
    expect(store.hasil?.totalPremi).toBe(0)
    expect(wrapper.text()).toContain('Premi Belum Jatuh Tempo / Masih Berlaku')
    // baris <dl> hasil TIDAK dirender
    expect(wrapper.find('dl').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Keterlambatan')
    expect(wrapper.text()).not.toContain('Pokok berjalan')
    expect(wrapper.text()).not.toContain('Total estimasi')
    expect(wrapper.text()).not.toContain('Premi Lunas')
  })

  it('pesan block TIDAK muncul utk BALIK_NAMA / MUTASI_MASUK / MUTASI_KELUAR', async () => {
    const due = new Date(2026, 9, 6) // gap 40 hari — sama dgn atas
    for (const t of ['BALIK_NAMA', 'MUTASI_MASUK', 'MUTASI_KELUAR'] as const) {
      const { wrapper, store } = await mountHasil(t, due)
      expect(store.hasil?.status).not.toBe('belum-jatuh-tempo')
      expect(wrapper.text()).not.toContain('Premi Belum Jatuh Tempo / Masih Berlaku')
      expect(wrapper.find('dl').exists()).toBe(true) // baris rincian normal
    }
  })

  it('BALIK_NAMA/MUTASI_MASUK Case B due > hariIni+1 tahun → lunas, pesan total 0', async () => {
    const due = new Date(2030, 0, 1)
    for (const t of ['BALIK_NAMA', 'MUTASI_MASUK'] as const) {
      const { wrapper, store } = await mountHasil(t, due)
      expect(store.hasil?.status).toBe('lunas')
      expect(store.hasil?.totalPremi).toBe(0)
      expect(wrapper.text()).toContain('Lunas — Premi Rp 0')
      expect(wrapper.find('dl').exists()).toBe(false)
    }
  })

  it('boundary SC-002 di tampilan: gapDays 30 → rincian; 31 → block', async () => {
    const gap30 = await mountHasil('PERPANJANGAN', new Date(2026, 8, 26))
    expect(gap30.store.hasil?.status).toBe('rincian')
    expect(gap30.store.hasil?.keterlambatan).toBe('0 tahun, 0 bulan, 0 hari')
    expect(gap30.wrapper.find('dl').exists()).toBe(true)
    expect(gap30.wrapper.text()).not.toContain('Premi Belum Jatuh Tempo / Masih Berlaku')

    const gap31 = await mountHasil('PERPANJANGAN', new Date(2026, 8, 27))
    expect(gap31.store.hasil?.status).toBe('belum-jatuh-tempo')
    expect(gap31.wrapper.find('dl').exists()).toBe(false)
  })
})

describe('CardHasil string keterlambatan & batas tunggakan (T045/US3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('hasil dihitung lewat hitungPerhitungan dgn tarif fixture C1 & hariIni injeksi (bukan mock)', () => {
    const r = hitungPerhitungan(
      { transaksi: 'PERPANJANGAN', dueDateOriginal: new Date(2024, 4, 26), golongan: 'C1' },
      C1,
      HARI_INI,
      false
    )
    expect(r.status).toBe('rincian')
    expect(r.keterlambatan).toBe('2 tahun, 3 bulan, 1 hari')
    expect(r.totalPremi).toBe(185000)
  })

  it('keterlambatan eksak 0/1/2/4 tahun + cap 4 (MIN(totalOverdueYears,4))', async () => {
    // 0 tahun, telat berjalan 1 hari (gap -93, tanpa tunggakan; totalOverdueYears=0)
    let { wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2026, 4, 26))
    expect(store.hasil?.totalOverdueYears).toBe(0)
    expect(wrapper.text()).toContain('0 tahun, 3 bulan, 1 hari')

    // 1 tahun
    ;({ wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2025, 4, 26)))
    expect(store.hasil?.totalOverdueYears).toBe(1)
    expect(wrapper.text()).toContain('1 tahun, 3 bulan, 1 hari')

    // 2 tahun
    ;({ wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2024, 4, 26)))
    expect(store.hasil?.totalOverdueYears).toBe(2)
    expect(wrapper.text()).toContain('2 tahun, 3 bulan, 1 hari')

    // 4 tahun — tepat cap
    ;({ wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2022, 4, 26)))
    expect(store.hasil?.totalOverdueYears).toBe(4)
    expect(wrapper.text()).toContain('4 tahun, 3 bulan, 1 hari')

    // >4 tahun (7 tahun) — cap tetap 4
    ;({ wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2019, 4, 26)))
    expect(store.hasil?.totalOverdueYears).toBe(7)
    expect(wrapper.text()).toContain('4 tahun, 3 bulan, 1 hari')
  })

  it('pasangan tunggakan k=5 tidak pernah dirender walau telat >4 tahun', async () => {
    const { wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2019, 4, 26)) // 7 tahun
    expect(store.hasil?.pokokTunggakan4).toBe(C1.tarifPokok + C1.kartuDana) // cap tangkap 4 slot
    const dts = wrapper.findAll('dt').map((d) => d.text())
    expect(dts.filter((l) => l.startsWith('Pokok tunggakan')).length).toBe(4)
    expect(dts.filter((l) => l.startsWith('Denda tunggakan')).length).toBe(4)
    expect(wrapper.text()).not.toContain('tunggakan 5')
  })

  it('denda berjalan 4 triwulan × konstanta × tarifDendaMaksimal; denda tunggakan flat per slot', async () => {
    // due 2 Jan 2025 → anchor 2 Jan 2026, telat 9 bulan 25 hari → triwulan 4 (cap)
    const { wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2025, 0, 2), 'C1', new Date(2026, 9, 27))
    expect(store.hasil?.keterlambatan).toBe('1 tahun, 9 bulan, 25 hari')
    const dendaBerjalan = Math.round(C1.tarifDendaMaksimal * C1.konstantaDendaTriwulan * 4)
    expect(dendaBerjalan).toBe(32000) // 0.25 × 32.000 × 4
    expect(store.hasil?.dendaBerjalan).toBe(dendaBerjalan)
    expect(store.hasil?.dendaTunggakan1).toBe(C1.tarifDendaMaksimal) // flat 100% per tunggakan
    expect(wrapper.text()).toContain('1 tahun, 9 bulan, 25 hari')
  })

  it('status rincian tetap normal (T028 tidak rusak) — baris §8 + total', async () => {
    const { wrapper, store } = await mountHasil('PERPANJANGAN', new Date(2024, 4, 26))
    expect(store.hasil?.status).toBe('rincian')
    expect(store.hasil?.totalPremi).toBe(185000)
    const dt = wrapper.findAll('dt').map((d) => d.text())
    for (const label of ['Keterlambatan', 'Pokok berjalan', 'Denda berjalan', 'Pokok tunggakan 1', 'Denda tunggakan 1', 'Pokok tunggakan 2', 'Denda tunggakan 2', 'Total estimasi']) {
      expect(dt).toContain(label)
    }
    expect(dt).not.toContain('Kartu dana')
    expect(wrapper.text()).toContain('2 tahun, 3 bulan, 1 hari')
    expect(wrapper.text()).toContain('185.000')
    expect(wrapper.text()).toContain('26 Mei 2027')
  })
})