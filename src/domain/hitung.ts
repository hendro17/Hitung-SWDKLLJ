// hitungPerhitungan — orkestrator utama (domain-api §6 / business-logic §9). Murni.
import type { DataPeriode, HasilPerhitungan, InputHitung, TarifGolongan } from './types'
import { bangunDataPeriode, setYear } from './periode'
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
  keringananAktif: boolean
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
    totalPremi: 0,
    jatuhTempoSelanjutnya: hitungJatuhTempoSelanjutnya(transaksi, dueDateOriginal, hariIni),
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
function resolveBalikMasuk(p: DataPeriode, hariIni: Date, tarif: TarifGolongan, pokokBundled: number): HasilBerjalanProrata {
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
    const d = dendaDari(prorataMulai)
    const pr = prorataDari(prorataMulai)
    return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
  }
  if (p.gapDays <= 0) {
    // anchor sudah lewat: berjalan dari anchor + prorata.
    const d = dendaDari(p.anchorDate)
    const pr = prorataDari(p.anchorDate)
    return { pokokBerjalan: pokokBundled, dendaBerjalan: d.denda, pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
  }
  // gap ∈ (0,30]: tahun di anchor masa depan belum dibeli — prorata dari anchor−1 tahun.
  const pr = prorataDari(setYear(p.dueDateOriginal, p.currentYear - 1))
  return { ...hasilKosong(), pokokProrata: pr.pokokProrata, bulanProrata: pr.bulanProrata }
}

/** PERPANJANGAN (§9.1) — status sudah menyaring, di sini selalu boleh dikenakan. */
function resolvePerpanjangan(p: DataPeriode, hariIni: Date, tarif: TarifGolongan, pokokBundled: number): HasilBerjalanProrata {
  const dendaDari = (mulai: Date) => hitungDendaBerjalan(mulai, hariIni, tarif)
  // Expired, anchor >30 hari lagi: tagih tahun berjalan mulai anniversary terakhir yang lewat.
  if (p.gapDays > 30) {
    const d = dendaDari(setYear(p.dueDateOriginal, p.currentYear - 1))
    return { ...hasilKosong(), pokokBerjalan: pokokBundled, dendaBerjalan: d.denda }
  }
  // Gap ≤30 (termasuk hari ini & overdue klasik): tahun berjalan = anchor→anchor+1.
  const d = dendaDari(p.anchorDate)
  return { ...hasilKosong(), pokokBerjalan: pokokBundled, dendaBerjalan: d.denda }
}

function resolveBerjalanDanProrata(
  p: DataPeriode,
  transaksi: InputHitung['transaksi'],
  hariIni: Date,
  tarif: TarifGolongan,
  pokokBundled: number
): HasilBerjalanProrata {
  if (transaksi === 'MUTASI_KELUAR') return hasilKosong()
  if (transaksi === 'BALIK_NAMA' || transaksi === 'MUTASI_MASUK') return resolveBalikMasuk(p, hariIni, tarif, pokokBundled)
  return resolvePerpanjangan(p, hariIni, tarif, pokokBundled)
}

export function hitungPerhitungan(
  input: InputHitung,
  tarif: TarifGolongan,
  hariIni: Date,
  keringananAktif: boolean
): HasilPerhitungan {
  const p = bangunDataPeriode(input.dueDateOriginal, hariIni)
  const status = tentukanStatus(input.transaksi, input.dueDateOriginal, hariIni)

  if (status === 'belum-jatuh-tempo') {
    return { ...buildHasilKosong(p, status, hariIni, input.transaksi, input.dueDateOriginal, keringananAktif), totalPremi: 0 }
  }

  const pokokBundled = tarif.tarifPokok + tarif.kartuDana
  const { t1, t2, t3, t4 } = buildTunggakanSlots(p.tunggakanCount, pokokBundled, tarif.tarifDendaMaksimal)
  const berjalan = resolveBerjalanDanProrata(p, input.transaksi, hariIni, tarif, pokokBundled)

  let d1 = t1.denda
  let d2 = t2.denda
  let d3 = t3.denda
  let d4 = t4.denda
  let dB = berjalan.dendaBerjalan
  if (keringananAktif) d1 = d2 = d3 = d4 = dB = 0

  const r = buildHasilKosong(p, status, hariIni, input.transaksi, input.dueDateOriginal, keringananAktif)
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

  const sum =
    r.pokokBerjalan + r.dendaBerjalan + r.pokokTunggakan1 + r.dendaTunggakan1 + r.pokokTunggakan2 + r.dendaTunggakan2 +
    r.pokokTunggakan3 + r.dendaTunggakan3 + r.pokokTunggakan4 + r.dendaTunggakan4 + r.pokokProrata

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
    r.totalPremi = 0
    r.keterlambatan = '0 tahun, 0 bulan, 0 hari'
    return r
  }

  r.totalPremi = sum
  return r
}
