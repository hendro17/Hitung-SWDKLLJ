// PERPANJANGAN — business-logic §9.1 / domain-api §6.1 (research R8: strategy pattern DIPERTAHANKAN).
import type { KodeTransaksi, StatusHasil } from '../types'
import { bangunDataPeriode, setYear } from '../periode'

export interface CalculationModel {
  kode: KodeTransaksi
  /** Jatuh tempo selanjutnya utk modul ini (domain-api §6). */
  hitungJatuhTempoSelanjutnya(dueDateOriginal: Date, hariIni: Date): Date
  /** Status keputusan modul: PERPANJANGAN punya block; model lain rincian/lunas. */
  tentukanStatus(dueDateOriginal: Date, hariIni: Date): StatusHasil
}

export const modelPerpanjangan: CalculationModel = {
  kode: 'PERPANJANGAN',
  // gap>30 → anchorDate (tahun tetap currentYear); else SET_YEAR(due, currentYear+1)
  hitungJatuhTempoSelanjutnya(due, hariIni) {
    const p = bangunDataPeriode(due, hariIni)
    if (p.gapDays > 30) return p.anchorDate
    return setYear(due, hariIni.getFullYear() + 1)
  },
  tentukanStatus(due, hariIni) {
    const p = bangunDataPeriode(due, hariIni)
    if (p.tunggakanCount === 0 && p.gapDays > 30) return 'belum-jatuh-tempo'
    return 'rincian'
  }
}