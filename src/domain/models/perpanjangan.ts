// PERPANJANGAN — business-logic §9.1 / domain-api §6.1 (research R8: strategy pattern DIPERTAHANKAN).
import type { KodeTransaksi, StatusHasil } from '../types'
import { hariAntara, setYear, tambahTahun } from '../periode'

export interface CalculationModel {
  kode: KodeTransaksi
  /** Jatuh tempo selanjutnya utk modul ini (domain-api §6). */
  hitungJatuhTempoSelanjutnya(dueDateOriginal: Date, hariIni: Date): Date
  /** Status keputusan modul: PERPANJANGAN punya block; model lain rincian/lunas. */
  tentukanStatus(dueDateOriginal: Date, hariIni: Date): StatusHasil
}

export const modelPerpanjangan: CalculationModel = {
  kode: 'PERPANJANGAN',
  // Sisa masa berlaku = due − today.
  // >30 hari → belum waktunya (JTS tetap due). ≤30 hari → JTS = anchor + 1.
  // Khusus expired dengan anchor >30 hari lagi: hanya tahun berjalan yang dibeli
  // (sampai anchor) — renewal berikutnya di anchor, bukan anchor+1.
  hitungJatuhTempoSelanjutnya(due, hariIni) {
    if (hariAntara(due, hariIni) > 30) return due
    const anchor = setYear(due, hariIni.getFullYear())
    if (hariAntara(anchor, hariIni) > 30) return anchor
    return tambahTahun(anchor, 1)
  },
  // Blok hanya bila STNK masih valid >30 hari (renewal terlalu dini).
  tentukanStatus(due, hariIni) {
    if (due > hariIni && hariAntara(due, hariIni) > 30) return 'belum-jatuh-tempo'
    return 'rincian'
  }
}