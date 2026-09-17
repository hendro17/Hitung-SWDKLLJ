// PERPANJANGAN — business-logic §9.1 / domain-api §6.1 (research R8: strategy pattern DIPERTAHANKAN).
import type { KodeTransaksi, StatusHasil } from '../types'
import { hariAntara, setYear, tambahTahun } from '../periode'

export interface CalculationModel {
  kode: KodeTransaksi
  /** Jatuh tempo selanjutnya utk modul ini (domain-api §6). */
  hitungJatuhTempoSelanjutnya(dueDateOriginal: Date, hariIni: Date, windowDays?: number): Date
  /** Status keputusan modul: PERPANJANGAN punya block; model lain rincian/lunas. */
  tentukanStatus(dueDateOriginal: Date, hariIni: Date, windowDays?: number): StatusHasil
}

export const modelPerpanjangan: CalculationModel = {
  kode: 'PERPANJANGAN',
  // Sisa masa berlaku = due − today.
  // >windowDays → belum waktunya (JTS tetap due). ≤windowDays → JTS = anchor + 1.
  // Khusus expired dengan anchor >windowDays: hanya tahun berjalan yang dibeli
  // (sampai anchor) — renewal berikutnya di anchor, bukan anchor+1.
  hitungJatuhTempoSelanjutnya(due, hariIni, windowDays = 30) {
    if (hariAntara(due, hariIni) > windowDays) return due
    const anchor = setYear(due, hariIni.getFullYear())
    if (hariAntara(anchor, hariIni) > windowDays) return anchor
    return tambahTahun(anchor, 1)
  },
  // Blok hanya bila STNK masih valid >windowDays (renewal terlalu dini).
  tentukanStatus(due, hariIni, windowDays = 30) {
    if (due > hariIni && hariAntara(due, hariIni) > windowDays) return 'belum-jatuh-tempo'
    return 'rincian'
  }
}