# Contract: Domain API (Pure Calculation Functions)

**Status**: WAJIB dipatuhi implementasi `src/domain/` dan unit test.
**Sumber kebenaran formula**: `business-logic.md` (§3–§9, delivered user 2026-08-28). Angka tarif dari `contracts/csv-tarif.md`.
**Supersedes**: rumus lama berbasis PMK 16/2017 (floor −30/cap 1825 hari, denda pro-rata harian) TIDAK VALID — digantikan kontrak ini.

Semua fungsi domain WAJIB pure, TypeScript ketat, ditulis test-first (Constitution III). Tidak ada akses DOM/store/network. Semua nilai uang integer rupiah; pembulatan hanya via `roundMoney` pada hasil kalkulasi, bukan pada hasil lookup tabel.

## 1. Types & Aturan Pemilihan Golongan

```ts
export type KodeTransaksi = 'PERPANJANGAN' | 'BALIK_NAMA' | 'MUTASI_KELUAR' | 'MUTASI_MASUK';
export type Golongan = 'A' | 'B' | 'C1' | 'C2' | 'DP' | 'DU' | 'EP' | 'EU' | 'F';
export type FamilyCc = 'motor' | 'minibus-au' | 'barang-penumpang-non-umum' | null;
export type StatusHasil = 'rincian' | 'belum-jatuh-tempo' | 'lunas';
```

Family golongan & batas adjustment CC (business-logic.md §2.1; model UI direvisi keputusan pengguna 2026-08-28 sesi 2):

| Family | Golongan | Batas | Radio CC (opsional, dinamis) |
|---|---|---|---|
| `motor` | C1 / C2 | ≤250 → C1, >250 → C2 | dua opsi di bawah/di atas 250cc |
| `minibus-au` | DU / EU | ≤1600 → DU, >1600 → EU | dua opsi di bawah/di atas 1600cc |
| `barang-penumpang-non-umum` | DP / F | ≤2400 → DP, >2400 → F | dua opsi di bawah/di atas 2400cc |
| `null` | A, B, EP, EU (bus) | pilihan dropdown langsung | boleh tidak muncul (keputusan pengguna: "sisanya optional tidak muncul cc pun ga papa") |

Model input (keputusan pengguna 2026-08-28 sesi 2, menggantikan input CC angka wajib business-logic §10):

1. **Dropdown jenis kendaraan** = kolom `deskripsi` CSV (9 pilihan); baris terpilih menentukan `golongan` → tarif. Ini input wajib.
2. **Radio CC = konfirmasi OPSIONAL** ("optional aja selama user dengan benar memilih jenis kendaraan"): tidak memblokir tombol Hitung. Bila user memilih opsi radio yang melewati batas family, golongan **di-adjust** ke pasangan dalam family yang sama (mis. pilih deskripsi motor C1 lalu radio >250cc → golongan menjadi C2; berlaku juga arah sebaliknya dan untuk DU↔EU, DP↔F). Teks label radio & aturan kemunculannya per golongan ditranskrip dari Open Design (T005, FR-014); bila berbeda dengan dokumen mana pun, Open Design menang dan selisih dicatat.

```ts
export type PilihanCc = 'bawah' | 'atas' | null;
// 'bawah' = opsi radio ≤ batas family; 'atas' = opsi > batas; null = tanpa pilihan
export function konfirmasiGolongan(golongan: Golongan, pilihan: PilihanCc): Golongan
// family null atau pilihan null → golongan apa adanya (tanpa adjustment)
// motor: bawah→C1 atas→C2 · minibus-au: bawah→DU atas→EU · non-umum: bawah→DP atas→F
// pilihan default radio saat golongan pertama dipilih = default_cc > batas family
// (kontrak csv-tarif §2; untuk seluruh 9 baris, default mereproduksi golongan terpilih)
```

`InputHitung.cc` angka dihapus — kalkulasi tidak pernah memakai CC; golongan hasil adjustment adalah satu-satunya penentu tarif. Metadata pilihan CC (label opsi terpilih) hanya untuk chip ringkasan Card 3.

## 2. Pembulatan Uang

```ts
export function roundMoney(x: number): number  // CEIL(x / 100) * 100
```

Hanya untuk nilai hasil kalkulasi (prorata). Nilai dari tabel tarif sudah bulat dan tidak boleh dibulatkan ulang.

## 3. Data Periode (business-logic.md §3, §5.1–5.2, §6)

Dihitung dari `dueDateOriginal` (tanggal jatuh tempo asli) dan `hariIni` (tanggal lokal saat perhitungan):

| Field | Formula |
|---|---|
| `anchorDate` | `SET_YEAR(dueDateOriginal, currentYear)` |
| `gapDays` | `anchorDate − hariIni`, signed, selisih kalender absolut, presisi tahun kabisat (anti-fraud §11: dilarang konstanta 30-hari/365-hari sebagai pengganti tanggal) |
| `totalOverdueYears` | `currentYear − year(dueDateOriginal)` |
| `tunggakanCount` | `MIN(totalOverdueYears, 4)` |
| `berjalanYear` | `gapDays > 30 ? currentYear : currentYear + 1` |

Slot **Tunggakan N** = tahun `currentYear − N` (N = 1..4). Periode total maksimum 5: 1 Berjalan + 4 Tunggakan.

Contoh verifikasi (business-logic.md §9.1): C1, jatuh tempo 26 Mei 2024, hari ini 27 Agustus 2026 → tunggakanCount = 2 (tahun 2025 dan 2024), Berjalan = 2026.

## 4. Denda Berjalan — Triwulan (business-logic.md §5.3)

```ts
export function hitungDendaBerjalan(
  titikAwal: Date,           // awal tahun berjalan keterlambatan
  hariIni: Date,
  tarifDendaMaksimal: number,
): { bulanDenda: number; triwulan: number; denda: number }
```

- `bulanDenda = fullMonths + (remainingDays > 0 ? 1 : 0)` — **TANPA grace period**: telat 1 hari langsung masuk triwulan 1.
- `triwulan = MIN(CEIL(bulanDenda / 3), 4)`.
- `denda = tarifDendaMaksimal × konstanta_denda_triwulan × triwulan` (konstanta 0,25 dari tabel).
- Rollover: jika keterlambatan berjalan melewati 365/366 hari, sisa berubah menjadi slot **Tunggakan baru (penuh)** dan sisa hari dihitung ulang sebagai Berjalan.
- Contoh verifikasi: C1 (denda maksimal 32.000), 93 hari → bulan 4 → triwulan 2 → 32.000 × 0,25 × 2 = **16.000**.

## 5. Pokok Prorata — hanya Balik Nama & Mutasi Masuk (business-logic.md §5.4)

```ts
export function hitungPokokProrata(
  titikAwal: Date,
  titikAkhir: Date,
  tarifPokok: number,
  kartuDana: number,
): { bulanProrata: number; pokokProrata: number }
```

- `bulanProrata = fullMonths + (remainingDays > 15 ? 1 : 0)` — grace: sisa 0–15 dibulatkan ke bawah, >15 ke atas.
- `pokokProrata = roundMoney(tarifPokok × (0,083333333 × bulanProrata) + kartuDana)`.
- Contoh verifikasi C1 (pokok 32.000, kartu 3.000): 5 bulan → 16.400; 3 bulan → 11.000.

## 6. hitungPerhitungan — Orkestrasi Utama

```ts
export interface InputHitung {
  transaksi: KodeTransaksi;
  dueDateOriginal: Date;
  golongan: Golongan;             // hasil dropdown deskripsi ± adjustment konfirmasiGolongan
  pilihanCc?: PilihanCc;          // metadata tampilan saja (chip) — kalkulasi tidak memakai CC
}

export function hitungPerhitungan(
  input: InputHitung,
  tarif: TarifGolongan,           // baris tabel sesuai golongan
  hariIni: Date,
  keringananAktif: boolean,
): HasilPerhitungan
```

Aturan umum:
- **Golongan A**: total = `kartu_dana` (Rp3.000) selalu — semua komponen lain 0 (business-logic.md §7).
- Pokok per periode = `tarif_pokok`. Denda tunggakan per tahun penuh = `tarif_denda_maksimal` **flat 100%**, bukan persentase dari pokok.
- Keringanan aktif (FR-012): semua komponen **denda** menjadi 0; pokok dan tarif tabel tak tersentuh.
- `totalPremi` = jumlah seluruh komponen + kartu dana, integer rupiah.
- Output string: `keterlambatan` = `"{tunggakanCount} tahun, {bulanPenuh} bulan, {sisaHari} hari"`; bulan prorata sebagai string tambahan untuk Balik Nama/Mutasi Masuk; `jatuhTempoSelanjutnya` format `dd MMMM yyyy` (business-logic.md §8).

### 6.1 PERPANJANGAN (Pengesahan/Perpanjangan) — business-logic.md §9.1

- Block (business-logic.md §6.1): jika `tunggakanCount === 0 && gapDays > 30` → `status: 'belum-jatuh-tempo'`, pesan persis **"Premi Belum Jatuh Tempo / Masih Berlaku"**, perhitungan berhenti.
- Selain itu: Pokok/Denda Tunggakan 1..tunggakanCount + Pokok/Denda Berjalan (triwulan §5.3) + prorata = 0.
- JTS: `gapDays > 30 ? anchorDate : SET_YEAR(dueDateOriginal, currentYear + 1)`.
- Contoh verifikasi: C1, jatuh tempo 26 Mei 2024, hari ini 27 Agustus 2026 → Pokok Berjalan 32.000 + Denda Berjalan 16.000 + 2 × (32.000 + 32.000) + kartu 3.000 = **179.000**, JTS **26 Mei 2027**.

### 6.2 BALIK_NAMA & MUTASI_MASUK — business-logic.md §9.2, §9.4 (identik 100%)

- Tidak ada block §6.1. Tambahan komponen **Pokok Prorata** (§5.4).
- **Case A** (`gapDays ≤ 30`, ada tunggakan berjalan): komponen seperti Perpanjangan + prorata → JTS = **hariIni + 1 tahun**. Contoh verifikasi total **190.000**, JTS 27 Agustus 2027.
- **Case B** (`dueDateOriginal > hariIni`, tunggakanCount 0):
  - `dueDateOriginal > hariIni + 1 tahun` → `status: 'lunas'`, total 0.
  - Selain itu → prorata dihitung dari `anniversary_terakhir_yang_lewat` sampai `hariIni`.
  - ⚠️ **ASUMSI PENDING-VALIDASI (§13.1)**: `anniversary_terakhir_yang_lewat = dueDateOriginal − 1 tahun` — definisi ini belum divalidasi dengan contoh angka oleh user. Unit test wajib memakai nilai asumsi ini dan membawa marker `pending-validasi` jelas; JANGAN dipasarkan sebagai perilaku final.

### 6.3 MUTASI_KELUAR — business-logic.md §9.3

- Pokok/Denda Berjalan = 0 **selalu**, tanpa prorata.
- Hanya komponen tunggakan 1..tunggakanCount.
- JTS = `anchorDate`. Contoh verifikasi: C1, jatuh tempo 26 Mei 2024, hari ini 27 Agustus 2026 → 2 × (32.000 + 32.000) + kartu 3.000 = **131.000**, JTS 26 Mei 2026.
- ⚠️ **ASUMSI PENDING-VALIDASI (§13.2)**: bila `tunggakanCount === 0`, JTS tetap `anchorDate` — belum dikonfirmasi user. Unit test wajib marker `pending-validasi`.

## 7. Wajib Uji (Constitution III — test-first)

1. Ketiga contoh terverifikasi di atas lolos eksak: 179.000 / 190.000 / 131.000 (termasuk JTS-nya).
2. Boundary wajib: `gapDays` 30 vs 31 (perubahan `berjalanYear`); lewat 1 hari → triwulan 1 (tanpa grace); rollover 365/366 hari; tanggal melintasi 29 Februari (kabisat); batas cap 4 tunggakan (kasus 4 tahun dan 4 tahun + 1 hari; kasus >4 tahun tetap 4 slot).
3. Golongan A → total selalu 3.000 pada semua transaksi dan kondisi keterlambatan.
4. Block `belum-jatuh-tempo` hanya terjadi untuk PERPANJANGAN — Balik Nama / Mutasi Masuk / Mutasi Keluar tidak pernah menghasilkan status block.
5. Case B Balik Nama: `lunas` total 0 (due > hari ini + 1 tahun) dan jalur prorata.
6. `roundMoney` & prorata: contoh 5 bulan → 16.400, 3 bulan → 11.000, dan pembulatan sisa hari 0–15 vs 16+.
7. `konfirmasiGolongan`: pilihan `'atas'`/`'bawah'` memindahkan golongan dalam family (C1↔C2, DU↔EU, DP↔F); family `null` atau pilihan `null` tidak pernah mengubah golongan; pilihan default turunan `default_cc` (> batas family) mereproduksi golongan terpilih untuk seluruh 9 baris (fixture csv-tarif §1).
8. Sampling SC-003: keempat transaksi × 9 golongan pada data periode yang sama, hasil konsisten dengan kontrak (tarif identik, alur berbeda).
9. Keringanan aktif vs non-aktif: semua denda menjadi 0 saat aktif, pokok tidak berubah.
10. Seluruh jalur asumsi §13.1 dan §13.2 ditandai `pending-validasi` dan didokumentasikan di komentar test.

## 8. Changelog Kontrak

- **2026-08-28 (sesi 2)**: model input CC direvisi — dropdown jenis = kolom `deskripsi` CSV; radio CC konfirmasi opsional (tidak memblokir Hitung) dengan adjustment golongan (`konfirmasiGolongan`, menggantikan `pilihGolongan` CC angka); `default_cc` = pilihan default radio; `InputHitung.cc` dihapus; §13.3 ditutup (9 baris deskripsi) & I1 EU ditutup (EU via dropdown, radio opsional).
- **2026-08-28**: REWRITE total — formula business-logic.md (triwulan, prorata, DataPeriode, empat modul transaksi) menggantikan rumus lama PMK 16/2017.
- 2026-08-23: versi awal (superseded).
