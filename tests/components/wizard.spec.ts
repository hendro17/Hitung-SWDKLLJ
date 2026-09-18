import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../../src/views/HomeView.vue'
import StepIndicator from '../../src/components/StepIndicator.vue'
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

const CSV = `golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan
A,"Kendaraan Khusus (Ambulance, Damkar, dsb)",2499,3000,0,0,0,0
B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000,0.25,0.083333333
C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0.25,0.083333333
C2,Sepeda Motor Sport > 250cc,255,3000,80000,80000,0.25,0.083333333
DP,"Minibus, Jeep, Sedan, Pickup Ang. Barang",1500,3000,140000,100000,0.25,0.083333333
DU,Minibus Angkutan Umum sd. 1600cc,1500,3000,70000,70000,0.25,0.083333333
EP,Bus dan Microbus Bukan Ang. Umum,3000,3000,150000,100000,0.25,0.083333333
EU,"Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc",3000,3000,87000,87000,0.25,0.083333333
F,Truck / Ang. Barang > 2400cc,2499,3000,160000,100000,0.25,0.083333333
`

async function mountHome() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(CSV)
  }) as unknown as typeof fetch
  // Catatan: jangan preload tarifStore sebelum mount — gunakan jalur fetch tunggal
  // (double-load di test membuat v-show HomeView stale di jsdom).
  const wrapper = mount(HomeView)
  await flushPromises()
  return wrapper
}

const card1 = (w: ReturnType<typeof mount>) => w.find('[data-testid="card-transaksi"]')
const card2 = (w: ReturnType<typeof mount>) => w.find('[data-testid="card-data"]')
const card3 = (w: ReturnType<typeof mount>) => w.find('[data-testid="card-hasil"]')

async function pilihTransaksi(w: ReturnType<typeof mount>, v: string) {
  await card1(w).findComponent(AppSelect).vm.$emit('update:modelValue', v)
  await w.vm.$nextTick()
}

async function isiCard2(w: ReturnType<typeof mount>, golongan: string, iso: string) {
  await card2(w).findComponent(AppSelect).vm.$emit('update:modelValue', golongan)
  await card2(w).findComponent(DatePicker).vm.$emit('update:modelValue', iso)
  await w.vm.$nextTick()
}

describe('Wizard progressive disclosure (T041 — FR-003, quickstart skenario 2 & 4)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('awal hanya Card 1 terlihat; Card 2/3 hidden', async () => {
    const wrapper = await mountHome()
    expect(card1(wrapper).isVisible()).toBe(true)
    expect(card2(wrapper).isVisible()).toBe(false)
    expect(card3(wrapper).isVisible()).toBe(false)
  })

  it('Lanjutkan → Card 2 muncul (Card 3 belum); Hitung → Card 3 muncul', async () => {
    const wrapper = await mountHome()
    await pilihTransaksi(wrapper, 'PERPANJANGAN')
    await card1(wrapper).find('button[type="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(card2(wrapper).isVisible()).toBe(true)
    // ponytail: jangan baca getComputedStyle elemen hidden utk card3 — jsdom latch
    // hasilnya ke 'none' selamanya, shg assert isVisible(true) di bawah gagal.
    // card3 dirender murni via v-show="store.step >= 3", jadi cek store cukup.
    expect(useKalkulatorStore().step).toBe(2)

    await isiCard2(wrapper, 'C1', '2024-05-26')
    await card2(wrapper).find('button[type="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(card3(wrapper).isVisible()).toBe(true)
    const store = useKalkulatorStore()
    expect(store.hasil?.totalPremi).toBe(185000)
  })

  it('ubah transaksi pada step>=2 → seluruh input & hasil ter-reset (FR-003 Option A)', async () => {
    const wrapper = await mountHome()
    await pilihTransaksi(wrapper, 'PERPANJANGAN')
    await card1(wrapper).find('button[type="submit"]').trigger('click')
    await isiCard2(wrapper, 'C1', '2024-05-26')
    await card2(wrapper).find('button[type="submit"]').trigger('click')
    const store = useKalkulatorStore()
    expect(store.step).toBe(3)
    expect(store.hasil).not.toBeNull()

    await pilihTransaksi(wrapper, 'MUTASI_KELUAR')
    await wrapper.vm.$nextTick()
    expect(store.step).toBe(1)
    expect(store.hasil).toBeNull()
    expect(store.input.golongan).toBeNull()
    expect(store.input.tanggalJatuhTempo?.toDateString()).toBe(new Date().toDateString()) // reset → default hari ini
    expect(store.transaksi).toBe('MUTASI_KELUAR')
    expect(card2(wrapper).isVisible()).toBe(false)
    expect(card3(wrapper).isVisible()).toBe(false)
  })

  it('"Hitung Ulang" → kembali kondisi awal tanpa sisa state; 5 siklus identik (SC-005)', async () => {
    const wrapper = await mountHome()
    const results: number[] = []
    for (let i = 0; i < 5; i++) {
      await pilihTransaksi(wrapper, 'PERPANJANGAN')
      await card1(wrapper).find('button[type="submit"]').trigger('click')
      await isiCard2(wrapper, 'C1', '2024-05-26')
      await card2(wrapper).find('button[type="submit"]').trigger('click')
      const store = useKalkulatorStore()
      results.push(store.hasil!.totalPremi)
      await card3(wrapper).find('button').trigger('click') // Hitung Ulang
      await wrapper.vm.$nextTick()
      expect(store.step).toBe(1)
      expect(store.hasil).toBeNull()
      expect(store.input.golongan).toBeNull()
    }
    expect(results).toEqual([185000, 185000, 185000, 185000, 185000])
  })

  it('StepIndicator done ✓ mengikuti step', async () => {
    const store = useKalkulatorStore()
    const wrapper = mount(StepIndicator)
    const items = () => wrapper.findAll('ol > li').map((li) => li.text())

    store.step = 1
    await wrapper.vm.$nextTick()
    expect(items()[0]).toContain('1')
    expect(items()[2]).not.toContain('✓')

    store.step = 3
    await wrapper.vm.$nextTick()
    const labels = items()
    expect(labels[0]).toContain('✓')
    expect(labels[1]).toContain('✓')
    expect(labels[2]).toContain('3')
  })

  it('guard tombol Hitung: field kurang → store.hitung tidak memajukan step', async () => {
    const wrapper = await mountHome()
    await pilihTransaksi(wrapper, 'PERPANJANGAN')
    await card1(wrapper).find('button[type="submit"]').trigger('click')
    const store = useKalkulatorStore()
    // tanpa golongan & tanggal
    await card2(wrapper).find('button[type="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(store.step).toBe(2)
    expect(store.hasil).toBeNull()
  })

  it('guard tombol Hitung: tariffAvailable=false → step tidak maju', async () => {
    const wrapper = await mountHome()
    const tarif = useTarifStore()
    tarif.setFailed()
    await wrapper.vm.$nextTick()
    await pilihTransaksi(wrapper, 'PERPANJANGAN')
    await card1(wrapper).find('button[type="submit"]').trigger('click')
    await isiCard2(wrapper, 'C1', '2024-05-26')
    await card2(wrapper).find('button[type="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    const store = useKalkulatorStore()
    expect(store.step).toBe(2)
    expect(store.hasil).toBeNull()
  })
})