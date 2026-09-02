import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardHasil from '../../src/components/CardHasil.vue'
import { useKalkulatorStore } from '../../src/stores/kalkulatorStore'
import { useTarifStore } from '../../src/stores/tarifStore'
import { hitungPerhitungan } from '../../src/domain/hitung'
import type { TarifGolongan } from '../../src/domain/types'

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

async function mountRincian() {
  const tarif = useTarifStore()
  tarif.loadRecords(TARIF)
  const store = useKalkulatorStore()
  store.pilihTransaksi('PERPANJANGAN')
  store.lanjutkan()
  store.input.tanggalJatuhTempo = new Date(2024, 4, 26)
  store.input.golongan = 'C1'
  store.input.pilihanCc = 'bawah'
  store.hitung(new Date(2026, 7, 27))
  expect(store.hasil?.totalPremi).toBe(185000)
  return mount(CardHasil)
}

describe('CardHasil (T028 — ui-components §3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('status rincian: semua baris §8 muncul', async () => {
    const wrapper = await mountRincian()
    const dt = wrapper.findAll('dt').map((d) => d.text())
    for (const label of [
      'Keterlambatan',
      'Pokok berjalan',
      'Denda berjalan',
      'Pokok tunggakan 1',
      'Denda tunggakan 1',
      'Pokok tunggakan 2',
      'Denda tunggakan 2',
      'Total estimasi'
    ]) {
      expect(dt).toContain(label)
    }
    expect(dt).not.toContain('Kartu dana')
    // PERPANJANGAN: tanpa pokok prorata
    expect(dt).not.toContain('Pokok prorata')
    expect(wrapper.text()).toContain('2 tahun, 3 bulan, 1 hari')
    expect(wrapper.text()).toContain('185.000')
    expect(wrapper.text()).toContain('26 Mei 2027')
  })

  it('chip ringkasan transaksi · golongan · CC', async () => {
    const wrapper = await mountRincian()
    const chip = wrapper.find('[data-testid="chip-ringkasan"]')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toContain('Perpanjangan / Pengesahan')
    expect(chip.text()).toContain('Sepeda Motor Roda 2 / Roda 3')
    expect(chip.text()).toContain('≤ 250cc')
  })

  it('aria-live polite + data-testid card-hasil', async () => {
    const wrapper = await mountRincian()
    expect(wrapper.attributes('data-testid')).toBe('card-hasil')
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('tombol "Hitung Ulang" mereset ke Card 1 (FR-003 / SC-005)', async () => {
    const store = useKalkulatorStore()
    const wrapper = await mountRincian()
    await wrapper.find('button').trigger('click')
    expect(store.step).toBe(1)
    expect(store.hasil).toBeNull()
  })
})