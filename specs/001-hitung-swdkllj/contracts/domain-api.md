# Kontrak: API Domain Perhitungan (`src/domain/`)

Fungsi murni — tanpa import Vue/Pinia/DOM/network. Seluruhnya TypeScript ketat dan diuji test-first (konstitusi III).

## 1. Selisih Keterlambatan (`selisih.ts`)

```ts
export interface SelisihKeterlambatan {
  hariAktual: number          // floor((today - jatuhTempo) / 86_400_000), kalender UTC
  hariEfektif: number         // clamp(hariAktual, -30, capHari)
  tahunPenuh: number          // max(0, floor(hariEfektif / 365))
  periodeTunggakan: number    // min(tahunPenuh, 4)   → Berjalan + maks Tunggakan 1..4
  status: 'belum-jatuh-tempo' | 'tepat' | 'terlambat'
  dicapBatas: boolean
}
export function hitungSelisihKeterlambatan(hariIni: Date, jatuhTempo: Date): SelisihKeterlambatan
```

Konstanta: `FLOOR_HARI = -30`, `CAP_TAHUN = 5` (capHari = 1825, atau 1826 bila rentang menyentuh 29 Feb). `Date` argumen dinormalisasi ke tengah hari UTC sebelum diff.

Matriks boundary wajib-uji (hariIni=2026-08-22): jatuhTempo −40h→−40/efektif−30/belum · −30h→efektif−30 boundary · −1h→belum · hari ini→0/tepat/dendaBerjalan 0/premi jalan · +1h→terlambat · +365h→tahunPenuh1/tunggakan1 · +366h (lintas kabisat)→tetap 1 · +730h (~2 thn)→aktif ~730, tunggakan2 · +1825h→cap batas, tunggakan4 · +1826h→dicap, maks 5 periode · +2190h (6 thn)→cap, Baris 2–6 tetap 5 periode (US3).

## 2. Model per Transaksi (`models/`, FR-007)

```ts
export interface CalculationModel {
  readonly kode: KodeTransaksi
  /** Tanggal jatuh tempo selanjutnya setelah periode yang dihitung. */
  hitungJatuhTempoSelanjutnya(jatuhTempo: Date, periodeTerpakai: number): Date
}
```

Implementasi: `perpanjangan.ts`, `balik-nama.ts`, `mutasi-masuk.ts`, `mutasi-keluar.ts`. Baseline identik prototype Open Design: `tambahTahun(jatuhTempo, periodeTerpakai + 1)` (pertahankan hari-dan-bulan; 29 Feb → 28 Feb pada tahun non-kabisat). Perbedaan rumus antar modul (bila dikonfirmasi saat implementasi) cukup mengubah satu file model + unit test modul tsb — UI/store tak tersentuh.

## 3. Orkestrator (`hitung.ts`)

```ts
export interface InputHitung {
  transaksi: KodeTransaksi
  tanggalJatuhTempo: Date
  jenis: JenisKendaraan
  fungsi: FungsiKendaraan
  kategoriCc: KategoriCc
}
export interface HasilPerhitungan { /* lihat data-model.md §2 */ }
export function hitungPerhitungan(
  input: InputHitung,
  tarif: TarifRecord,            // hasil lookup kunci; caller bertanggung jawab lookup
  hariIni: Date,
  keringananAktif: boolean,
  model?: CalculationModel,      // default: model sesuai input.transaksi
): HasilPerhitungan
```

Aturan:
- `premiBerjalan = tarif.premiPokok`.
- `dendaBerjalan = round(premi × tarif.dendaPerTahun × max(0, selisih.hariEfektif)/365)`; 0 bila status ≠ `terlambat`.
- Untuk k=1..periodeTunggakan: `premiTunggakan[k]=premi`, `dendaTunggakan[k]=round(premi × dendaPerTahun × k)`.
- `applyKeringanan`: bila aktif → semua denda (berjalan+tunggakan) = 0; premi tak tersentuh; `keringananDiterapkan=true` (FR-012).
- Pembulatan per komponen (integer rupiah); total = Σ komponen terbulatkan.
- `tanggalJatuhTempoSelanjutnya` dari model.

Wajib-uji tambahan: kombinasi SC-003 (setiap transaksi × jenis × fungsi × CC valid vs CSV) dan SC-006 (keringanan ON/OFF tanpa mengubah TarifRecord).
