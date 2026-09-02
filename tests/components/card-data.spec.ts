import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardDataKendaraan from '../../src/components/CardDataKendaraan.vue'
import { useTarifStore } from '../../src/stores/tarifStore'
import { useKalkulatorStore } from '../../src/stores/kalkulatorStore'
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

async function mountReady(): Promise<ReturnType<typeof mount>> {
  const tarif = useTarifStore()
  tarif.loadRecords(TARIF)
  const store = useKalkulatorStore()
  store.pilihTransaksi('PERPANJANGAN')
  store.lanjutkan()
  return mount(CardDataKendaraan)
}

describe('CardDataKendaraan (T027 — ui-components §3, domain-api §1)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('dropdown jenis kendaraan dirender dari tarifStore: 9 opsi = kolom deskripsi', async () => {
    const wrapper = await mountReady()
    const all = wrapper.findAll('select option')
    expect(all).toHaveLength(10) // placeholder + 9 data
    expect(all[0].text()).toBe('Pilih jenis kendaraan…')
    const options = all.slice(1)
    expect(options).toHaveLength(9)
    const text = options.map((o) => o.text())
    expect(text).toContain('Sepeda Motor Roda 2 / Roda 3')
    expect(text).toContain('Kendaraan Khusus (Ambulance, Damkar, dsb)')
    expect(text).toContain('Minibus, Jeep, Sedan, Pickup Ang. Barang')
    expect(options.map((o) => o.attributes('value'))).toEqual(['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F'])
  })

  it('radio CC dinamis per family + prefill default_cc; memilih radio adjust golongan via konfirmasiGolongan', async () => {
    const wrapper = await mountReady()
    const select = wrapper.find('select')
    await select.setValue('C1') // motor
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(2)
    expect(radios.map((r) => r.attributes('value'))).toEqual(['bawah', 'atas'])
    // prefill default_cc: C1 150 ≤ 250 → bawah terpilih
    const checked = radios.filter((r) => (r.element as HTMLInputElement).checked).map((r) => r.attributes('value'))
    expect(checked).toEqual(['bawah'])

    // pilih radio atas → golongan C2
    await radios[1].setValue()
    const store = useKalkulatorStore()
    expect(store.input.golongan).toBe('C2')
    expect(store.input.pilihanCc).toBe('atas')
  })

  it('radio OPSIONAL — tombol Hitung tetap enabled tanpa interaksi radio', async () => {
    const store = useKalkulatorStore()
    const wrapper = await mountReady()
    await wrapper.find('select').setValue('C1')
    // radio dibiarkan prefill (tidak wajib disentuh)
    await wrapper.find('input[type="date"]').setValue('2024-05-26')
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
    // golongan hasil prefill default = C1 (defaultCc 150 → bawah)
    expect(store.input.golongan).toBe('C1')
  })

  it('disabled saat tanggal invalid / golongan belum dipilih; enabled saat keduanya ada', async () => {
    const wrapper = await mountReady()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined() // tanggal & golongan kosong

    await wrapper.find('select').setValue('C1')
    expect(btn.attributes('disabled')).toBeDefined() // tanggal masih kosong

    await wrapper.find('input[type="date"]').setValue('2024-05-26')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('tariffAvailable=false → pesan eksak + tombol disabled', async () => {
    const wrapper = await mountReady()
    const tarif = useTarifStore()
    tarif.setFailed()
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Data tarif tidak tersedia — muat ulang atau perbarui aplikasi')
  })

  it('family null (A/B/EP/EU-bus) tanpa radio', async () => {
    const wrapper = await mountReady()
    await wrapper.find('select').setValue('EP')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })

  it('data-testid card-data', async () => {
    const wrapper = await mountReady()
    expect(wrapper.attributes('data-testid')).toBe('card-data')
  })
})