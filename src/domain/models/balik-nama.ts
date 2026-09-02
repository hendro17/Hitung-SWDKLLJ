// BALIK_NAMA — business-logic §9.2 / domain-api §6.2. Case A → JTS hariIni+1 tahun; Case B lunas/prorata.
import type { CalculationModel } from './perpanjangan'
import { tambahTahun } from '../periode'

export const modelBalikNama: CalculationModel = {
  kode: 'BALIK_NAMA',
  hitungJatuhTempoSelanjutnya(_due, hariIni) {
    // Case A: JTS = hariIni + 1 tahun. Case B: periode aktif lanjut → hariIni + 1 tahun juga.
    return tambahTahun(hariIni, 1)
  },
  tentukanStatus(due, hariIni) {
    // Case B — STNK masih berlaku penuh & lebih dari 1 tahun lagi → lunas
    if (due > tambahTahun(hariIni, 1)) return 'lunas'
    return 'rincian'
  }
}

/** Titik awal prorata Case B (asumsi §13.1: anniversary = dueDateOriginal − 1 tahun). */
export function anniversaryProrata(due: Date): Date {
  const d = new Date(due)
  d.setFullYear(due.getFullYear() - 1, due.getMonth(), due.getDate())
  if (d.getDate() !== due.getDate()) d.setDate(0)
  return d
}