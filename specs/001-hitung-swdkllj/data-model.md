# Data Model: Hitung SWDKLLJ

**Status**: REWRITE 2026-08-28 mengikuti `business-logic.md` (formula & tarif, delivered user 2026-08-28). Model lama berbasis PMK 16/2017 (jenis × fungsi × kategori_cc, SelisihKeterlambatan clamp −30/1825) TIDAK VALID.

## 1. Enums

| Enum | Nilai | Catatan |
|---|---|---|
| `KodeTransaksi` | `PERPANJANGAN, BALIK_NAMA, MUTASI_KELUAR, MUTASI_MASUK` | Label UI: Perpanjangan/Pengesahan, Balik Nama, Mutasi Keluar, Mutasi Masuk. |
| `Golongan` | `A, B, C1, C2, DP, DU, EP, EU, F` | Kunci tabel tarif (business-logic.md §2). |
| `FamilyCc` | `motor, minibus-au, barang-penumpang-non-umum, null` | Family yang menyediakan radio CC konfirmasi; `null` = tanpa radio (boleh tidak muncul). Radio CC OPSIONAL sejak keputusan 2026-08-28 sesi 2. |
| `StatusHasil` | `rincian, belum-jatuh-tempo, lunas` | `belum-jatuh-tempo` hanya mungkin untuk PERPANJANGAN (§6.1); `lunas` hanya mungkin untuk BALIK_NAMA/MUTASI_MASUK Case B. |

Enums lama yang dihapus: `JenisKendaraan (motor|mobil)`, `KategoriCc`, `FungsiKendaraan` sebagai enum terpisah (fungsi Angkutan Umum kini terkodifikasi dalam golongan DU/EU), `StatusSelisih` (floor/cap hari tidak berlaku lagi).

## 2. Entitas

### Transaksi
| Field | Tipe | Aturan |
|---|---|---|
| `kode` | `KodeTransaksi` | Unik per pilihan Card 1. |
| `label` | string | Teks tombol Card 1. |
| `familyCc` | tidak disimpan di transaksi | Family ditentukan oleh **golongan**, bukan transaksi. Transaksi mengubah alur perhitungan (§9), bukan tarif. |

### KendaraanInput (Card 2)
| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `tanggalJatuhTempo` | Date | ya | Tanggal jatuh tempo asli STNK. |
| `golongan` | `Golongan` | ya | Dari dropdown jenis kendaraan yang dirender dari kolom `deskripsi` CSV (9 pilihan; granularitas §13.3 DITUTUP 2026-08-28 sesi 2 = 9 baris deskripsi). Baris terpilih menentukan golongan → tarif. |
| `pilihanCc` | `'bawah' \| 'atas' \| null` | tidak | Radio CC = konfirmasi opsional (tidak memblokir Hitung); prefill dari `default_cc`; selection `'atas'`/`'bawah'` dapat meng-adjust golongan dalam family sama via `konfirmasiGolongan` (kontrak domain-api §1). |

### TarifGolongan (1 baris CSV, kontrak csv-tarif.md)
`golongan, deskripsi, defaultCc, kartuDana, tarifPokok, tarifDendaMaksimal, konstantaDendaTriwulan (0,25), konstantaPokokPerbulan (0,083333333)`.
Aturan integritas: 9 baris, golongan unik & lengkap, uang integer ≥ 0, konstanta ∈ [0,1] (non-A > 0), deskripsi non-kosong, defaultCc integer ≥ 1. Pelanggaran → fail-closed seluruh file (FR-008).

### DataPeriode (hasil hitung, kontrak domain-api §3)
`anchorDate`, `gapDays` (signed, kalender absolut), `totalOverdueYears`, `tunggakanCount = MIN(totalOverdueYears, 4)`, `berjalanYear = gapDays > 30 ? currentYear : currentYear + 1`. Slot Tunggakan N = tahun `currentYear − N`.

### HasilPerhitungan
| Field | Tipe | Invarian |
|---|---|---|
| `status` | `StatusHasil` | — |
| `keterlambatan` | string | Format `"{tunggakanCount} tahun, {hariDendaBerjalan} hari"` (§8). |
| `pokokBerjalan`, `dendaBerjalan` | number | Integer rupiah; Mutasi Keluar selalu 0. |
| `pokokTunggakan1..4`, `dendaTunggakan1..4` | number | Integer rupiah; denda tunggakan = `tarifDendaMaksimal` flat. |
| `pokokProrata` | number | Hanya Balik Nama/Mutasi Masuk; 0 untuk yang lain. |
| `kartuDana` | number | Selalu 3.000 dari tabel. |
| `totalPremi` | number | Integer rupiah; Golongan A selalu 3.000 (§7). |
| `jatuhTempoSelanjutnya` | Date | Format tampil `dd MMMM yyyy`. |
| `keringananDiterapkan` | boolean | `true` bila kebijakan keringanan aktif (FR-012). |

**Invarian global**: semua field uang integer rupiah (pembulatan hanya via `roundMoney` pada nilai kalkulasi); tidak ada komponen negative value.

### AdminSession (clarified 2026-08-26)
`verifiedToken: boolean` — verifikasi dengan membandingkan input token terhadap `VITE_ADMIN_TOKEN` (env), sync & offline OK. Tanpa email, tanpa Firebase Auth. `resetSession()` menghapus sesi.

### KebijakanKeringanan (clarified 2026-08-26; saluran distribusi ditunda 2026-08-28)
`periode: { tanggalMulai: Date, tanggalAkhir: Date }` (ISO). `aktif = hariIni ∈ [mulai, akhir]` pakai jam lokal perangkat — bila periode habis, otomatis kembali normal walaupun offline. Saluran distribusi global (tadinya Firebase Remote Config) **DILEWATI/DITUNDA** (keputusan pengguna 2026-08-28): periode ditetapkan admin terverifikasi dan disimpan lokal; keputusan saluran ditetapkan saat implementasi bila kebutuhan muncul. Cadence fetch (app start / event `online` / >12 jam) berlaku kembali bila saluran distribusi diadakan.

## 3. State Machine Wizard (Card 1 → 3)

Transisi tidak berubah dari plan 2026-08-23, hanya guard diperbarui:

1. **Idle → Step1**: pilih transaksi Card 1.
2. **Step1 → Step2**: transaksi terpilih + tombol **"Lanjutkan"** ditekan (keputusan 2026-08-28 sesi 2); bila kembali ke Card 1 setelah Card 2 terbuka → **reset penuh** (FR-003 Option A).
3. **Step2 → Step3 (hitung)**: tombol **"Hitung Premi SWDKLLJ"**; guard = `tanggalJatuhTempo` valid **DAN** `golongan` terpilih **DAN** `tarifStore.tariffAvailable === true`. Radio CC opsional — tidak ikut guard. Hasil `belum-jatuh-tempo`/`lunas` tetap masuk Step 3 sebagai pesan (tanpa rincian angka).
4. **Step3 → Step2 / reset**: tombol "Hitung Ulang" mereset ke Card 1.

## 4. Sumber Kebenaran

| Aspek | Sumber |
|---|---|
| Angka tarif & formula | `business-logic.md` (PMK 36/2008 terkonfirmasi Hero DB) + `src/data/tarif-swdkllj.csv` |
| Kontrak parser CSV | `contracts/csv-tarif.md` |
| Kontrak fungsi domain | `contracts/domain-api.md` |
| Visual/UI | Open Design project `Hitung SWDKLLJ` via MCP (FR-014), token Tailwind v4 (research R9) |

## 5. Changelog

- **2026-08-28 (sesi 2)**: dropdown jenis = kolom deskripsi CSV; `cc` → `pilihanCc` radio opsional + `konfirmasiGolongan`; `defaultCc` masuk TarifGolongan; transisi wizard via tombol Lanjutkan/Hitung; Firebase Remote Config ditunda (keringanan lokal).
- **2026-08-28**: REWRITE — enums golongan/CC-family, entitas HasilPerhitungan berbasis §8, AdminSession/KebijakanKeringanan clarified 2026-08-26.
- 2026-08-23: versi awal (superseded).
