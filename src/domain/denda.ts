// Denda & prorata — domain-api §2, §4–§5 / business-logic §4–§5.3–5.4. Murni.
import type { Golongan, PilihanCc } from './types'

/** roundMoney = CEIL(x/100)*100 (business-logic §4) — hanya utk nilai kalkulasi. */
export function roundMoney(x: number): number {
  return Math.ceil(x / 100) * 100
}

/** Jumlah bulan kalender penuh antara titikAwal → titikAkhir (bisa 0), plus sisa hari.
 *  Bila titikAkhir sebelum titikAwal (anchor di masa depan) → 0 bulan, 0 hari. */
export function bulanPenuhDanSisa(titikAwal: Date, titikAkhir: Date): { fullMonths: number; remainingDays: number } {
  if (titikAkhir < titikAwal) return { fullMonths: 0, remainingDays: 0 }
  let fullMonths =
    (titikAkhir.getFullYear() - titikAwal.getFullYear()) * 12 + (titikAkhir.getMonth() - titikAwal.getMonth())
  if (titikAkhir.getDate() < titikAwal.getDate()) fullMonths -= 1
  const anchor = new Date(titikAwal)
  anchor.setMonth(anchor.getMonth() + fullMonths)
  const ua = Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  const ub = Date.UTC(titikAkhir.getFullYear(), titikAkhir.getMonth(), titikAkhir.getDate())
  const remainingDays = Math.round((ub - ua) / 86_400_000)
  return { fullMonths, remainingDays }
}

export interface HasilDendaBerjalan {
  bulanDenda: number
  triwulan: number
  denda: number
  /** Sisa hari setelah bulan penuh — dipakai string keterlambatan "{N} tahun, {M} bulan, {Z} hari" */
  hariDendaBerjalan: number
}

const MS_PER_DAY = 86_400_000
const HARI_PER_TRIWULAN = 90
const MAKS_TRIWULAN = 4

/** Parameter tarif denda berjalan — subset TarifGolongan (structural typing). */
export interface TarifDenda {
  tarifPokok: number
  tarifDendaMaksimal: number
  konstantaDendaTriwulan: number
}

/** Denda berjalan PMK 16/PMK.010/2017 §5.3 — % berjenjang dari tarif pokok:
 *  1-90 hari=25%, 91-180=50%, 181-270=75%, >270=100% (cap tarifDendaMaksimal, maks Rp100.000).
 *  Q1=1-90, Q2=91-180, Q3=181-270, Q4=271-360 (+1 kabisat → 271-361).
 *  denda = min(Q × konstanta × tarifPokok, tarifDendaMaksimal). hari≤0 → Q0 denda 0. */
export function hitungDendaBerjalan(titikAwal: Date, hariIni: Date, tarif: TarifDenda): HasilDendaBerjalan {
  const { fullMonths, remainingDays } = bulanPenuhDanSisa(titikAwal, hariIni)
  const bulanDenda = fullMonths + (remainingDays > 0 ? 1 : 0)
  const ua = Date.UTC(titikAwal.getFullYear(), titikAwal.getMonth(), titikAwal.getDate())
  const ub = Date.UTC(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate())
  const hari = Math.round((ub - ua) / MS_PER_DAY)
  let triwulan = 0
  if (hari > 0) triwulan = Math.min(Math.ceil(hari / HARI_PER_TRIWULAN), MAKS_TRIWULAN)
  const raw = Math.round(tarif.tarifPokok * tarif.konstantaDendaTriwulan * triwulan)
  const denda = Math.min(raw, tarif.tarifDendaMaksimal)
  return { bulanDenda, triwulan, denda, hariDendaBerjalan: remainingDays }
}

export interface HasilPokokProrata {
  bulanProrata: number
  pokokProrata: number
}

/** Parameter tarif prorata pokok — subset TarifGolongan (structural typing). */
export interface TarifProrata {
  tarifPokok: number
  kartuDana: number
  konstantaPokokPerbulan: number
}

/** Pokok prorata dgn grace 0–15/>15 hari (business-logic §5.4). Konstanta per bulan dari tabel.
 *  Kartu dana melekat pokok: bulan 0 & tarifPokok > 0 → 0 (tanpa kartu).
 *  Pengecualian Golongan A (tarifPokok = 0): bulan 0 → kartu dana murni (A hanya bayar kartu dana). */
export function hitungPokokProrata(titikAwal: Date, titikAkhir: Date, tarif: TarifProrata): HasilPokokProrata {
  const { fullMonths, remainingDays } = bulanPenuhDanSisa(titikAwal, titikAkhir)
  const bulanProrata = fullMonths + (remainingDays > 15 ? 1 : 0)
  if (bulanProrata === 0) {
    return { bulanProrata, pokokProrata: tarif.tarifPokok === 0 ? tarif.kartuDana : 0 }
  }
  const pokokProrata = Math.max(roundMoney(tarif.tarifPokok * (tarif.konstantaPokokPerbulan * bulanProrata) + tarif.kartuDana), 0)
  return { bulanProrata, pokokProrata }
}

type FamilyCc = 'motor' | 'minibus-au' | 'barang-penumpang-non-umum' | null

export function familyGolongan(g: Golongan): FamilyCc {
  if (g === 'C1' || g === 'C2') return 'motor'
  if (g === 'DU' || g === 'EU') return 'minibus-au'
  if (g === 'DP' || g === 'F') return 'barang-penumpang-non-umum'
  return null
}

/** Batas CC family (business-logic §2.1) — hanya utk penentuan default radio & opsi label. */
export function batasFamily(f: FamilyCc): number | null {
  if (f === 'motor') return 250
  if (f === 'minibus-au') return 1600
  if (f === 'barang-penumpang-non-umum') return 2400
  return null
}

/** konfirmasiGolongan — adjust golongan dalam family oleh radio CC (domain-api §1).
 *  Family null atau pilihan null → golongan apa adanya. */
export function konfirmasiGolongan(golongan: Golongan, pilihan: PilihanCc): Golongan {
  const f = familyGolongan(golongan)
  if (f === null || pilihan === null) return golongan
  const pasangan: Record<string, { bawah: Golongan; atas: Golongan }> = {
    motor: { bawah: 'C1', atas: 'C2' },
    'minibus-au': { bawah: 'DU', atas: 'EU' },
    'barang-penumpang-non-umum': { bawah: 'DP', atas: 'F' }
  }
  return pasangan[f][pilihan]
}

/** Pilihan default radio dari default_cc CSV: true → 'atas', false → 'bawah' (keputusan 2026-08-28 sesi 2). */
export function defaultPilihanCc(golongan: Golongan, defaultCc: number): PilihanCc {
  const f = familyGolongan(golongan)
  const b = batasFamily(f)
  if (f === null || b === null) return null
  return defaultCc > b ? 'atas' : 'bawah'
}

/** Label opsi radio utk chip (fallback; label eksak dari Open Design saat MCP tersedia). */
export function labelPilihanPilihanCc(pilihan: PilihanCc, batas: number | null): string | null {
  if (pilihan === null || batas === null) return null
  return pilihan === 'atas' ? `> ${batas}cc` : `≤ ${batas}cc`
}