# Data Model: Hitung SWDKLLJ

**Turunan dari**: [spec.md](./spec.md) Key Entities + [research.md](./research.md)

## 1. Enum & Tipe Dasar (`src/domain/types.ts`)

```ts
type KodeTransaksi = 'perpanjangan' | 'balik-nama' | 'mutasi-masuk' | 'mutasi-keluar'
type FungsiKendaraan = 'pribadi' | 'angkutan'
type KategoriCc = 'lt-250' | 'gt-250' | 'lt-2400' | 'gt-2400'   // <250cc, >250cc, <2400cc, >2400cc
type JenisKendaraan = 'motor' | 'mobil'
type StatusSelisih = 'belum-jatuh-tempo' | 'tepat' | 'terlambat'
```

Validasi: nilai di luar union ditolak parser CSV / guard store (tidak pernah diketik manual pengguna — semua lewat select/radio).

## 2. Entitas

### Transaksi (Card 1)
| Field | Tipe | Aturan |
|---|---|---|
| kode | `KodeTransaksi` | wajib dipilih sebelum Lanjutkan; label Indonesia: Perpanjangan / Pengesahan · Balik Nama · Mutasi Masuk · Mutasi Keluar |

Relasi: memilih `CalculationModel` (R8) dan menjadi bagian kunci pencarian tarif.

### KendaraanInput (Card 2)
| Field | Tipe | Aturan |
|---|---|---|
| tanggalJatuhTempo | `string` ISO date (`<input type=date>`) | wajib; tidak boleh kosong; date picker mencegah format invalid |
| jenis | `JenisKendaraan` | wajib; menentukan opsi CC yang tampil (FR-004 dinamis) |
| fungsi | `FungsiKendaraan` | default `pribadi`; radio chip |
| kategoriCc | `KategoriCc` | wajib; hanya nilai relevan utk jenis: motor→lt-250/gt-250; mobil→lt-2400/gt-2400 |

Relasi: kunci pencarian tarif = `(kode transaksi, jenis, fungsi, kategoriCc)`.

### TarifRecord (`tarif-swdkllj.csv`, read-only)
| Kolom CSV | Field | Tipe | Aturan validasi parser |
|---|---|---|---|
| kode_transaksi | kodeTransaksi | enum §1 | harus anggota union |
| jenis_kendaraan | jenis | enum §1 | harus anggota union |
| fungsi_kendaraan | fungsi | enum §1 | harus anggota union |
| kategori_cc | kategoriCc | enum §1 | harus anggota union |
| premi_pokok | premiPokok | integer > 0 (rupiah) | bilangan bulat, tanpa desimal/negatif |
| denda_per_tahun | dendaPerTahun | number 0 < r ≤ 1 | desimal titik, mis. 0.25 |
| sumber_rujukan | sumberRujukan | string non-kosong | mis. `PMK 16/PMK.010/2017` |

Aturan integritas seluruh file:
- Header kolom persis sesuai urutan di atas.
- Kunci unik: tidak ada duplikat `(kode_transaksi, jenis_kendaraan, fungsi_kendaraan, kategori_cc)`.
- Minimal lengkap: setiap kombinasi yang dapat dibentuk UI (4 transaksi × {motor×2CC + mobil×2CC} × 2 fungsi) punya baris.
- **Satu saja pelanggaran → seluruh file ditolak** → state `tariffUnavailable` (bukan fallback parsial).

Relasi: dicari berdasarkan KendaraanInput + Transaksi; tidak pernah dimutasi.

### SelisihKeterlambatan (Baris 1 Card 3)
| Field | Tipe | Aturan |
|---|---|---|
| hariAktual | integer (boleh negatif) | selisih kalender UTC jatuhTempo vs hariIni |
| hariEfektif | integer | `clamp(hariAktual, −30, 1825\|1826)` — floor −30 hari, cap 5 tahun |
| tahunPenuh | integer ≥ 0 | `floor(hariEfektif/365)` |
| periodeTunggakan | integer 0..4 | `min(tahunPenuh, 4)` (Berjalan + maks 4 tunggakan = maks 5 periode) |
| status | `StatusSelisih` | turunan tanda hariAktual |
| dicapBatas | boolean | true bila terpotong floor/cap |

State transitions (hariAktual): `< −30` → −30 (belum-jatuh-tempo) · `−30..−1` → aktual (belum-jatuh-tempo) · `0` tepat · `1..1825` aktual (terlambat) · `≥1826` cap 1825/1826 (terlambat, dicap).

### HasilPerhitungan (Card 3)
| Field | Tipe | Aturan |
|---|---|---|
| selisih | `SelisihKeterlambatan` | §2 atas |
| premiBerjalan | integer rupiah | dari TarifRecord.premiPokok |
| dendaBerjalan | integer rupiah | `round(premi × dendaPerTahun × max(0,hariEfektif)/365)`; 0 jika status ≠ terlambat |
| premiTunggakan[1..n] | integer rupiah | n = periodeTunggakan; masing-masing = premiPokok |
| dendaTunggakan[1..n] | integer rupiah | masing-masing = `round(premi × dendaPerTahun × k)` |
| tanggalJatuhTempoSelanjutnya | string ISO date | dari `CalculationModel.hitungJatuhTempoSelanjutnya()` — baseline `+ (periodeTunggakan+1) tahun` |
| totalEstimasi | integer rupiah | Σ semua premi + denda pasca-keringanan |
| keringananDiterapkan | boolean | jejak audit mode saat hitung |

Invarian: semua rupiah integer (bulatkan per komponen, bukan total); total = penjumlahan komponen yang sudah dibulatkan.

### AdminSession (scaffolding)
| Field | Tipe | Aturan |
|---|---|---|
| isAuthenticated | boolean | hanya bisa true via login online (`navigator.onLine === true`); gagal/offline → tetap false + pesan |
| email | string \| null | identitas sesi; tidak ada data personal lain disimpan |

### KebijakanKeringanan (FR-012)
| Field | Tipe | Aturan |
|---|---|---|
| aktif | boolean | sumber: Remote Config (online) → cache localStorage (offline pakai nilai terakhir) |
| besaran | literal `'100%'` | satu-satunya kebijakan: seluruh Denda Berjalan + Tunggakan 1–4 → 0; premi tak tersentuh; data tarif tak tersentuh |

Transisi: admin toggle ON → broadcast global (Remote Config) → klien fetch saat online/start → `aktif=true` → hasil hitung berikutnya denda 0; toggle OFF/logout → kembali normal.

## 3. State Machine UI (`kalkulatorStore`)

```
state: { step: 1|2|3, transaksi?: KodeTransaksi, input: KendaraanInput|null, hasil?: HasilPerhitungan }
```

| Kejadian | Guard | Efek |
|---|---|---|
| pilih transaksi + Lanjutkan | transaksi ≠ null, else validasi "Pilih jenis transaksi" | step=2, Card 2 reveal |
| ubah transaksi (Card 1) saat step ≥ 2 | — | **reset penuh**: input=null, hasil=undefined, step=2 dengan form kosong, Card 3 hidden (FR-003 Opsi A) |
| Hitung Premi SWDKLLJ | semua field wajib valid && tariffAvailable | hasil=hitungPerhitungan(...), step=3, scroll ke Card 3 |
| Hitung Ulang | — | reset penuh: transaksi=null, input=null, hasil=undefined, step=1, scroll top, focus select (FR-009) |

Invarian lintas siklus: 5× hitung-reset-hitung (SC-005) tidak meninggalkan residu — seluruh field direkonstruksi dari literal default.

## 4. Sumber Kebenaran

- Angka tarif: **hanya** `src/data/tarif-swdkllj.csv` (skema: [contracts/csv-tarif.md](./contracts/csv-tarif.md)), sumber regulasi PMK No. 16/PMK.010/2017.
- Label & token visual: **hanya** Open Design project `Hitung SWDKLLJ` (transkripsi Tailwind: [contracts/ui-components.md](./contracts/ui-components.md)).
- Rumus tanggal: `domain/models/*` per modul ([contracts/domain-api.md](./contracts/domain-api.md)).
