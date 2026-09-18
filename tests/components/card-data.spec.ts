import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardDataKendaraan from '../../src/components/CardDataKendaraan.vue'
import AppSelect from '../../src/components/ui/AppSelect.vue'
import DatePicker from '../../src/components/ui/DatePicker.vue'
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

async function pilihGolongan(wrapper: ReturnType<typeof mount>, v: string) {
  await wrapper.findComponent(AppSelect).vm.$emit('update:modelValue', v)
  await wrapper.vm.$nextTick()
}

async function isiTanggal(wrapper: ReturnType<typeof mount>, iso: string) {
  await wrapper.findComponent(DatePicker).vm.$emit('update:modelValue', iso)
  await wrapper.vm.$nextTick()
}

describe('CardDataKendaraan (T027 — ui-components §3, domain-api §1)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('dropdown jenis kendaraan dirender dari tarifStore: 9 opsi = kolom deskripsi', async () => {
    const wrapper = await mountReady()
    const sel = wrapper.findComponent(AppSelect)
    expect(sel.exists()).toBe(true)
    expect(sel.props('placeholder')).toBe('Pilih jenis kendaraan…')
    expect(sel.props('id')).toBe('jenis')
    const options = sel.props('options') as { value: string; label: string }[]
    expect(options).toHaveLength(9)
    expect(options.map((o) => o.label)).toContain('Sepeda Motor Roda 2 / Roda 3')
    expect(options.map((o) => o.label)).toContain('Kendaraan Khusus (Ambulance, Damkar, dsb)')
    expect(options.map((o) => o.label)).toContain('Minibus, Jeep, Sedan, Pickup Ang. Barang')
    expect(options.map((o) => o.value)).toEqual(['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F'])
    expect(wrapper.find('label[for="jenis"]').exists()).toBe(true)
  })

  it('DatePicker terikat ke store via string YYYY-MM-DD; label for="tanggal" terjaga', async () => {
    const wrapper = await mountReady()
    const dp = wrapper.findComponent(DatePicker)
    expect(dp.exists()).toBe(true)
    expect(wrapper.find('label[for="tanggal"]').exists()).toBe(true)
    // default = hari ini (bukan placeholder kosong)
    const t = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    expect(dp.props('modelValue')).toBe(`${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`)
    await isiTanggal(wrapper, '2024-05-26')
    const store = useKalkulatorStore()
    expect(store.input.tanggalJatuhTempo).toBeInstanceOf(Date)
    expect(dp.props('modelValue')).toBe('2024-05-26')
  })

  it('radio CC dinamis per family + prefill default_cc; memilih radio adjust golongan via konfirmasiGolongan', async () => {
    const wrapper = await mountReady()
    await pilihGolongan(wrapper, 'C1') // motor
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
    await pilihGolongan(wrapper, 'C1')
    // radio dibiarkan prefill (tidak wajib disentuh)
    await isiTanggal(wrapper, '2024-05-26')
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
    // golongan hasil prefill default = C1 (defaultCc 150 → bawah)
    expect(store.input.golongan).toBe('C1')
  })

  it('disabled saat golongan belum dipilih / tanggal dikosongkan; enabled saat keduanya ada', async () => {
    const wrapper = await mountReady()
    const store = useKalkulatorStore()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined() // golongan kosong (tanggal default hari ini)

    await pilihGolongan(wrapper, 'C1')
    expect(btn.attributes('disabled')).toBeUndefined() // tanggal default hari ini + golongan ada

    store.setTanggal(null)
    await wrapper.vm.$nextTick()
    expect(btn.attributes('disabled')).toBeDefined() // tanggal dikosongkan

    await isiTanggal(wrapper, '2024-05-26')
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
    await pilihGolongan(wrapper, 'EP')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })

  it('data-testid card-data', async () => {
    const wrapper = await mountReady()
    expect(wrapper.attributes('data-testid')).toBe('card-data')
  })
})
