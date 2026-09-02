import { describe, it, expect } from 'vitest'
import { bangunDataPeriode, setYear, tahunTunggakan } from '../../src/domain/periode'

// hariIni = 27 Agustus 2026
const HARI_INI = new Date(2026, 7, 27)

describe('DataPeriode (domain-api §3)', () => {
  it('anchorDate = SET_YEAR(due, currentYear)', () => {
    const p = bangunDataPeriode(new Date(2024, 4, 26), HARI_INI)
    expect(p.anchorDate).toEqual(new Date(2026, 4, 26))
  })

  it('gapDays signed selisih kalender absolut (presisi kabisat)', () => {
    // due 26 Mei 2024 → anchor 26 Mei 2026, hari ini 27 Agu 2026 → -93
    const p = bangunDataPeriode(new Date(2024, 4, 26), HARI_INI)
    expect(p.gapDays).toBe(-93)
    // due tahun ini, anchor 10 Okt 2026, hari ini 27 Agu 2026 → +44
    const q = bangunDataPeriode(new Date(2026, 9, 10), HARI_INI)
    expect(q.gapDays).toBe(44)
    // kabisat: 2024-02-29 → anchor SET_YEAR ke 2026 (bukan kabisat) = 2026-02-28
    const leap = bangunDataPeriode(new Date(2024, 1, 29), HARI_INI)
    expect(leap.anchorDate).toEqual(new Date(2026, 1, 28))
    // hari biasa di tahun kabisat dipertahankan: 2023-02-28 → anchor 2024-02-28; selisih 1 hari ke 2024-02-29
    const kabisat = bangunDataPeriode(new Date(2023, 1, 28), new Date(2024, 1, 29))
    expect(kabisat.anchorDate).toEqual(new Date(2024, 1, 28))
    expect(kabisat.gapDays).toBe(-1)
  })

  it('totalOverdueYears = currentYear - year(due)', () => {
    const p = bangunDataPeriode(new Date(2024, 4, 26), HARI_INI)
    expect(p.totalOverdueYears).toBe(2)
    const q = bangunDataPeriode(new Date(2026, 4, 26), HARI_INI)
    expect(q.totalOverdueYears).toBe(0)
  })

  it('tunggakanCount = MIN(totalOverdueYears, 4)', () => {
    expect(bangunDataPeriode(new Date(2024, 4, 26), HARI_INI).tunggakanCount).toBe(2)
    expect(bangunDataPeriode(new Date(2022, 4, 26), HARI_INI).tunggakanCount).toBe(4)
    expect(bangunDataPeriode(new Date(2020, 4, 26), HARI_INI).tunggakanCount).toBe(4)
    expect(bangunDataPeriode(new Date(2026, 4, 26), HARI_INI).tunggakanCount).toBe(0)
  })

  it('berjalanYear: gapDays>30 → currentYear, else currentYear+1; boundary 30 vs 31', () => {
    // gap = 31 (anchor 27 Sep 2026, hari ini 27 Agu 2026) → berjalan = 2026
    const p31 = bangunDataPeriode(new Date(2026, 8, 27), HARI_INI)
    expect(p31.gapDays).toBe(31)
    expect(p31.berjalanYear).toBe(2026)
    // gap = 30 (anchor 26 Sep 2026: 27 Agu → 26 Sep = 30 hari) → berjalan = 2027
    const p30 = bangunDataPeriode(new Date(2026, 8, 26), HARI_INI)
    expect(p30.gapDays).toBe(30)
    expect(p30.berjalanYear).toBe(2027)
    // gap = 0 (jatuh tempo hari ini) → berjalan = 2027
    const p0 = bangunDataPeriode(new Date(2026, 7, 27), HARI_INI)
    expect(p0.gapDays).toBe(0)
    expect(p0.berjalanYear).toBe(2027)
  })

  it('slot Tunggakan N = currentYear − N', () => {
    const p = bangunDataPeriode(new Date(2024, 4, 26), HARI_INI)
    expect(tahunTunggakan(2026, 1)).toBe(2025)
    expect(tahunTunggakan(2026, 2)).toBe(2024)
    expect(tahunTunggakan(2026, 3)).toBe(2023)
    expect(tahunTunggakan(2026, 4)).toBe(2022)
    expect(p.tunggakanYears).toEqual([2025, 2024, 2023, 2022])
  })

  it('setYear: Feb 29 → Feb 28 pada tahun non-kabisat, dipertahankan pada tahun kabisat', () => {
    expect(setYear(new Date(2024, 1, 29), 2026)).toEqual(new Date(2026, 1, 28))
    expect(setYear(new Date(2024, 1, 29), 2028)).toEqual(new Date(2028, 1, 29))
    expect(setYear(new Date(2024, 4, 26), 2027)).toEqual(new Date(2027, 4, 26))
  })
})