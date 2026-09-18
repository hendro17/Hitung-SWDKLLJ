import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardTransaksi from '../../src/components/CardTransaksi.vue'
import AppSelect from '../../src/components/ui/AppSelect.vue'
import { useKalkulatorStore } from '../../src/stores/kalkulatorStore'

describe('CardTransaksi (T026 — ui-components §3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('select berisi placeholder + 4 opsi KodeTransaksi label persis', () => {
    const wrapper = mount(CardTransaksi)
    const sel = wrapper.findComponent(AppSelect)
    expect(sel.exists()).toBe(true)
    expect(sel.props('placeholder')).toBe('Pilih jenis transaksi…')
    expect(sel.props('options')).toEqual([
      { value: 'PERPANJANGAN', label: 'Perpanjangan / Pengesahan' },
      { value: 'BALIK_NAMA', label: 'Balik Nama' },
      { value: 'MUTASI_MASUK', label: 'Mutasi Masuk' },
      { value: 'MUTASI_KELUAR', label: 'Mutasi Keluar' },
    ])
    // label association keeps working: <label for="transaksi"> → trigger id
    expect(wrapper.find('label[for="transaksi"]').exists()).toBe(true)
    expect(sel.props('id')).toBe('transaksi')
  })

  it('"Lanjutkan" disabled sebelum pilihan; memilih → store step maju', async () => {
    const store = useKalkulatorStore()
    const wrapper = mount(CardTransaksi)
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()

    await wrapper.findComponent(AppSelect).vm.$emit('update:modelValue', 'BALIK_NAMA')
    await wrapper.vm.$nextTick()
    expect(store.transaksi).toBe('BALIK_NAMA')
    // belum diklik Lanjutkan → step masih 1
    expect(store.step).toBe(1)
    expect(btn.attributes('disabled')).toBeUndefined()

    await btn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(store.step).toBe(2)
  })

  it('h2 "Jenis Transaksi" + data-testid card-transaksi', () => {
    const wrapper = mount(CardTransaksi)
    expect(wrapper.attributes('data-testid')).toBe('card-transaksi')
    expect(wrapper.find('h2').text()).toContain('Jenis Transaksi')
  })
})
