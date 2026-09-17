import { describe, it, expect } from 'vitest'
import { hitungPerhitungan } from '../../src/domain/hitung'
import { normalizeHariTambahan, DASAR_JENDELA_HARI } from '../../src/domain/keringanan'
import type { TarifGolongan, InputHitung } from '../../src/domain/types'

const TARIF: TarifGolongan = {
  golongan: 'C1', deskripsi: 'Motor', defaultCc: 150, kartuDana: 3000,
  tarifPokok: 32000, tarifDendaMaksimal: 32000,
  konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333
}
const BUNDLED = 35000
const HARI_INI = new Date(2026, 7, 27) // 27 Agu 2026
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const hitung = (due: Date, windowDays = 30, transaksi: InputHitung['transaksi'] = 'PERPANJANGAN', keringananAktif = false) =>
  hitungPerhitungan({ transaksi, dueDateOriginal: due, golongan: 'C1' }, TARIF, HARI_INI, { keringananAktif, windowDays })

describe('kebijakan tambahan hari — Pokok YAD', () => {
  it('1. doc lama tanpa hariTambahan → normalize 30 → jendela 60', () => {
    expect(normalizeHariTambahan(undefined)).toBe(30)
    expect(DASAR_JENDELA_HARI + normalizeHariTambahan(undefined)).toBe(60)
  })
  it('2. tanpa doc → jendela 30; due +45 → belum-jatuh-tempo', () => {
    const r = hitung(addDays(HARI_INI, 45), 30)
    expect(r.status).toBe('belum-jatuh-tempo')
    expect(r.pokokYad).toBe(0)
  })
  it('3. tanpa tunggakan, due = today+45, jendela 60 → rincian, berjalan terisi, pokokYad 0', () => {
    const due = addDays(HARI_INI, 45)
    const r = hitung(due, 60)
    expect(r.status).toBe('rincian')
    expect(r.pokokBerjalan).toBe(BUNDLED)
    expect(r.pokokYad).toBe(0)
    expect(r.jatuhTempoSelanjutnya.getFullYear()).toBe(due.getFullYear() + 1)
  })
  it('4. tunggakan 1, anchor +45, jendela 60 → slot + berjalan + pokokYad; JTS = anchor+1', () => {
    // due 2024-10-11 → anchor 2026-10-11 (+45 hari), tunggakan 1, gap 45 ∈ (30,60]
    const due = new Date(2024, 9, 11)
    const r = hitung(due, 60)
    expect(r.pokokTunggakan1).toBe(BUNDLED)
    expect(r.pokokBerjalan).toBe(BUNDLED)
    expect(r.pokokYad).toBe(BUNDLED)
    expect(r.totalPremi).toBe(r.pokokBerjalan + r.dendaBerjalan + r.pokokTunggakan1 + r.dendaTunggakan1 + r.pokokYad)
    expect(r.jatuhTempoSelanjutnya.getFullYear()).toBe(2027)
  })
  it('5. tunggakan, anchor +100, jendela 60 → pokokYad 0, JTS = anchor', () => {
    const due = new Date(2025, 11, 5) // anchor 2026-12-05 (+100 hari)
    const r = hitung(due, 60)
    expect(r.pokokYad).toBe(0)
    expect(r.jatuhTempoSelanjutnya.getTime()).toBe(new Date(2026, 11, 5).getTime())
  })
  it('6. BALIK_NAMA / MUTASI tidak terpengaruh windowDays', () => {
    const due = addDays(HARI_INI, 45)
    for (const t of ['BALIK_NAMA', 'MUTASI_MASUK', 'MUTASI_KELUAR'] as const) {
      const a = hitung(due, 30, t)
      const b = hitung(due, 60, t)
      expect(b.pokokYad).toBe(0)
      expect(b.totalPremi).toBe(a.totalPremi)
    }
  })
  it('7. normalizeHariTambahan: undefined → 30 (dok lama); 0 → 0; 2/5 → 2/5; 30.7 → 30; negatif → 0', () => {
    expect(normalizeHariTambahan(undefined)).toBe(30)
    expect(normalizeHariTambahan(0)).toBe(0)
    expect(normalizeHariTambahan(2)).toBe(2)
    expect(normalizeHariTambahan(5)).toBe(5)
    expect(DASAR_JENDELA_HARI + normalizeHariTambahan(5)).toBe(35)
    expect(normalizeHariTambahan(31)).toBe(31)
    expect(normalizeHariTambahan(30.7)).toBe(30)
    expect(normalizeHariTambahan(-3)).toBe(0)
  })
})
