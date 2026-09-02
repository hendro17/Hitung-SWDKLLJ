// Router model per transaksi (FR-007 strategy pattern) — dipakai T012.
import type { KodeTransaksi } from '../types'
import type { CalculationModel } from './perpanjangan'
import { modelPerpanjangan } from './perpanjangan'
import { modelBalikNama } from './balik-nama'
import { modelMutasiMasuk } from './mutasi-masuk'
import { modelMutasiKeluar } from './mutasi-keluar'

const models: Record<KodeTransaksi, CalculationModel> = {
  PERPANJANGAN: modelPerpanjangan,
  BALIK_NAMA: modelBalikNama,
  MUTASI_MASUK: modelMutasiMasuk,
  MUTASI_KELUAR: modelMutasiKeluar
}

export { modelPerpanjangan, modelBalikNama, modelMutasiMasuk, modelMutasiKeluar }
export type { CalculationModel }

export function hitungJatuhTempoSelanjutnya(transaksi: KodeTransaksi, dueDateOriginal: Date, hariIni: Date): Date {
  return models[transaksi].hitungJatuhTempoSelanjutnya(dueDateOriginal, hariIni)
}

export function tentukanStatus(transaksi: KodeTransaksi, dueDateOriginal: Date, hariIni: Date) {
  return models[transaksi].tentukanStatus(dueDateOriginal, hariIni)
}