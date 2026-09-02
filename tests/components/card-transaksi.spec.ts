import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardTransaksi from '../../src/components/CardTransaksi.vue'
import { useKalkulatorStore } from '../../src/stores/kalkulatorStore'

describe('CardTransaksi (T026 — ui-components §3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('select berisi placeholder + 4 opsi KodeTransaksi label persis', () => {
    const wrapper = mount(CardTransaksi)
    const options = wrapper.findAll('select option')
    expect(options).toHaveLength(5)
    expect(options[0].text()).toBe('Pilih jenis transaksi…')
    const data = options.slice(1)
    const labels = data.map((o) => o.text())
    expect(labels).toEqual([
      'Perpanjangan / Pengesahan',
      'Balik Nama',
      'Mutasi Masuk',
      'Mutasi Keluar'
    ])
    expect(data.map((o) => o.attributes('value'))).toEqual([
      'PERPANJANGAN',
      'BALIK_NAMA',
      'MUTASI_MASUK',
      'MUTASI_KELUAR'
    ])
  })

  it('"Lanjutkan" disabled sebelum pilihan; memilih → store step maju', async () => {
    const store = useKalkulatorStore()
    const wrapper = mount(CardTransaksi)
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeDefined()

    await wrapper.find('select').setValue('BALIK_NAMA')
    expect(store.transaksi).toBe('BALIK_NAMA')
    // belum diklik Lanjutkan → step masih 1
    expect(store.step).toBe(1)
    expect(btn.attributes('disabled')).toBeUndefined()

    await btn.trigger('click')
    expect(store.step).toBe(2)
  })

  it('h2 "Jenis Transaksi" + data-testid card-transaksi', () => {
    const wrapper = mount(CardTransaksi)
    expect(wrapper.attributes('data-testid')).toBe('card-transaksi')
    expect(wrapper.find('h2').text()).toContain('Jenis Transaksi')
  })
})