// hitungPerhitungan — orkestrator utama (domain-api §6 / business-logic §9). Murni.
import type { DataPeriode, HasilPerhitungan, InputHitung, TarifGolongan } from './types'
import { bangunDataPeriode } from './periode'
import { bulanPenuhDanSisa, hitungDendaBerjalan, hitungPokokProrata } from './denda'
import { anniversaryProrata } from './models/balik-nama'
import { hitungJatuhTempoSelanjutnya, tentukanStatus } from './models'

function formatKeterlambatan(tunggakan: number, mulai: Date, kini: Date): string {
  if (kini < mulai) return `${tunggakan} tahun, 0 bulan, 0 hari`
  const { fullMonths, remainingDays } = bulanPenuhDanSisa(mulai, kini)
  return `${tunggakan} tahun, ${fullMonths} bulan, ${remainingDays} hari`
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
    keterlambatan: formatKeterlambatan(p.tunggakanCount, p.anchorDate, hariIni),
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

function resolveBerjalanDanProrata(
  p: DataPeriode,
  isKeluar: boolean,
  isBalikMasuk: boolean,
  status: string,
  hariIni: Date,
  tarif: TarifGolongan,
  pokokBundled: number
): { pokokBerjalan: number; dendaBerjalan: number; pokokProrata: number; bulanProrata: number } {
  let pokokBerjalan = 0
  let dendaBerjalan = 0
  let pokokProrata = 0
  let bulanProrata = 0
  const berjalanMulai = p.anchorDate
  const caseB = p.gapDays > 30 && p.dueDateOriginal > hariIni
  const caseA = p.gapDays <= 30

  if (isKeluar) return { pokokBerjalan, dendaBerjalan, pokokProrata, bulanProrata }

  if (caseA) {
    if (p.gapDays <= 0) {
      const d = hitungDendaBerjalan(berjalanMulai, hariIni, tarif.tarifPokok, tarif.tarifDendaMaksimal, tarif.konstantaDendaTriwulan)
      pokokBerjalan = pokokBundled
      dendaBerjalan = d.denda
    }
    if (isBalikMasuk) {
      const pr = hitungPokokProrata(berjalanMulai, hariIni, tarif.tarifPokok, tarif.kartuDana, tarif.konstantaPokokPerbulan)
      pokokProrata = pr.pokokProrata
      bulanProrata = pr.bulanProrata
    }
    return { pokokBerjalan, dendaBerjalan, pokokProrata, bulanProrata }
  }

  if (isBalikMasuk && caseB && status !== 'lunas') {
    const start = anniversaryProrata(p.dueDateOriginal)
    const pr = hitungPokokProrata(start, hariIni, tarif.tarifPokok, tarif.kartuDana, tarif.konstantaPokokPerbulan)
    pokokProrata = pr.pokokProrata
    bulanProrata = pr.bulanProrata
  }

  return { pokokBerjalan, dendaBerjalan, pokokProrata, bulanProrata }
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

  const isKeluar = input.transaksi === 'MUTASI_KELUAR'
  const isBalikMasuk = input.transaksi === 'BALIK_NAMA' || input.transaksi === 'MUTASI_MASUK'
  const pokokBundled = tarif.tarifPokok + tarif.kartuDana
  const { t1, t2, t3, t4 } = buildTunggakanSlots(p.tunggakanCount, pokokBundled, tarif.tarifDendaMaksimal)
  const berjalan = resolveBerjalanDanProrata(p, isKeluar, isBalikMasuk, status, hariIni, tarif, pokokBundled)

  let d1 = t1.denda
  let d2 = t2.denda
  let d3 = t3.denda
  let d4 = t4.denda
  let dB = berjalan.dendaBerjalan
  if (keringananAktif) d1 = d2 = d3 = d4 = dB = 0

  const r = buildHasilKosong(p, status, hariIni, input.transaksi, input.dueDateOriginal, keringananAktif)
  r.keterlambatan = formatKeterlambatan(p.tunggakanCount, p.anchorDate, hariIni)
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
