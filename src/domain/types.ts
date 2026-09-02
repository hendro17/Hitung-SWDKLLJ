// Domain types — data-model.md §1–§2 + domain-api §1. Murni: tanpa import Vue/Pinia.
export type KodeTransaksi = 'PERPANJANGAN' | 'BALIK_NAMA' | 'MUTASI_KELUAR' | 'MUTASI_MASUK'
export type Golongan = 'A' | 'B' | 'C1' | 'C2' | 'DP' | 'DU' | 'EP' | 'EU' | 'F'
export type FamilyCc = 'motor' | 'minibus-au' | 'barang-penumpang-non-umum' | null
export type PilihanCc = 'bawah' | 'atas' | null
export type StatusHasil = 'rincian' | 'belum-jatuh-tempo' | 'lunas'

export interface Transaksi {
  kode: KodeTransaksi
  label: string
}

export interface KendaraanInput {
  tanggalJatuhTempo: Date | null
  golongan: Golongan | null
  pilihanCc: PilihanCc
}

export interface TarifGolongan {
  golongan: Golongan
  deskripsi: string
  defaultCc: number
  kartuDana: number
  tarifPokok: number
  tarifDendaMaksimal: number
  konstantaDendaTriwulan: number
  konstantaPokokPerbulan: number
}

export interface DataPeriode {
  dueDateOriginal: Date
  hariIni: Date
  currentYear: number
  anchorDate: Date
  gapDays: number
  totalOverdueYears: number
  tunggakanCount: number
  berjalanYear: number
  /** Slot Tunggakan N = currentYear − N, N = 1..4 */
  tunggakanYears: number[]
}

export interface HasilPerhitungan {
  status: StatusHasil
  keterlambatan: string
  pokokBerjalan: number
  dendaBerjalan: number
  pokokTunggakan1: number
  dendaTunggakan1: number
  pokokTunggakan2: number
  dendaTunggakan2: number
  pokokTunggakan3: number
  dendaTunggakan3: number
  pokokTunggakan4: number
  dendaTunggakan4: number
  pokokProrata: number
  /** Jumlah bulan prorata (hanya BALIK_NAMA/MUTASI_MASUK; 0 selainnya) */
  bulanProrata: number
  totalPremi: number
  /** JTS format tampil dd MMMM yyyy (Intl id-ID) */
  jatuhTempoSelanjutnya: Date
  keringananDiterapkan: boolean
  totalOverdueYears: number
}

export interface PeriodeKeringanan {
  mulai: string // ISO YYYY-MM-DD
  akhir: string // ISO YYYY-MM-DD
}

export interface InputHitung {
  transaksi: KodeTransaksi
  dueDateOriginal: Date
  golongan: Golongan
  /** Metadata tampilan chip saja — kalkulasi tidak memakai CC (domain-api §1) */
  pilihanCc?: PilihanCc
}

export const SEMUA_GOLONGAN: readonly Golongan[] = ['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F']
export const SEMUA_TRANSAKSI: readonly KodeTransaksi[] = ['PERPANJANGAN', 'BALIK_NAMA', 'MUTASI_KELUAR', 'MUTASI_MASUK']