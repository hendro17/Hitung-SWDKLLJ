// hitungPerhitungan — orkestrator utama (domain-api §6 / business-logic §9). Murni.
import type { DataPeriode, HasilPerhitungan, InputHitung, TarifGolongan } from './types'
import { bangunDataPeriode, setYear, tambahTahun } from './periode'
import { bulanPenuhDanSisa, hitungDendaBerjalan, hitungPokokProrata } from './denda'
import { anniversaryProrata } from './models/balik-nama'
import { hitungJatuhTempoSelanjutnya, tentukanStatus } from './models'
// Perpanjangan: mulai keterlambatan = anniversary terakhir yang sudah lewat.
// Due valid (masih berlaku) → tidak pernah terlambat (0/0/0).
// Keterlambatan faktual: waktu sejak due, tahun di-cap 4 (mengikuti cap slot tunggakan).
function formatKeterlambatan(due: Date, kini: Date): string {
  if (kini <= due) return '0 tahun, 0 bulan, 0 hari'
  const { fullMonths, remainingDays } = bulanPenuhDanSisa(due, kini)
  const tahun = Math.min(Math.floor(fullMonths / 12), 4)
  return `${tahun} tahun, ${fullMonths % 12} bulan, ${remainingDays} hari`
}

function buildHasilKosong(
  p: DataPeriode,
  status: HasilPerhitungan['status'],
  hariIni: Date,
  transaksi: InputHitung['transaksi'],
  dueDateOriginal: Date,
  keringananAktif: boolean,
  windowDays = 30
): HasilPerhitungan {
  return {
    status,
    keterlambatan: formatKeterlambatan(dueDateOriginal, hariIni),
    pokokBerjalan: 0,
    dendaBerjalan: 0,
    pokokTunggakan1: 0,
    dendaTunggakan1: 0,
    pokokTunggakan2: 0,
    dendaTunggakan2: 0,
    pokokTunggakan3: 0,
    dendaTunggakan3: 0,
    pokokTunggakan4: 0,
    dendaTunggakan4: 0,
    pokokProrata: 0,
    bulanProrata: 0,
    pokokYad: 0,
    totalPremi: 0,
    jatuhTempoSelanjutnya: hitungJatuhTempoSelanjutnya(transaksi, dueDateOriginal, hariIni, windowDays),
    keringananDiterapkan: keringananAktif,
    totalOverdueYears: p.totalOverdueYears
  }
}

function buildTunggakanSlots(tunggakanCount: number, pokokBundled: number, dendaMaks: number) {
  const slot = (n: 1 | 2 | 3 | 4) =>
    n <= tunggakanCount ? { pokok: pokokBundled, denda: dendaMaks } : { pokok: 0, denda: 0 }
  return { t1: slot(1), t2: slot(2), t3: slot(3), t4: slot(4) }
}

/** Hasil tahun berjalan + prorata — bagian variabel per model transaksi. */
interface HasilBerjalanProrata {
  pokokBerjalan: number
  dendaBerjalan: number
  pokokProrata: number
  bulanProrata: number
}

const hasilKosong = (): HasilBerjalanProrata => ({ pokokBerjalan: 0, dendaBerjalan: 0, pokokProrata: 0, bulanProrata: 0 })

/** BALIK_NAMA / MUTASI_MASUK (§9.2, §9.4) — prorata + berjalan sesuai posisi due. */
function resolveBalikMasuk(p: DataPeriode, hariIni: Date, tarif: TarifGolongan): HasilBerjalanProrata {
  const pokokBundled = tarif.tarifPokok + tarif.kartuDana
  const dendaDari = (mulai: Date) => hitungDendaBerjalan(mulai, hariIni, tarif)
  const prorataDari = (mulai: Date) => hitungPokokProrata(mulai, hariIni, tarif)

  // Case B (§9.2): STNK masih berlaku — prorata saja, tanpa berjalan/denda.
  if (p.dueDateOriginal > hariIni) {
    const pr = prorataDari(anniversaryProrata(p.dueDateOriginal))
    return { ...hasilKosong(), pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
  }
  // Case A: overdue — prorata mulai anniversary terakhir yang sudah lewat.
  const prorataMulai = p.gapDays > 0 ? setYear(p.dueDateOriginal, p.currentYear - 1) : p.anchorDate
  if (p.gapDays > 30) {
    // anchor tahun ini masih >30 hari lagi: tagih tahun berjalan mulai anniversary terakhir + prorata.
    // Cap 5 tahun Jasa Raharja: 1 berjalan + 4 tunggakan sudah penuh → prorata 0.
    const d = dendaDari(prorataMulai)
    if (p.tunggakanCount >= 4) {
      return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: 0, bulanProrata: 0 }
    }
    const pr = prorataDari(prorataMulai)
    return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
  }
  if (p.gapDays <= 0) {
    // anchor sudah lewat: berjalan dari anchor + prorata.
    // Cap 5 tahun Jasa Raharja: 1 berjalan + 4 tunggakan sudah penuh → prorata 0.
    const d = dendaDari(p.anchorDate)
    if (p.tunggakanCount >= 4) {
      return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: 0, bulanProrata: 0 }
    }
    const pr = prorataDari(p.anchorDate)
    return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
  }
  // gap ∈ (0,30]: periode terakhir selalu Berjalan [anchor-1th, anchor], denda dari mulaiPast ke today.
  // Prorata = [anchor, JTS=today+1th] bila total <5 thn. Jika prorata >=12 bln → geser: Berjalan penuh, prorata 0, tunggakan tetap.
  // Jika prorata <12 bln → tunggakan efektif = tunggakanCount-1 (pemanggil yang menyesuaikan slot).
  const mulaiPast = setYear(p.dueDateOriginal, p.currentYear - 1)
  const jts = tambahTahun(hariIni, 1)
  const prFuture = hitungPokokProrata(p.anchorDate, jts, tarif)
  const dPast = dendaDari(mulaiPast)
  if (prFuture.bulanProrata >= 12) {
    return { pokokBerjalan: pokokBundled, dendaBerjalan: dPast.denda, pokokProrata: 0, bulanProrata: 0 }
  }
  return { pokokBerjalan: pokokBundled, dendaBerjalan: dPast.denda, pokokProrata: prFuture.pokokProrata, bulanProrata: prFuture.bulanProrata }
}

/** PERPANJANGAN (§9.1) — status sudah menyaring, di sini selalu boleh dikenakan.
 *  Ada tunggakan: berjalan ikut ketentuan 30 hari (YAD ditagih terpisah).
 *  Tanpa tunggakan: jalur ≤30 diperlebar s/d windowDays (boleh +1 tahun). */
function resolvePerpanjangan(p: DataPeriode, hariIni: Date, tarif: TarifGolongan, windowDays = 30): HasilBerjalanProrata {
  const pokokBundled = tarif.tarifPokok + tarif.kartuDana
  const dendaDari = (mulai: Date) => hitungDendaBerjalan(mulai, hariIni, tarif)
  const batas = p.tunggakanCount >= 1 ? 30 : windowDays
  // Expired, anchor >batas lagi: tagih tahun berjalan mulai anniversary terakhir yang lewat.
  if (p.gapDays > batas) {
    const d = dendaDari(setYear(p.dueDateOriginal, p.currentYear - 1))
    return { ...hasilKosong(), pokokBerjalan: pokokBundled, dendaBerjalan: d.denda }
  }
  // Gap ≤batas (termasuk hari ini & overdue klasik): tahun berjalan = anchor→anchor+1.
  const d = dendaDari(p.anchorDate)
  return { ...hasilKosong(), pokokBerjalan: pokokBundled, dendaBerjalan: d.denda }
}

function resolveBerjalanDanProrata(
  p: DataPeriode,
  transaksi: InputHitung['transaksi'],
  hariIni: Date,
  tarif: TarifGolongan,
  windowDays = 30
): HasilBerjalanProrata {
  if (transaksi === 'MUTASI_KELUAR') return hasilKosong()
  if (transaksi === 'BALIK_NAMA' || transaksi === 'MUTASI_MASUK') return resolveBalikMasuk(p, hariIni, tarif)
  return resolvePerpanjangan(p, hariIni, tarif, windowDays)
}

/** Pokok YAD (yang akan datang): 1 tahun penuh yang ditagih terpisah.
 *  Hanya PERPANJANGAN + ada tunggakan + due lewat + anchor ∈ (30, windowDays]. */
function hitungPokokYad(
  transaksi: InputHitung['transaksi'],
  p: DataPeriode,
  dueDateOriginal: Date,
  hariIni: Date,
  pokokBundled: number,
  windowDays: number
): number {
  const layak =
    transaksi === 'PERPANJANGAN' && p.tunggakanCount >= 1 &&
    dueDateOriginal <= hariIni && p.gapDays > 30 && p.gapDays <= windowDays
  return layak ? pokokBundled : 0
}

/** Opsi modifier perhitungan (default: tanpa keringanan, jendela 30 hari). */
export interface OpsiHitung {
  keringananAktif?: boolean
  windowDays?: number
}

export function hitungPerhitungan(
  input: InputHitung,
  tarif: TarifGolongan,
  hariIni: Date,
  opsi: OpsiHitung = {}
): HasilPerhitungan {
  const { keringananAktif = false, windowDays = 30 } = opsi
  const p = bangunDataPeriode(input.dueDateOriginal, hariIni)
  const status = tentukanStatus(input.transaksi, input.dueDateOriginal, hariIni, windowDays)

  if (status === 'belum-jatuh-tempo') {
    return { ...buildHasilKosong(p, status, hariIni, input.transaksi, input.dueDateOriginal, keringananAktif, windowDays), totalPremi: 0 }
  }

  const pokokBundled = tarif.tarifPokok + tarif.kartuDana
  // BALIK_NAMA/MUTASI_MASUK gap (0,30] non-geser: periode terakhir jadi Berjalan → slot tunggakan = count-1.
  // Geser (prorata [anchor,JTS] >=12): slot tetap count.
  let tunggakanEff = p.tunggakanCount
  if (
    (input.transaksi === 'BALIK_NAMA' || input.transaksi === 'MUTASI_MASUK') &&
    input.dueDateOriginal <= hariIni && p.gapDays > 0 && p.gapDays <= 30
  ) {
    const jts = tambahTahun(hariIni, 1)
    const { fullMonths, remainingDays } = bulanPenuhDanSisa(p.anchorDate, jts)
    if (fullMonths + (remainingDays > 15 ? 1 : 0) < 12) {
      tunggakanEff = Math.max(p.tunggakanCount - 1, 0)
    }
  }
  const { t1, t2, t3, t4 } = buildTunggakanSlots(tunggakanEff, pokokBundled, tarif.tarifDendaMaksimal)
  const berjalan = resolveBerjalanDanProrata(p, input.transaksi, hariIni, tarif, windowDays)

  let d1 = t1.denda
  let d2 = t2.denda
  let d3 = t3.denda
  let d4 = t4.denda
  let dB = berjalan.dendaBerjalan
  if (keringananAktif) d1 = d2 = d3 = d4 = dB = 0

  const r = buildHasilKosong(p, status, hariIni, input.transaksi, input.dueDateOriginal, keringananAktif, windowDays)
  r.keterlambatan = formatKeterlambatan(input.dueDateOriginal, hariIni)
  r.pokokBerjalan = berjalan.pokokBerjalan
  r.dendaBerjalan = dB
  r.pokokTunggakan1 = t1.pokok
  r.dendaTunggakan1 = d1
  r.pokokTunggakan2 = t2.pokok
  r.dendaTunggakan2 = d2
  r.pokokTunggakan3 = t3.pokok
  r.dendaTunggakan3 = d3
  r.pokokTunggakan4 = t4.pokok
  r.dendaTunggakan4 = d4
  r.pokokProrata = berjalan.pokokProrata
  r.bulanProrata = berjalan.bulanProrata
  r.pokokYad = hitungPokokYad(input.transaksi, p, input.dueDateOriginal, hariIni, pokokBundled, windowDays)

  const sum =
    r.pokokBerjalan + r.dendaBerjalan + r.pokokTunggakan1 + r.dendaTunggakan1 + r.pokokTunggakan2 + r.dendaTunggakan2 +
    r.pokokTunggakan3 + r.dendaTunggakan3 + r.pokokTunggakan4 + r.dendaTunggakan4 + r.pokokProrata + r.pokokYad

  if (status === 'lunas') {
    r.pokokBerjalan = 0
    r.dendaBerjalan = 0
    r.pokokTunggakan1 = 0
    r.dendaTunggakan1 = 0
    r.pokokTunggakan2 = 0
    r.dendaTunggakan2 = 0
    r.pokokTunggakan3 = 0
    r.dendaTunggakan3 = 0
    r.pokokTunggakan4 = 0
    r.dendaTunggakan4 = 0
    r.pokokProrata = 0
    r.bulanProrata = 0
    r.pokokYad = 0
    r.totalPremi = 0
    r.keterlambatan = '0 tahun, 0 bulan, 0 hari'
    return r
  }

  r.totalPremi = sum
  return r
}
