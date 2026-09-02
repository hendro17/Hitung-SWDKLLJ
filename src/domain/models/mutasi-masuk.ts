// MUTASI_MASUK — business-logic §9.4: delegasi 100% logika balik-nama.ts.
import type { CalculationModel } from './perpanjangan'
import { modelBalikNama } from './balik-nama'

export const modelMutasiMasuk: CalculationModel = {
  kode: 'MUTASI_MASUK',
  hitungJatuhTempoSelanjutnya: modelBalikNama.hitungJatuhTempoSelanjutnya,
  tentukanStatus: modelBalikNama.tentukanStatus
}