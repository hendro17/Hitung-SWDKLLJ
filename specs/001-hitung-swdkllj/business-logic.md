# SPEC — Business Logic Perhitungan Premi SWDKLLJ

Status: Draft final hasil klarifikasi berjenjang (zero-assumption). Scope dokumen ini murni **business logic perhitungan** — mulai dari input data kendaraan sampai tampil "Rincian Premi". Tidak mencakup submit/pembayaran/penyimpanan transaksi (lihat bagian 12. Out of Scope).

---

## 1. Ringkasan

Modul ini menghitung premi SWDKLLJ (Sumbangan Wajib Dana Kecelakaan Lalu Lintas Jalan) untuk 4 jenis pendaftaran:

| Kode | Jenis Pendaftaran |
|---|---|
| PERPANJANGAN | Pengesahan / Perpanjangan |
| BALIK_NAMA | Balik Nama Pemilik |
| MUTASI_KELUAR | Mutasi Keluar |
| MUTASI_MASUK | Mutasi Masuk (logic identik dengan Balik Nama Pemilik) |

Referensi regulasi: PMK No. 36/PMK.010/2008 (SWDKLLJ), dikonfirmasi ulang terhadap tabel data tarif internal yang berlaku saat ini.

---

## 2. Data Master — Tabel Golongan & Tarif

Sumber: tabel tarif SWDKLLJ (kolom sesuai database internal), semua nilai adalah lookup tetap (bukan hasil kalkulasi).

| golongan | deskripsi | kartu_dana | tarif_pokok | tarif_denda_maksimal | konstanta_denda_triwulan | konstanta_pokok_perbulan |
|---|---|---|---|---|---|---|
| A | Kendaraan Khusus (Ambulance, Damkar, Mobil Jenazah, dsb) | 3.000 | 0 | 0 | 0 | 0 |
| B | Alat Berat (Excavator, Crane, Traktor, Bulldozer, Forklift, dsb) | 3.000 | 20.000 | 20.000 | 0,25 | 0,083333333 |
| C1 | Sepeda Motor Roda 2/3, Skuter ≤ 250cc | 3.000 | 32.000 | 32.000 | 0,25 | 0,083333333 |
| C2 | Sepeda Motor Sport > 250cc | 3.000 | 80.000 | 80.000 | 0,25 | 0,083333333 |
| DP | Minibus, Jeep, Sedan, Pickup/Mobil Barang ≤ 2.400cc, Mobil Penumpang bukan Angkutan Umum | 3.000 | 140.000 | 100.000 | 0,25 | 0,083333333 |
| DU | Minibus Angkutan Umum ≤ 1.600cc | 3.000 | 70.000 | 70.000 | 0,25 | 0,083333333 |
| EP | Bus / Microbus **bukan** Angkutan Umum | 3.000 | 150.000 | 100.000 | 0,25 | 0,083333333 |
| EU | Bus / Microbus Angkutan Umum, Minibus Angkutan Umum > 1.600cc | 3.000 | 87.000 | 87.000 | 0,25 | 0,083333333 |
| F | Truck / Angkutan Barang > 2.400cc | 3.000 | 160.000 | 100.000 | 0,25 | 0,083333333 |

Catatan: kolom `tarif_denda_maksimal` **bukan** selalu sama dengan `tarif_pokok` — untuk golongan DP, EP, F nilainya sengaja dipangkas ke 100.000 meski pokoknya lebih tinggi. Ini sudah baked-in di tabel, tidak perlu percabangan kode khusus.

### 2.1 Batas CC per Golongan (untuk auto-koreksi golongan)

Input CC **hanya relevan untuk golongan C1–F**. Golongan A dan B tidak memerlukan input CC sama sekali (dipilih langsung berdasarkan jenis kendaraan khusus/alat berat).

| Grup ("family") | Golongan | Batas CC |
|---|---|---|
| Motor | C1 | ≤ 250cc |
| Motor | C2 | > 250cc |
| Minibus Angkutan Umum | DU | ≤ 1.600cc |
| Minibus Angkutan Umum | EU | > 1.600cc |
| Barang/Penumpang Non-Umum | DP | ≤ 2.400cc |
| Barang | F | > 2.400cc |
| Bus/Microbus bukan angkutan umum | EP | tidak ada batas CC (dipilih langsung by jenis kendaraan) |
| Bus/Microbus angkutan umum (bukan minibus) | EU | tidak ada batas CC (dipilih langsung by jenis kendaraan) |

**Logic auto-correction golongan berbasis CC** (mencegah kesalahan input, karena presisi uang wajib):
1. User memilih jenis kendaraan di dropdown (mis. "Sepeda Motor", "Pickup/Mobil Barang", "Minibus Angkutan Umum", dst).
2. Untuk grup yang punya CC-split (Motor, Minibus Angkutan Umum, Barang), tampilkan input CC (angka).
3. Begitu CC dimasukkan/diubah, sistem cross-check terhadap batas tabel di atas, dan **otomatis mengganti golongan** yang aktif sesuai grup-nya:
   - Grup Motor: CC ≤ 250 → C1, CC > 250 → C2
   - Grup Minibus Angkutan Umum: CC ≤ 1.600 → DU, CC > 1.600 → EU
   - Grup Barang/Penumpang Non-Umum: CC ≤ 2.400 → DP, CC > 2.400 → F
4. Golongan A, B, EP, EU-(bus/microbus) dipilih langsung tanpa cross-check CC.

> ⚠️ **Perlu direview**: dropdown "jenis kendaraan" di gambar referensi PMK menampilkan sub-tipe granular per golongan (mis. golongan D punya [D1] Pick up/Mobil Barang, [D2] Sedan, [D3] Jeep, [D4] Mobil Penumpang bukan Angkutan Umum, [D5] Mobil Penumpang Angkutan Umum). Database internal Hero hanya punya level golongan (9 baris). Spec ini mengasumsikan dropdown menampilkan **level golongan** (9 pilihan utama, deskripsi gabungan sebagai label), bukan sub-tipe granular. Kalau UI perlu menampilkan sub-tipe granular sebagai pilihan terpisah (untuk UX yang lebih jelas ke user), perlu tabel mapping sub-tipe → golongan tambahan yang belum ada di database saat ini.

---

## 3. Definisi & Terminologi

| Istilah | Definisi |
|---|---|
| `due_date_original` | Tanggal jatuh tempo asli yang diinput user (tanggal, bulan, tahun lengkap) |
| `today` | Tanggal hari ini, sumber: **client/device date** (mendukung PWA offline). Validasi ulang di server wajib dilakukan di modul submit/pembayaran (di luar scope dokumen ini) |
| `current_year` | Tahun kalender `today` saat ini (mis. 2026) |
| `anchor_date` | `due_date_original` dengan tahun diganti ke `current_year` (tanggal & bulan **tidak berubah**, hanya tahun). Contoh: due_date_original = 26 Mei 2024 → anchor_date = 26 Mei 2026 |
| `gap_days` | `anchor_date - today`, dalam hari (signed). Positif = anchor_date belum sampai (siklus tahun ini belum jatuh tempo). Negatif/nol = anchor_date sudah lewat (overdue) |
| `total_overdue_years` | `current_year - year(due_date_original)` — jumlah tahun penuh yang sudah lewat sejak due_date_original |
| `tunggakan_count` | `MIN(total_overdue_years, 4)` — dibatasi maksimal 4 tahun sesuai ketentuan Jasa Raharja (maks. 5 tahun total: 4 tunggakan + 1 berjalan) |
| Triwulan (Q1–Q4) | Pembagian denda berjalan progresif dalam 1 tahun, lihat bagian 5.3 |

**Semua perhitungan selisih hari menggunakan selisih kalender absolut** (actual day-diff, otomatis presisi terhadap tahun kabisat — bukan asumsi 30 hari/bulan).

---

## 4. Aturan Pembulatan Uang

Semua nilai uang hasil kalkulasi (bukan lookup langsung dari tabel) **dibulatkan ke atas (ceiling) ke kelipatan Rp 100**.

```
round_money(x) = CEIL(x / 100) * 100
```

Berlaku untuk: Pokok Prorata, dan komponen manapun yang berpotensi tidak bulat. Nilai `tarif_pokok` dan `tarif_denda_maksimal` dari tabel master adalah lookup langsung (sudah bulat, tidak perlu dibulatkan ulang).

---

## 5. Formula Perhitungan Inti

### 5.1 Pokok (Berjalan / Tunggakan) — per 1 tahun penuh
```
pokok_1_tahun = tarif_pokok (lookup langsung dari golongan terpilih)
```
Golongan A selalu `0`.

### 5.2 Denda Tunggakan — per 1 tahun penuh yang sudah lewat sepenuhnya
```
denda_tunggakan_1_tahun = tarif_denda_maksimal (lookup langsung, flat 100% — bukan persentase dari tarif_pokok)
```
Golongan A selalu `0`.

### 5.3 Denda Berjalan — progresif per triwulan (untuk tahun yang sedang berjalan, belum genap 1 tahun penuh)

**Langkah 1 — hitung jumlah bulan terlewati (bulan_denda), TANPA grace period:**
```
full_months = jumlah bulan kalender penuh dari anchor_date_relevan ke today
remaining_days = sisa hari setelah full_months genap
bulan_denda = full_months + (remaining_days > 0 ? 1 : 0)   // ceiling, lewat 1 hari saja langsung naik 1 bulan
```
> Ini **berbeda** dari aturan pembulatan bulan di Pokok Prorata (5.4) — untuk denda, telat 1 hari pun langsung masuk tier bulan berikutnya, tidak ada grace 0–15 hari. Alasan bisnis: denda memang harus progresif ketat.

**Langkah 2 — tentukan triwulan:**
```
Q1 = bulan_denda 1-3
Q2 = bulan_denda 4-6
Q3 = bulan_denda 7-9
Q4 = bulan_denda 10-12
triwulan = CEIL(bulan_denda / 3), maksimal 4 (tidak ada triwulan ke-5)
```

**Langkah 3 — hitung nominal:**
```
denda_berjalan = tarif_denda_maksimal × konstanta_denda_triwulan × triwulan
              = tarif_denda_maksimal × 0,25 × triwulan
```

**Rollover 365/366 hari:** jika hari terlewati dalam 1 periode tahun berjalan melebihi jumlah hari aktual tahun tersebut (365 hari normal, 366 kalau periode tersebut melewati 29 Februari), maka:
- tahun tersebut dianggap **penuh 1 tahun overdue** → dipindahkan menjadi 1 slot Tunggakan baru (pokok + denda maksimal penuh, triwulan=4/100%)
- sisa hari setelah rollover dihitung ulang sebagai hari ke-1 dari periode/tahun berikutnya (bulan_denda & triwulan dihitung ulang dari titik ini)

**Contoh verifikasi** (golongan C1, tarif_denda_maksimal=32.000): anchor 26 Mei 2026 → today 27 Agustus 2026 = 93 hari. full_months (26 Mei→26 Agu) = 3 bulan genap, remaining_days = 1 (27-26 Agu) → bulan_denda = 4 → triwulan = CEIL(4/3) = 2. `denda_berjalan = 32.000 × 0,25 × 2 = 16.000` ✓.

### 5.4 Pokok Prorata — khusus Balik Nama Pemilik & Mutasi Masuk

**Langkah 1 — hitung bulan prorata DENGAN grace period 0–15/>15 hari:**
```
full_months = jumlah bulan kalender penuh dari titik_awal ke titik_akhir (lihat 9.2 untuk definisi titik_awal/titik_akhir)
remaining_days = sisa hari setelah full_months genap
bulan_prorata = full_months + (remaining_days > 15 ? 1 : 0)   // 0-15 hari dibulatkan turun, >15 hari dibulatkan naik
```
Contoh: 5 bulan 14 hari → 5 bulan. 5 bulan 16 hari → 6 bulan.

**Langkah 2 — hitung nominal:**
```
pokok_prorata_raw = tarif_pokok × (konstanta_pokok_perbulan × bulan_prorata) + kartu_dana
pokok_prorata = round_money(pokok_prorata_raw)
```

**Contoh verifikasi** (golongan C1, tarif_pokok=32.000, kartu_dana=3.000):
- 5 bulan: `32.000 × (0,083333333×5) + 3.000 = 13.333,33 + 3.000 = 16.333,33 → round_money = 16.400` ✓
- 3 bulan: `32.000 × (0,083333333×3) + 3.000 = 8.000 + 3.000 = 11.000` ✓ (sudah bulat, tidak perlu dibulatkan lagi)

---

## 6. Perhitungan Periode (current_year, Tunggakan, Jatuh Tempo Selanjutnya)

Berlaku default untuk semua jenis pendaftaran, dengan pengecualian per modul di bagian 9.

```
anchor_date = SET_YEAR(due_date_original, current_year)
gap_days = anchor_date - today
total_overdue_years = current_year - YEAR(due_date_original)
tunggakan_count = MIN(total_overdue_years, 4)

Tunggakan[1] = current_year - 1   (paling dekat)
Tunggakan[2] = current_year - 2
Tunggakan[3] = current_year - 3
Tunggakan[4] = current_year - 4   (paling lama)
// slot ke-N hanya diisi pokok/denda jika N <= tunggakan_count, selebihnya 0

IF gap_days > 30:
    Berjalan_year = current_year
    Jatuh_Tempo_Selanjutnya = anchor_date  (tidak maju, tahun tetap current_year)
ELSE:  // gap_days <= 30, termasuk sudah lewat/overdue
    Berjalan_year = current_year + 1
    Jatuh_Tempo_Selanjutnya = SET_YEAR(due_date_original, current_year + 1)
```

### 6.1 Kondisi Block: "Premi Belum Jatuh Tempo / Masih Berlaku"
```
IF tunggakan_count == 0 AND gap_days > 30:
    tampilkan pesan "Premi Belum Jatuh Tempo / Masih Berlaku", tombol Hitung tidak memproses kalkulasi lebih lanjut
```
Kondisi ini **hanya** muncul jika benar-benar tidak ada apa pun yang bisa ditagih (tidak ada tunggakan sama sekali DAN siklus tahun ini masih jauh dari jatuh tempo). Jika ada tunggakan meski gap_days>30, kalkulasi tetap diproses normal (tunggakan tetap ditagih, Berjalan mengikuti rule di atas).

---

## 7. Golongan A (Kendaraan Khusus)

Golongan A **selalu** hanya membayar `kartu_dana` (Rp 3.000) — tidak pernah ada Pokok maupun Denda (berjalan/tunggakan/prorata), berapa pun keterlambatannya. Tidak perlu input CC untuk golongan ini.
```
IF golongan == 'A':
    Total Premi = kartu_dana (3.000)
    // semua komponen pokok & denda lainnya = 0
```

---

## 8. Struktur Output — "Rincian Premi SWDKLLJ"

Field output standar (sesuai jenis pendaftaran, field yang tidak relevan diisi 0):

| Field | Keterangan |
|---|---|
| Keterlambatan | String tampilan: `"{tunggakan_count} tahun, {hari_denda_berjalan} hari"` |
| Prorata Pokok | (khusus Balik Nama/Mutasi Masuk) String tampilan jumlah bulan, mis. `"3 Bulan"` |
| Pokok Berjalan | Rp, dari 5.1 untuk `Berjalan_year` (0 untuk Mutasi Keluar — lihat 9.3) |
| Denda Berjalan | Rp, dari 5.3 (0 untuk Mutasi Keluar) |
| Pokok Tunggakan 1–4 | Rp, dari 5.1 per slot (0 jika slot > tunggakan_count) |
| Denda Tunggakan 1–4 | Rp, dari 5.2 per slot (0 jika slot > tunggakan_count) |
| Pokok Prorata | Rp, dari 5.4 (khusus Balik Nama/Mutasi Masuk, selain itu 0) |
| Total Premi | Jumlah seluruh komponen di atas + kartu_dana |
| Jatuh Tempo Selanjutnya | Tanggal, format `dd MMMM yyyy` |

---

## 9. Alur Bisnis per Jenis Pendaftaran

### 9.1 Pengesahan / Perpanjangan

**Input form (card kedua):** Tanggal jatuh tempo (datepicker), Golongan kendaraan (dropdown), CC kendaraan (radio/input, sesuai 2.1), tombol Hitung.

**Algoritma:**
1. Hitung `anchor_date`, `gap_days`, `total_overdue_years`, `tunggakan_count` (bagian 6).
2. Jika kondisi block (6.1) terpenuhi → tampilkan pesan block, stop.
3. Isi Pokok/Denda Tunggakan slot 1–4 sesuai `tunggakan_count` (5.1, 5.2).
4. Hitung Pokok Berjalan (5.1) & Denda Berjalan (5.3) untuk `Berjalan_year`.
5. Pokok Prorata = 0 (tidak berlaku untuk modul ini).
6. Total Premi = jumlah semua komponen + kartu_dana.
7. Jatuh Tempo Selanjutnya sesuai 6.

**Contoh terverifikasi** (golongan C1, due_date_original = 26 Mei 2024, today = 27 Agustus 2026):
`anchor_date=26 Mei 2026, gap_days=-93 (sudah lewat), total_overdue_years=2, tunggakan_count=2, Berjalan_year=2027`
- Pokok Berjalan: 32.000, Denda Berjalan: 16.000 (93 hari → triwulan 2)
- Pokok Tunggakan 1 (2025): 32.000, Denda Tunggakan 1: 32.000
- Pokok Tunggakan 2 (2024): 32.000, Denda Tunggakan 2: 32.000
- Pokok Tunggakan 3–4: 0
- Total Premi: 32.000+16.000+32.000+32.000+32.000+32.000+3.000(kartu dana) = **179.000**
- Jatuh Tempo Selanjutnya: 26 Mei 2027

> Catatan: nominal di atas memakai tarif C1 (32.000) yang benar sesuai database — bukan 35.000 seperti di draft narasi awal.

**Edge case gap_days>30** (mis. due_date jatuh 29 September, hari ini masih jauh dari itu): Berjalan_year=current_year (tidak maju), Jatuh Tempo Selanjutnya=anchor_date (tahun tetap current_year, tidak +1).

---

### 9.2 Balik Nama Pemilik

**Input form:** identik dengan 9.1 (Tanggal jatuh tempo, Golongan, CC, tombol Hitung).

**Perbedaan utama dari Perpanjangan:** field ini menghitung tambahan **Pokok Prorata**, dan **tidak tunduk pada aturan block 30 hari (6.1)** — kasus "belum jatuh tempo" pada modul ini tetap diproses, hanya dikenakan prorata sesuai bulan berjalan tanpa denda (karena tidak overdue), bukan diblokir.

**Algoritma:**
1. Hitung `anchor_date`, `gap_days`, `total_overdue_years`, `tunggakan_count`, seperti bagian 6 (tanpa cek block 6.1).
2. **Case A — ada overdue** (`gap_days <= 30`, artinya current_year sudah/segera lewat): 
   - Isi Tunggakan 1–4, Pokok Berjalan, Denda Berjalan sama seperti 9.1.
   - Pokok Prorata dihitung dari `bulan_denda` yang sama dipakai di Denda Berjalan (5.3 langkah 1), tapi dengan aturan pembulatan grace 0–15/>15 (5.4 langkah 1) — **bukan** ceiling ketat seperti denda.
   - Jatuh Tempo Selanjutnya = `today + 1 tahun` (tanggal & bulan mengikuti tanggal perhitungan `today`, bukan tanggal asli `due_date_original`).
3. **Case B — tidak ada overdue sama sekali** (STNK masih berlaku penuh, `due_date_original > today`):
   - Semua Tunggakan & Denda Berjalan = 0.
   - Jika `due_date_original > today + 1 tahun` (perbandingan tanggal penuh: tanggal+bulan+tahun) → status **Lunas**, Total Premi = 0 (tidak dikutip apa pun).
   - Selain itu → Pokok Prorata dihitung dari selisih hari `anniversary_terakhir_yang_lewat → today` (lihat catatan validasi di bawah), dikonversi ke bulan dengan aturan grace 0–15/>15, tanpa komponen denda.

**Contoh terverifikasi — Case A** (golongan C1, due_date_original=26 Mei 2024, today=27 Agustus 2026):
`tunggakan_count=2, bulan_denda=4 (93 hari) → dengan grace 0-15/>15: full_months=3, remaining_days=1 (≤15) → bulan_prorata=3`
- Pokok Berjalan: 32.000, Denda Berjalan: 16.000
- Pokok Tunggakan 1: 32.000 / Denda Tunggakan 1: 32.000
- Pokok Tunggakan 2: 32.000 / Denda Tunggakan 2: 32.000
- Pokok Prorata (3 bulan): `32.000×(0,083333333×3)+3.000 = 11.000`
- Total Premi: 32.000+16.000+32.000+32.000+32.000+32.000+11.000+3.000(kartu dana) = **190.000**
- Jatuh Tempo Selanjutnya: 27 Agustus 2027 (today + 1 tahun)

> ⚠️ **PERLU VALIDASI DENGAN CONTOH ANGKA** — Case B (tidak ada tunggakan, STNK masih berlaku) belum ada contoh numerik dari Hero untuk diverifikasi silang, berbeda dengan Case A yang sudah saya cocokkan persis dengan rumus. Definisi `anniversary_terakhir_yang_lewat` pada spec ini saya asumsikan = `due_date_original - 1 tahun` (titik mulai periode yang sedang berjalan saat ini). Mohon dicek dengan 1 contoh angka konkret sebelum diimplementasikan, karena berbeda logika referensi titik-awal dari Case A (yang pakai `anchor_date`, bukan `due_date_original - 1 tahun`).

---

### 9.3 Mutasi Keluar

**Input form:** identik dengan 9.1.

**Perbedaan utama:** Pokok Berjalan & Denda Berjalan **selalu 0** — modul ini hanya menagih Pokok Tunggakan & Denda Tunggakan (tahun-tahun yang sudah lewat penuh/rollover). Tidak ada komponen Prorata.

**Algoritma:**
1. Hitung `anchor_date`, `total_overdue_years`, `tunggakan_count` (bagian 6, cara hitung sama).
2. Isi Pokok/Denda Tunggakan slot 1–4 sesuai `tunggakan_count` (5.1, 5.2) — identik dengan modul lain.
3. Pokok Berjalan = 0, Denda Berjalan = 0 (**selalu**, tanpa syarat — periode tahun yang sedang berjalan/belum genap rollover ke tunggakan baru tidak pernah ditagih untuk transaksi Mutasi Keluar).
4. Pokok Prorata = 0 (tidak berlaku).
5. Total Premi = jumlah Pokok+Denda Tunggakan + kartu_dana.
6. Jatuh Tempo Selanjutnya = `anchor_date` (current_year) — titik terakhir sampai mana pokok sudah tertagih; **tidak** maju ke current_year+1 karena Berjalan tidak ditagih.

**Contoh terverifikasi** (golongan C1, due_date_original=26 Mei 2024, today=27 Agustus 2026):
`tunggakan_count=2`
- Pokok Berjalan: 0, Denda Berjalan: 0
- Pokok Tunggakan 1: 32.000 / Denda Tunggakan 1: 32.000
- Pokok Tunggakan 2: 32.000 / Denda Tunggakan 2: 32.000
- Total Premi: 32.000+32.000+32.000+32.000+3.000(kartu dana) = **131.000**
- Jatuh Tempo Selanjutnya: 26 Mei 2026

> ⚠️ **Asumsi (belum eksplisit dikonfirmasi)**: jika `tunggakan_count == 0` (tidak ada tunggakan sama sekali untuk Mutasi Keluar), Jatuh Tempo Selanjutnya diasumsikan tetap = `anchor_date` (tidak berubah dari tanggal jatuh tempo saat ini, karena tidak ada yang dibayarkan). Mohon dikonfirmasi jika ada perilaku lain yang diharapkan untuk kasus ini.

---

### 9.4 Mutasi Masuk

Logic perhitungan **identik 100% dengan Balik Nama Pemilik (bagian 9.2)** — termasuk Case A/B, formula prorata, dan aturan Jatuh Tempo Selanjutnya. Tidak ada perbedaan business logic antara kedua modul ini; perbedaan hanya di label/jenis transaksi yang tercatat.

---

## 10. Validasi Input

- Tanggal jatuh tempo: wajib diisi, format tanggal valid (datepicker).
- Golongan kendaraan: wajib dipilih dari 9 opsi di tabel master (bagian 2).
- CC kendaraan: wajib diisi untuk golongan C1/C2/DU/EU/DP/F (lihat 2.1); tidak ditampilkan/tidak wajib untuk golongan A dan B.
- Tombol Hitung: disabled sampai field wajib terisi lengkap.

---

## 11. Precision & Anti-Fraud

- Semua perhitungan selisih hari **wajib** menggunakan fungsi date-diff kalender absolut (native, bukan asumsi 30 hari/bulan atau 365 hari/tahun tetap), agar otomatis presisi terhadap tahun kabisat.
- Rollover tahun kabisat: batas 1 periode tahun berjalan adalah 366 hari jika periode tersebut melewati tanggal 29 Februari, selain itu 365 hari (lihat 5.3).
- Selisih 1 hari berdampak pada perubahan tier triwulan/denda — tidak boleh ada pembulatan/toleransi di level hari manapun sebelum masuk ke rumus bulan/triwulan.

---

## 12. Out of Scope

- Proses setelah "Hitung" ditampilkan: submit transaksi, pembayaran, cetak struk, penyimpanan ke database — **tidak** termasuk dalam spec ini.
- Validasi ulang tanggal di server (wajib ada di modul submit/pembayaran nanti, karena spec ini pakai client date untuk mendukung PWA offline).
- Definisi skema database (tabel golongan/tarif sudah ada di sistem terpisah milik Hero, di luar scope idaman-jr).
- Sub-tipe granular kendaraan per golongan (lihat catatan di 2.1) — jika dibutuhkan, perlu spec tambahan.

---

## 13. Ringkasan Asumsi & Hal yang Perlu Direview

Ditandai eksplisit (bukan silent assumption), mohon dikonfirmasi/dikoreksi sebelum implementasi:

1. **(9.2 Case B)** Formula Pokok Prorata untuk Balik Nama/Mutasi Masuk saat STNK masih berlaku penuh (tidak ada tunggakan) — definisi `anniversary_terakhir_yang_lewat` diasumsikan `due_date_original - 1 tahun`, belum ada contoh angka untuk diverifikasi silang.
2. **(9.3)** Jatuh Tempo Selanjutnya untuk Mutasi Keluar ketika `tunggakan_count == 0` diasumsikan tetap = `anchor_date` (tidak berubah).
3. **(2.1)** Dropdown "jenis kendaraan" diasumsikan menampilkan 9 golongan level-atas (sesuai database), bukan sub-tipe granular (A1-A4, D1-D5, E1-E5, F1-F5) yang muncul di gambar referensi PMK.

Selain 3 poin di atas, seluruh formula core (Pokok, Denda Tunggakan, Denda Berjalan/triwulan, Pokok Prorata, pembulatan, periode/tunggakan, block 30-hari) sudah **terverifikasi matematis** terhadap contoh angka & tabel PMK yang diberikan Hero.
