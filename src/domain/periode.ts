// DataPeriode — domain-api §3 / business-logic §3–§6. Fungsi murni, aritmetika Date lokal, hariIni diinjeksi.
import type { DataPeriode } from './types'

const MS_PER_DAY = 86_400_000

/** Selisih hari kalender absolut antara dua tanggal (lokal), presisi kabisat. */
function hariAntara(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ua - ub) / MS_PER_DAY)
}

/** SET_YEAR — ganti tahun tanggal; 29 Feb dibulatkan ke 28 Feb bila tahun target bukan kabisat. */
export function setYear(t: Date, year: number): Date {
  const d = new Date(t)
  d.setFullYear(year, t.getMonth(), t.getDate())
  // setFullYear overflow 29 Feb → 1 Mar pada tahun non-kabisat; koreksi ke 28 Feb
  if (d.getDate() !== t.getDate()) {
    d.setDate(0) // hari terakhir bulan sebelumnya
  }
  return d
}

/** Tahun kalender + N (tahun-tahun penuh ke depan). */
export function tambahTahun(t: Date, tahun: number): Date {
  return setYear(t, t.getFullYear() + tahun)
}

/** Slot Tunggakan N = currentYear − N (N = 1..4). */
export function tahunTunggakan(currentYear: number, n: number): number {
  return currentYear - n
}

export function bangunDataPeriode(dueDateOriginal: Date, hariIni: Date): DataPeriode {
  const currentYear = hariIni.getFullYear()
  const anchorDate = setYear(dueDateOriginal, currentYear)
  const gapDays = hariAntara(anchorDate, hariIni)
  const totalOverdueYears = currentYear - dueDateOriginal.getFullYear()
  const tunggakanCount = Math.min(Math.max(totalOverdueYears, 0), 4)
  const berjalanYear = gapDays > 30 ? currentYear : currentYear + 1
  const tunggakanYears = [1, 2, 3, 4].map((n) => tahunTunggakan(currentYear, n))
  return {
    dueDateOriginal,
    hariIni,
    currentYear,
    anchorDate,
    gapDays,
    totalOverdueYears,
    tunggakanCount,
    berjalanYear,
    tunggakanYears
  }
}