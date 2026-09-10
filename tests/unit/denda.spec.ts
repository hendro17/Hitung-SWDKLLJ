import { describe, it, expect } from 'vitest'
import { roundMoney, hitungDendaBerjalan, hitungPokokProrata, konfirmasiGolongan } from '../../src/domain/denda'

describe('roundMoney (domain-api §2 / business-logic §4)', () => {
  it('CEIL(x/100)*100', () => {
    expect(roundMoney(16333.333333333334)).toBe(16400)
    expect(roundMoney(11000)).toBe(11000)
    expect(roundMoney(50)).toBe(100)
    expect(roundMoney(149.99)).toBe(200)
    expect(roundMoney(0)).toBe(0)
  })
})

describe('hitungDendaBerjalan — triwulan TANPA grace (business-logic §5.3 / domain-api §4)', () => {
  const TARIF = { tarifPokok: 32000, tarifDendaMaksimal: 32000, konstantaDendaTriwulan: 0.25 } // C1

  it('contoh verifikasi C1: anchor 26 Mei 2026 → 27 Agu 2026 (93 hari) → 16.000', () => {
    const r = hitungDendaBerjalan(new Date(2026, 4, 26), new Date(2026, 7, 27), TARIF)
    expect(r.bulanDenda).toBe(4)
    expect(r.triwulan).toBe(2)
    expect(r.denda).toBe(16000)
  })

  it('lewat 1 hari → langsung triwulan 1 (tanpa grace)', () => {
    const r = hitungDendaBerjalan(new Date(2026, 7, 26), new Date(2026, 7, 27), TARIF)
    expect(r.bulanDenda).toBe(1)
    expect(r.triwulan).toBe(1)
    expect(r.denda).toBe(8000) // 32000 × 0.25 × 1
  })

  it('boundary bulan: sisa 0 hari → fullMonths saja; sisa >0 → naik', () => {
    // 26 Mei → 26 Agu 2026 = 3 bulan genap, sisa 0
    expect(hitungDendaBerjalan(new Date(2026, 4, 26), new Date(2026, 7, 26), TARIF).bulanDenda).toBe(3)
    // 26 Mei → 27 Agu = sisa 1 → 4
    expect(hitungDendaBerjalan(new Date(2026, 4, 26), new Date(2026, 7, 27), TARIF).bulanDenda).toBe(4)
  })

  it('triwulan cap 4 — periode 12+ bulan tidak membentuk triwulan 5', () => {
    const r = hitungDendaBerjalan(new Date(2025, 7, 27), new Date(2026, 7, 27), TARIF) // tepat 365 hari
    expect(r.triwulan).toBe(4)
    expect(r.denda).toBe(TARIF.tarifPokok * 0.25 * 4)
    const r2 = hitungDendaBerjalan(new Date(2024, 2, 1), new Date(2026, 2, 1), TARIF) // 730 hari
    expect(r2.triwulan).toBe(4)
  })

  it('rollover lintas 29 Feb: 1 tahun kabisat (366 hari) tetap triwulan 4 cap', () => {
    // 2023-02-28 → 2024-02-29 = 366 hari
    const r = hitungDendaBerjalan(new Date(2023, 1, 28), new Date(2024, 1, 29), TARIF)
    expect(r.triwulan).toBe(4)
    expect(r.denda).toBe(TARIF.tarifPokok)
  })
})

describe('hitungPokokProrata — grace 0–15/>15 (business-logic §5.4 / domain-api §5)', () => {
  const POKOK = 32000
  const KARTU = 3000
  const TARIF = { tarifPokok: POKOK, kartuDana: KARTU, konstantaPokokPerbulan: 0.083333333 }

  it('contoh verifikasi: 5 bulan → 16.400; 3 bulan → 11.000', () => {
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 5, 1), TARIF).pokokProrata).toBe(16400)
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 3, 1), TARIF).pokokProrata).toBe(11000)
  })

  it('bulanProrata: sisa 0–15 hari → bawah; >15 hari → atas', () => {
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 3, 16), TARIF).bulanProrata).toBe(3)
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 3, 17), TARIF).bulanProrata).toBe(4)
  })

  it('0 bulan → pokokProrata 0 (kartu melekat pokok); Gol A (pokok 0) → kartu dana murni; 1 bulan → bulat naik', () => {
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 0, 1), TARIF).pokokProrata).toBe(0)
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 0, 1), { ...TARIF, tarifPokok: 0 }).pokokProrata).toBe(3000)
    expect(hitungPokokProrata(new Date(2026, 0, 1), new Date(2026, 1, 1), TARIF).pokokProrata).toBe(
      roundMoney(32000 * 0.083333333 * 1 + 3000)
    )
  })
})

describe('konfirmasiGolongan (domain-api §1)', () => {
  it('family null (A/B/EP/EU-bus) atau pilihan null → golongan apa adanya', () => {
    expect(konfirmasiGolongan('A', 'bawah')).toBe('A')
    expect(konfirmasiGolongan('A', 'atas')).toBe('A')
    expect(konfirmasiGolongan('B', 'bawah')).toBe('B')
    expect(konfirmasiGolongan('EP', 'atas')).toBe('EP')
    expect(konfirmasiGolongan('EU', 'atas')).toBe('EU')
    for (const g of ['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F'] as const) {
      expect(konfirmasiGolongan(g, null)).toBe(g)
    }
  })

  it('motor: bawah→C1, atas→C2', () => {
    expect(konfirmasiGolongan('C1', 'bawah')).toBe('C1')
    expect(konfirmasiGolongan('C1', 'atas')).toBe('C2')
    expect(konfirmasiGolongan('C2', 'bawah')).toBe('C1')
    expect(konfirmasiGolongan('C2', 'atas')).toBe('C2')
  })

  it('minibus-au: bawah→DU, atas→EU', () => {
    expect(konfirmasiGolongan('DU', 'bawah')).toBe('DU')
    expect(konfirmasiGolongan('DU', 'atas')).toBe('EU')
    expect(konfirmasiGolongan('EU', 'bawah')).toBe('DU')
    expect(konfirmasiGolongan('EU', 'atas')).toBe('EU')
  })

  it('non-umum: bawah→DP, atas→F', () => {
    expect(konfirmasiGolongan('DP', 'bawah')).toBe('DP')
    expect(konfirmasiGolongan('DP', 'atas')).toBe('F')
    expect(konfirmasiGolongan('F', 'bawah')).toBe('DP')
    expect(konfirmasiGolongan('F', 'atas')).toBe('F')
  })

  it('default_cc > batas family → prefill reproduksi golongan terpilih (9 baris fixture)', () => {
    // motor batas 250: C1 defaultCc 150 ≤250 → bawah; C2 defaultCc 255 >250 → atas
    expect(konfirmasiGolongan('C1', 150 > 250 ? 'atas' : 'bawah')).toBe('C1')
    expect(konfirmasiGolongan('C2', 255 > 250 ? 'atas' : 'bawah')).toBe('C2')
    // minibus-au batas 1600: DU 1500 ≤1600 → bawah; EU 3000 >1600 → atas
    expect(konfirmasiGolongan('DU', 1500 > 1600 ? 'atas' : 'bawah')).toBe('DU')
    expect(konfirmasiGolongan('EU', 3000 > 1600 ? 'atas' : 'bawah')).toBe('EU')
    // non-umum batas 2400: DP 1500 ≤2400 → bawah; F 2499 >2400 → atas
    expect(konfirmasiGolongan('DP', 1500 > 2400 ? 'atas' : 'bawah')).toBe('DP')
    expect(konfirmasiGolongan('F', 2499 > 2400 ? 'atas' : 'bawah')).toBe('F')
  })
})