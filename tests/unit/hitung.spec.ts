import { describe, it, expect } from 'vitest'
import { hitungPerhitungan } from '../../src/domain/hitung'
import type { TarifGolongan, HasilPerhitungan, InputHitung, KodeTransaksi } from '../../src/domain/types'

// Fixture 9 baris = isi PERSIS contracts/csv-tarif.md (sumber tarif hanya CSV)
const TARIF: TarifGolongan[] = [
  { golongan: 'A', deskripsi: 'Kendaraan Khusus (Ambulance, Damkar, dsb)', defaultCc: 2499, kartuDana: 3000, tarifPokok: 0, tarifDendaMaksimal: 0, konstantaDendaTriwulan: 0, konstantaPokokPerbulan: 0 },
  { golongan: 'B', deskripsi: 'Alat Berat (Exavator, Crane, dsb)', defaultCc: 2499, kartuDana: 3000, tarifPokok: 20000, tarifDendaMaksimal: 20000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'C1', deskripsi: 'Sepeda Motor Roda 2 / Roda 3', defaultCc: 150, kartuDana: 3000, tarifPokok: 32000, tarifDendaMaksimal: 32000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'C2', deskripsi: 'Sepeda Motor Sport > 250cc', defaultCc: 255, kartuDana: 3000, tarifPokok: 80000, tarifDendaMaksimal: 80000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'DP', deskripsi: 'Minibus, Jeep, Sedan, Pickup Ang. Barang', defaultCc: 1500, kartuDana: 3000, tarifPokok: 140000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'DU', deskripsi: 'Minibus Angkutan Umum sd. 1600cc', defaultCc: 1500, kartuDana: 3000, tarifPokok: 70000, tarifDendaMaksimal: 70000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'EP', deskripsi: 'Bus dan Microbus Bukan Ang. Umum', defaultCc: 3000, kartuDana: 3000, tarifPokok: 150000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'EU', deskripsi: 'Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc', defaultCc: 3000, kartuDana: 3000, tarifPokok: 87000, tarifDendaMaksimal: 87000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 },
  { golongan: 'F', deskripsi: 'Truck / Ang. Barang > 2400cc', defaultCc: 2499, kartuDana: 3000, tarifPokok: 160000, tarifDendaMaksimal: 100000, konstantaDendaTriwulan: 0.25, konstantaPokokPerbulan: 0.083333333 }
]

const tarifOf = (g: (typeof TARIF)[number]['golongan']) => TARIF.find((t) => t.golongan === g)!

// Skenario dasar terverifikasi: due 26 Mei 2024, hari ini 27 Agu 2026 (business-logic §9)
const HARI_INI = new Date(2026, 7, 27)
const DUE = new Date(2024, 4, 26)

function hitung(
  transaksi: KodeTransaksi,
  golongan: (typeof TARIF)[number]['golongan'],
  due = DUE,
  hariIni = HARI_INI,
  keringananAktif = false
): HasilPerhitungan {
  const input: InputHitung = { transaksi, dueDateOriginal: due, golongan }
  return hitungPerhitungan(input, tarifOf(golongan), hariIni, keringananAktif)
}

describe('hitungPerhitungan — contoh terverifikasi EKSAK (domain-api §6)', () => {
  it('PERPANJANGAN C1 2024-05-26/2026-08-27 → total 185.000 & JTS 26 Mei 2027', () => {
    const r = hitung('PERPANJANGAN', 'C1')
    expect(r.status).toBe('rincian')
    expect(r.keterlambatan).toBe('2 tahun, 3 bulan, 1 hari')
    expect(r.pokokBerjalan).toBe(35000)
    expect(r.dendaBerjalan).toBe(16000)
    expect(r.pokokTunggakan1).toBe(35000)
    expect(r.dendaTunggakan1).toBe(32000)
    expect(r.pokokTunggakan2).toBe(35000)
    expect(r.dendaTunggakan2).toBe(32000)
    expect(r.pokokTunggakan3).toBe(0)
    expect(r.dendaTunggakan3).toBe(0)
    expect(r.pokokTunggakan4).toBe(0)
    expect(r.dendaTunggakan4).toBe(0)
    expect(r.pokokProrata).toBe(0)
    expect(r.totalPremi).toBe(185000)
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2027, 4, 26))
  })

  it('BALIK_NAMA Case A → total 196.000 & JTS 27 Agu 2027 (hariIni+1 tahun)', () => {
    const r = hitung('BALIK_NAMA', 'C1')
    expect(r.status).toBe('rincian')
    expect(r.pokokProrata).toBe(11000)
    expect(r.totalPremi).toBe(196000)
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2027, 7, 27))
  })

  it('MUTASI_KELUAR → total 134.000 & JTS 26 Mei 2026 (anchorDate)', () => {
    const r = hitung('MUTASI_KELUAR', 'C1')
    expect(r.status).toBe('rincian')
    expect(r.pokokBerjalan).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.pokokProrata).toBe(0)
    expect(r.pokokTunggakan1).toBe(35000)
    expect(r.dendaTunggakan1).toBe(32000)
    expect(r.pokokTunggakan2).toBe(35000)
    expect(r.dendaTunggakan2).toBe(32000)
    expect(r.totalPremi).toBe(134000)
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2026, 4, 26))
  })

  it('MUTASI_MASUK identik BALIK_NAMA → total 196.000', () => {
    const r = hitung('MUTASI_MASUK', 'C1')
    expect(r.totalPremi).toBe(196000)
    expect(r.pokokProrata).toBe(11000)
  })
})

describe('hitungPerhitungan — aturan umum', () => {
  it('Golongan A: total bundled 3.000 per pokok; tanpa pokok = 0 (kartu ikut pokok)', () => {
    // A ikut aturan baru: pokok = 0+3000 = 3000 per slot, denda 0
    // Case overdue normal (HARI_INI 27 Agu 2026, due 26 Mei 2024, gap -93): berjalan+2 tunggakan
    const r = hitung('PERPANJANGAN', 'A', new Date(2024, 4, 26), HARI_INI)
    expect(r.pokokBerjalan).toBe(3000)
    expect(r.pokokTunggakan1).toBe(3000)
    expect(r.pokokTunggakan2).toBe(3000)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.pokokProrata).toBe(0)
    expect(r.totalPremi).toBe(9000)

    // Anchor di masa depan + overdue (gap>30, due 26 Mei 2024, hari 1 Jan 2026, gap 145):
    // anniversary-based → 1 tunggakan + berjalan 2026 (start 26 Mei 2025)
    const rFutureAnchor = hitung('PERPANJANGAN', 'A', new Date(2024, 4, 26), new Date(2026, 0, 1))
    expect(rFutureAnchor.pokokBerjalan).toBe(3000)
    expect(rFutureAnchor.pokokTunggakan1).toBe(3000)
    expect(rFutureAnchor.pokokTunggakan2).toBe(0)
    expect(rFutureAnchor.totalPremi).toBe(6000)

    // Belum jatuh tempo (gap>30, tunggakanCount=0) → total 0, kartu tidak dihitung
    const rBelum = hitung('PERPANJANGAN', 'A', new Date(2026, 9, 6), HARI_INI)
    expect(rBelum.status).toBe('belum-jatuh-tempo')
    expect(rBelum.totalPremi).toBe(0)
    expect(rBelum.pokokBerjalan).toBe(0)
  })

  it('denda tunggakan = tarif_denda_maksimal flat; pokok = tarif_pokok + kartu_dana', () => {
    const r = hitung('PERPANJANGAN', 'EP') // pokok 150000, denda maks 100000, bundled = 153000
    expect(r.pokokBerjalan).toBe(153000)
    expect(r.pokokTunggakan1).toBe(153000)
    expect(r.dendaTunggakan1).toBe(100000)
    expect(r.dendaBerjalan).toBe(75000) // Q2: min(2×0.25×150000=75000, 100000)
  })

  it('block belum-jatuh-tempo hanya PERPANJANGAN (tunggakanCount=0 && gapDays>30)', () => {
    const future = new Date(2026, 9, 6) // 40 hari setelah HARI_INI
    const r = hitung('PERPANJANGAN', 'C1', future, HARI_INI)
    expect(r.status).toBe('belum-jatuh-tempo')
    expect(r.totalPremi).toBe(0)
    expect(r.keterlambatan).toBe('0 tahun, 0 bulan, 0 hari')
  })

  it('block TIDAK muncul utk BALIK_NAMA / MUTASI_* walaupun gap>30', () => {
    const future = new Date(2026, 9, 6)
    for (const t of ['BALIK_NAMA', 'MUTASI_KELUAR', 'MUTASI_MASUK'] as const) {
      expect(hitung(t, 'C1', future, HARI_INI).status).not.toBe('belum-jatuh-tempo')
    }
  })

  it('lunas Case B (due > hariIni+1 tahun) → total 0', () => {
    const r = hitung('BALIK_NAMA', 'C1', new Date(2030, 0, 1), HARI_INI)
    expect(r.status).toBe('lunas')
    expect(r.totalPremi).toBe(0)
    expect(r.pokokProrata).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
  })

  it('keringanan aktif → semua denda 0, pokok bundled tak berubah', () => {
    const normal = hitung('PERPANJANGAN', 'C1')
    const r = hitung('PERPANJANGAN', 'C1', DUE, HARI_INI, true)
    expect(r.keringananDiterapkan).toBe(true)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.dendaTunggakan2).toBe(0)
    expect(r.pokokBerjalan).toBe(normal.pokokBerjalan)
    expect(r.pokokTunggakan1).toBe(35000)
    expect(r.jatuhTempoSelanjutnya).toEqual(normal.jatuhTempoSelanjutnya)
  })

  it('cap 4 tunggakan: telat >4 tahun tetap 4 slot; 4 tahun + 1 hari → 4 slot', () => {
    const r = hitung('PERPANJANGAN', 'C1', new Date(2021, 4, 26), HARI_INI) // 5 tahun
    expect(r.keterlambatan).toBe('4 tahun, 3 bulan, 1 hari')
    expect(r.pokokTunggakan4).toBe(35000)
    const r2 = hitung('PERPANJANGAN', 'C1', new Date(2022, 7, 26), HARI_INI) // 4 tahun + 1 hari
    expect(r2.keterlambatan).toBe('4 tahun, 0 bulan, 1 hari')
    expect(r2.pokokTunggakan4).toBe(35000)
  })

  it('sampling SC-003: keempat transaksi × 9 golongan konsisten (tarif identik, alur beda)', () => {
    for (const g of ['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F'] as const) {
      const t = tarifOf(g)
      const bundled = t.tarifPokok + t.kartuDana
      const perpanjangan = hitung('PERPANJANGAN', g)
      expect(perpanjangan.pokokBerjalan).toBe(bundled)
      expect(perpanjangan.dendaTunggakan1).toBe(t.tarifDendaMaksimal)
      // total konsisten: perpanjangan + prorata = balik_nama
      const balik = hitung('BALIK_NAMA', g)
      expect(balik.pokokTunggakan1).toBe(perpanjangan.pokokTunggakan1)
      expect(balik.totalPremi).toBe(perpanjangan.totalPremi + balik.pokokProrata)
      expect(balik.pokokProrata).toBeGreaterThan(0)
      const keluar = hitung('MUTASI_KELUAR', g)
      expect(keluar.pokokBerjalan).toBe(0)
      expect(keluar.dendaBerjalan).toBe(0)
      expect(keluar.pokokTunggakan1).toBe(perpanjangan.pokokTunggakan1)
    }
  })

  it('bulan prorata string utk BALIK_NAMA/MUTASI_MASUK', () => {
    const r = hitung('BALIK_NAMA', 'C1')
    expect(r.bulanProrata).toBe(3)
    expect(hitung('PERPANJANGAN', 'C1').bulanProrata).toBe(0)
    expect(hitung('MUTASI_KELUAR', 'C1').bulanProrata).toBe(0)
  })

  it('jatuhTempoSelanjutnya dd MMMM yyyy via Intl id-ID', () => {
    const r = hitung('PERPANJANGAN', 'C1')
    const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    expect(fmt.format(r.jatuhTempoSelanjutnya)).toBe('26 Mei 2027')
  })
})

// §9.2/§9.4: Balik Nama & Mutasi Masuk — JTS pindah ke hariIni+1 tahun → prorata pokok.
describe('BALIK_NAMA / MUTASI_MASUK — skema prorata (§9.2, §9.4)', () => {
  it('Case B: due > hariIni (STNK berlaku) → prorata saja, tanpa berjalan/denda/tunggakan', () => {
    // due 26 Mei 2027, anniversary 26 Mei 2026 → 27 Agu = 3 bln → 32k×3/12+3k = 11.000
    const r = hitung('BALIK_NAMA', 'C1', new Date(2027, 4, 26), HARI_INI)
    expect(r.status).toBe('rincian')
    expect(r.pokokBerjalan).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.pokokTunggakan1).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.bulanProrata).toBe(3)
    expect(r.pokokProrata).toBe(11000)
    expect(r.totalPremi).toBe(11000)
    expect(r.keterlambatan).toBe('0 tahun, 0 bulan, 0 hari')
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2027, 7, 27))
  })

  it('Case B: due 2 Sep 2026 (gap +6) → prorata 12 bln dari anniversary 2 Sep 2025', () => {
    // 2 Sep 2025 → 27 Agu 2026 = 11 bln 25 hari → 12 bln → 32k×12/12+3k = 35.000
    const r = hitung('BALIK_NAMA', 'C1', new Date(2026, 8, 2), HARI_INI)
    expect(r.pokokBerjalan).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.bulanProrata).toBe(12)
    expect(r.pokokProrata).toBe(35000)
    expect(r.totalPremi).toBe(35000)
  })

  it('Case A mid-cycle: due 26 Des 2025 (expired 8 bln, anchor >30d) → berjalan+denda+prorata, TIDAK nol', () => {
    // prorataMulai 26 Des 2025 → 27 Agu 2026 = 8 bln 1 hari → 8 bln → 24.400
    // denda: 244 hari → Q3 = 24.000; berjalan bundled 35.000; tunggakan 0
    const r = hitung('BALIK_NAMA', 'C1', new Date(2025, 11, 26), HARI_INI)
    expect(r.status).toBe('rincian')
    expect(r.pokokBerjalan).toBe(35000)
    expect(r.dendaBerjalan).toBe(24000)
    expect(r.pokokTunggakan1).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.bulanProrata).toBe(8)
    expect(r.pokokProrata).toBe(24400)
    expect(r.totalPremi).toBe(83400)
    expect(r.keterlambatan).toBe('0 tahun, 8 bulan, 1 hari')
  })

  it('Case A window: due 20 Sep 2025 (anchor 24d lagi) → tahun anchor belum dibeli, T1 + prorata 11 bln', () => {
    // tunggakan 1 (2025), prorata dari 20 Sep 2024 → 27 Agu 2026 = 23 bln 7 hari → 23 bln → probe: 11 bln 32.400
    const r = hitung('BALIK_NAMA', 'C1', new Date(2025, 8, 20), HARI_INI)
    expect(r.pokokBerjalan).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.pokokTunggakan1).toBe(35000)
    expect(r.dendaTunggakan1).toBe(32000)
    expect(r.bulanProrata).toBe(11)
    expect(r.pokokProrata).toBe(32400)
    expect(r.totalPremi).toBe(99400)
  })

  it('MUTASI_MASUK identik BALIK_NAMA untuk band mid-cycle', () => {
    const due = new Date(2025, 11, 26)
    const bn = hitung('BALIK_NAMA', 'C1', due, HARI_INI)
    const mm = hitung('MUTASI_MASUK', 'C1', due, HARI_INI)
    expect(mm.totalPremi).toBe(bn.totalPremi)
    expect(mm.pokokProrata).toBe(bn.pokokProrata)
    expect(mm.bulanProrata).toBe(bn.bulanProrata)
    expect(mm.keterlambatan).toBe(bn.keterlambatan)
  })
})

// ⚠️ OPEN VALIDATIONS (business-logic §13) — ASUMSI, BUKAN FINAL.
describe('pending-validasi §13.1 — BALIK_NAMA Case B jalur prorata (asumsi anniversary = due − 1 tahun)', () => {
  // Asumsi terdokumentasi: anniversary_terakhir_yang_lewat = dueDateOriginal − 1 tahun.
  // Belum divalidasi contoh angka oleh user; JANGAN dianggap final.
  it('due ≤ hariIni+1 tahun → prorata dari due−1 tahun tanpa denda, JTS = hariIni+1 tahun', () => {
    const due = new Date(2026, 9, 6) // 6 Okt 2026 — 40 hari ke depan, STNK masih berlaku (Case B)
    const r = hitung('BALIK_NAMA', 'C1', due, HARI_INI)
    expect(r.status).toBe('rincian')
    expect(r.totalOverdueYears).toBe(0)
    expect(r.dendaBerjalan).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.pokokProrata).toBeGreaterThan(0)
    expect(r.bulanProrata).toBeGreaterThan(0)
    // asumsi: anniversary = due − 1 tahun = 6 Okt 2025 → 27 Agu 2026 (10 bulan 21 hari → 11 bulan)
    expect(r.bulanProrata).toBe(11)
  })
})

// Pinning perilaku anniversary-based (tunggakanCount subtraction) — GitNexus HIGH: bangunDataPeriode.
describe('tunggakanCount anniversary-based — subtraction mid-cycle', () => {
  it('MUTASI_KELUAR due 26 Des 2025 (gap 121, raw 1→0) → semua slot 0, total 0', () => {
    const r = hitung('MUTASI_KELUAR', 'C1', new Date(2025, 11, 26), HARI_INI)
    expect(r.status).toBe('rincian')
    expect(r.pokokTunggakan1).toBe(0)
    expect(r.dendaTunggakan1).toBe(0)
    expect(r.totalPremi).toBe(0)
    expect(r.keterlambatan).toBe('0 tahun, 8 bulan, 1 hari')
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2026, 11, 26))
  })

  it('PERPANJANGAN due tahun depan → belum-jatuh-tempo (blok, bukan tagih+denda)', () => {
    const r = hitung('PERPANJANGAN', 'C1', new Date(2027, 2, 6), HARI_INI)
    expect(r.status).toBe('belum-jatuh-tempo')
    expect(r.totalPremi).toBe(0)
    expect(r.pokokBerjalan).toBe(0)
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2027, 2, 6))
  })
})

// ⚠️ OPEN VALIDATIONS (business-logic §13) — ASUMSI, BUKAN FINAL.
describe('pending-validasi §13.2 — MUTASI_KELUAR JTS saat tunggakanCount=0 (asumsi = anchorDate)', () => {
  // Asumsi terdokumentasi: bila tidak ada tunggakan, JTS tetap anchorDate. Belum dikonfirmasi user.
  it('due tahun ini tanpa tunggakan → total 0 (pokok tidak ada, kartu ikut pokok)', () => {
    const due = new Date(2026, 9, 6) // gap 40 hari, gapDays>30 → anchorDate = due
    const r = hitung('MUTASI_KELUAR', 'C1', due, HARI_INI)
    expect(r.status).toBe('rincian')
    expect(r.totalPremi).toBe(0)
    expect(r.pokokBerjalan).toBe(0)
    expect(r.pokokTunggakan1).toBe(0)
    expect(r.keterlambatan).toBe('0 tahun, 0 bulan, 0 hari')
    expect(r.jatuhTempoSelanjutnya).toEqual(new Date(2026, 9, 6))
  })
})