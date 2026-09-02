import { describe, it, expect } from 'vitest'
import { hitungJatuhTempoSelanjutnya } from '../../../src/domain/models/index'
import type { KodeTransaksi } from '../../../src/domain/types'
import { setYear } from '../../../src/domain/periode'

const HARI_INI = new Date(2026, 7, 27)
const DUE = new Date(2024, 4, 26)

function jts(t: KodeTransaksi, due: Date = DUE, hariIni: Date = HARI_INI): Date {
  return hitungJatuhTempoSelanjutnya(t, due, hariIni)
}

describe('JTS per modul (domain-api §6 / T012)', () => {
  it('PERPANJANGAN gap>30 → anchorDate (tahun tetap current_year)', () => {
    const due = new Date(2026, 9, 6) // 40 hari setelah hariIni
    expect(jts('PERPANJANGAN', due)).toEqual(due)
  })

  it('PERPANJANGAN gap<=30 (termasuk overdue) → SET_YEAR(due, y+1)', () => {
    expect(jts('PERPANJANGAN')).toEqual(new Date(2027, 4, 26))
    const due = new Date(2026, 7, 20) // gap -7: overdue
    expect(jts('PERPANJANGAN', due)).toEqual(new Date(2027, 7, 20))
  })

  it('BALIK_NAMA Case A → hariIni + 1 tahun', () => {
    expect(jts('BALIK_NAMA')).toEqual(new Date(2027, 7, 27))
  })

  it('MUTASI_MASUK identik BALIK_NAMA 100%', () => {
    expect(jts('MUTASI_MASUK')).toEqual(new Date(2027, 7, 27))
  })

  it('MUTASI_KELUAR → anchorDate selalu', () => {
    expect(jts('MUTASI_KELUAR')).toEqual(new Date(2026, 4, 26))
  })

  it('lompatan 29 Feb pada SET_YEAR: Feb 29 → Feb 28 di tahun non-kabisat', () => {
    const due = new Date(2024, 1, 29)
    expect(setYear(due, 2026)).toEqual(new Date(2026, 1, 28))
    expect(setYear(due, 2028)).toEqual(new Date(2028, 1, 29))
  })
})

// ⚠️ OPEN VALIDATION (business-logic §13.2) — ASUMSI, BUKAN FINAL.
describe('pending-validasi §13.2 — MUTASI_KELUAR tunggakanCount=0 (asumsi JTS = anchorDate)', () => {
  // Asumsi terdokumentasi: bila tidak ada tunggakan sama sekali, JTS tetap anchorDate.
  // Belum dikonfirmasi user; JANGAN dipasarkan sebagai perilaku final.
  it('due tanpa tunggakan → JTS tetap anchorDate', () => {
    const due = new Date(2026, 9, 6)
    expect(jts('MUTASI_KELUAR', due)).toEqual(due)
  })
})