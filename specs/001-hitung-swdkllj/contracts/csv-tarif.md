# Contract: Master Tarif CSV (`src/data/tarif-swdkllj.csv`)

**Status**: WAJIB dipatuhi isi file CSV dan parser (`src/services/csv-parser.ts`).
**Sumber kebenaran TUNGGAL angka tarif** (FR-008, FR-013): PMK No. 36/PMK.010/2008, tabel 9 golongan terkonfirmasi terhadap database internal Hero — data final diserahkan pengguna 2026-08-28 (termasuk kolom `default_cc` dan teks deskripsi baru; lihat Changelog).
**Supersedes**: skema lama `kode_transaksi × jenis × fungsi × kategori_cc` (PMK 16/2017, 40 baris) TIDAK VALID — tarif bersifat per-golongan dan identik untuk keempat transaksi; transaksi mengubah alur, bukan tarif.

## 1. Skema & Isi Eksak

Header (urutan kolom PERSIS, case-sensitive):

```
golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan
```

Isi file PERSIS (9 baris data, urutan tetap; field mengandung koma diberi tanda kutip ganda sesuai RFC 4180):

```csv
golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan
A,"Kendaraan Khusus (Ambulance, Damkar, dsb)",2499,3000,0,0,0,0
B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000,0.25,0.083333333
C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0.25,0.083333333
C2,Sepeda Motor Sport > 250cc,255,3000,80000,80000,0.25,0.083333333
DP,"Minibus, Jeep, Sedan, Pickup Ang. Barang",1500,3000,140000,100000,0.25,0.083333333
DU,Minibus Angkutan Umum sd. 1600cc,1500,3000,70000,70000,0.25,0.083333333
EP,Bus dan Microbus Bukan Ang. Umum,3000,3000,150000,100000,0.25,0.083333333
EU,"Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc",3000,3000,87000,87000,0.25,0.083333333
F,Truck / Ang. Barang > 2400cc,2499,3000,160000,100000,0.25,0.083333333
```

## 2. Aturan Kolom

| Kolom | Tipe | Aturan |
|---|---|---|
| `golongan` | enum | `A, B, C1, C2, DP, DU, EP, EU, F` — unik, wajib lengkap 9 baris. Kunci tabel tarif. |
| `deskripsi` | string | Non-kosong. **Label eksak dropdown jenis kendaraan** (FR-004, keputusan 2026-08-28): user memilih baris via teks ini; baris terpilih menentukan golongan → pokok/denda/konstanta. Dipotong tanda kutipnya saat parse. |
| `default_cc` | integer ≥ 1 | Acuan **pilihan default radio CC** ketika radio CC muncul untuk golongan tersebut (keputusan 2026-08-28). TIDAK dipakai kalkulasi. Semantik: pilihan default = `default_cc > batas family` (motor 250, minibus-au 1600, barang/penumpang non-AU 2400) — untuk seluruh 9 baris, pilihan default mereproduksi golongan baris itu sendiri (prefill tanpa adjustment). Pada golongan tanpa radio CC nilainya tetap ada namun tidak terpakai. |
| `kartu_dana` | integer rupiah | ≥ 0. Seluruh golongan = 3000 (komponen tetap total). |
| `tarif_pokok` | integer rupiah | ≥ 0. Pokok per periode (Golongan A = 0). |
| `tarif_denda_maksimal` | integer rupiah | ≥ 0. Denda tunggakan per tahun penuh (flat) DAN basis denda berjalan triwulan. DP/EP/F dipangkas ke 100.000 — sudah baked-in di tabel, dilarang branching kode. |
| `konstanta_denda_triwulan` | desimal titik | ∈ [0,1]; non-A wajib > 0. Nilai tabel 0.25. |
| `konstanta_pokok_perbulan` | desimal titik | ∈ [0,1]; non-A wajib > 0. Nilai tabel 0.083333333. |

Semua kolom wajib hadir pada tiap baris; uang tanpa titik ribuan/desimal/negatif; konstanta desimal memakai titik.

## 3. Encoding

UTF-8 tanpa BOM, newline LF (CRLF ditoleransi parser), pemisah koma, field mengandung koma dikuti ganda (RFC 4180). File dipre-cache service worker (plan: `additionalManifestEntries`/globs) agar tersedia offline (FR-010).

## 4. Perilaku Parser (fail-closed, FR-008 Opsi A)

Satu pelanggaran saja → tolak SELURUH file, dilarang fallback/nilai default:

1. Header persis (urut & case-sensitive).
2. Tepat 9 baris data; golongan unik & lengkap.
3. Uang integer ≥ 0; konstanta ∈ [0,1] (non-A > 0).
4. `deskripsi` non-kosong; `default_cc` integer ≥ 1.
5. Field dikutip (RFC 4180) — kutip rusak/tak tertutup → tolak.

Penolakan → `tarifStore.tariffAvailable = false` → tombol "Hitung Premi SWDKLLJ" disabled + pesan eksak: **"Data tarif tidak tersedia — muat ulang atau perbarui aplikasi"**.

## 5. Wajib Uji Parser

1. Happy path: 9 baris valid → object `TarifGolongan[]` lengkap, deskripsi tanpa kutip, angka benar.
2. Header salah urutan/salah eja/kolom kurang-lebih → reject.
3. Golongan duplikat / hilang / tak dikenal / baris ≠ 9 → reject.
4. Uang negatif, desimal, kosong, non-numerik; konstanta < 0 atau > 1; A dengan konstanta 0 diterima → reject hanya bila aturan dilanggar.
5. File kosong / hanya header → reject.
6. CRLF diterima; BOM di awal file → reject.
7. Field deskripsi berkoma dalam kutip ganda diparse utuh (baris A/B/DP/EU pada isi eksak §1 adalah fixture utama).

## 6. Changelog

- **2026-08-28 (sesi 2)**: skema bertambah kolom `default_cc` (posisi setelah deskripsi) + teks deskripsi final dari pengguna; skema menjadi 8 kolom. Isi 9 baris di atas = data final.
- 2026-08-28: REWRITE — PMK 36/2008 9 golongan menggantikan skema PMK 16/2017.
- 2026-08-23: versi awal (superseded).
