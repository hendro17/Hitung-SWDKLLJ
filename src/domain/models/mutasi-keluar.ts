// MUTASI_KELUAR — business-logic §9.3 / domain-api §6.3: berjalan & prorata selalu 0, JTS = anchorDate (tervalidasi §13.2 2026-09-18: selisih <365 hari → total 0).
import type { CalculationModel } from './perpanjangan'
import { bangunDataPeriode } from '../periode'

export const modelMutasiKeluar: CalculationModel = {
  kode: 'MUTASI_KELUAR',
  hitungJatuhTempoSelanjutnya(due, hariIni) {
    return bangunDataPeriode(due, hariIni).anchorDate
  },
  tentukanStatus() {
    return 'rincian'
  }
}