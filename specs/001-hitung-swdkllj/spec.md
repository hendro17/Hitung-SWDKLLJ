# Feature Specification: Hitung SWDKLLJ

**Feature Branch**: `001-hitung-swdkllj`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "ui tersusun dari navbar yang berisi logo dan nama aplikasi (Hitung SWDKLLJ), kemudian terdapat tiga card utama dibawahnya. pembuatan UI di handle oleh Open Design pada project `Hitung SWDKLLJ` gunakan MCP untuk berkolaborasi. flow app: 1. user memilih jenis transaksi pada card pertama ... 5. dibagian akhir ada tombol `hitung ulang` untuk kembali mengulang proses dari awal. pada tahap pengembangan awal, belum di sediakan login untuk admin. tapi secara scaffolding ini harus di siapkan termasuk dengan pemilihan arsitektur database yang ringan karena aplikasi mendukung PWA secara Offline. terkait database, tidak ada operasi write dan update data. semua data tarif sudah di define di awal. untuk login admin juga sebenarnya hanya berfungsi untuk mengaktifkan mode kebijakan keringanan denda saja tidak untuk melakukan perubahan data pada database. semua pengerjaan harus dilakukan tanpa ada nya asumsi (zero assumption)"

## Clarifications

### Session 2026-08-22

- Q: Ketika pengguna sudah membuka Card 2 dan kemudian mengubah pilihan jenis transaksi di Card 1, bagaimana aplikasi seharusnya menangani data di Card 2 dan hasil di Card 3? → A: Opsi A — Kosongkan Card 2 dan sembunyikan Card 3 setiap kali jenis transaksi diubah (reset penuh ke pilihan baru).
- Q: Jika file CSV tarif SWDKLLJ gagal dimuat atau rusak saat aplikasi dijalankan, bagaimana seharusnya aplikasi merespons sebelum perhitungan dilakukan? → A: Opsi A — Blokir tombol Hitung dan tampilkan pesan error yang jelas ("Data tarif tidak tersedia — muat ulang atau perbarui aplikasi").
- Q: Bagaimana opsi radio CC mesin (<250cc, >250cc, <2400cc, >2400cc) seharusnya berperilaku ketika tidak relevan dengan jenis kendaraan yang dipilih? → A: Opsi A — Filter dinamis, hanya tampilkan opsi CC yang relevan untuk jenis kendaraan terpilih.
- Q: Untuk scaffolding admin keringanan (FR-012), apakah login admin harus online-only dan apakah aktivasi keringanan memicu update perhitungan global? → A: Ya — login admin HANYA bisa saat online (offline = blokir login); ketika admin mengaktifkan status keringanan, perhitungan diperbarui untuk semua pengguna secara umum (broadcast global); mekanisme distribusi ditunda dan akan di-brainstorming di fase plan (clarified 2026-08-22).

### Session 2026-08-23

- Q: Framework styling apa yang WAJIB digunakan proyek ini? → A: Proyek WAJIB menggunakan **Tailwind CSS** sebagai satu-satunya fondasi styling seluruh antarmuka. Token desain dari Open Design WAJIB diimplementasikan sebagai tema Tailwind (pemetaan token → konfigurasi tema). Larang menulis CSS kustom di luar utilitas Tailwind kecuali untuk animasi/token yang tidak dapat diekspresikan sebagai utility. (Ditetapkan pengguna 2026-08-23.)

### Session 2026-08-26

- Q: Bagaimana provisioning akun admin (CHK004)? → A: Hanya ada SATU akun admin. Verifikasi berbasis token: admin memasukkan token, token dibandingkan dengan nilai di environment (.env); jika cocok, admin terverifikasi. Tidak ada pendaftaran, tidak ada backend autentikasi. (Ditetapkan pengguna 2026-08-26 — menggantikan mekanisme login online-only email/password 2026-08-22.)
- Q: Berapa cadence fetch status keringanan dari Remote Config (CHK011)? → A: Ditetapkan oleh asisten atas delegasi pengguna ("kamu buatkan saja"): fetch saat aplikasi dimulai; fetch ulang saat online jika fetch berhasil terakhir sudah > 12 jam; fetch juga dipicu saat konektivitas pulih (event `online`). Status keringanan efektif diturunkan secara lokal dari periode ter-cache sehingga hasil tetap benar saat offline. (Ditetapkan 2026-08-26.)
- Q: Berapa usia maksimum cache keringanan saat offline (CHK021)? → A: Dinamis — admin menetapkan tanggal awal DAN tanggal akhir periode keringanan; cache dipakai selama offline dan sistem otomatis kembali normal ketika tanggal akhir terlewati berdasarkan jam lokal, tanpa memerlukan fetch baru. (Ditetapkan pengguna 2026-08-26.)

### Session 2026-08-28

- Q: Sumber angka tarif dan business logic perhitungan SWDKLLJ? → A: Pengguna menyerahkan dokumen definitif `business-logic.md` (folder spec ini): tabel 9 golongan PMK No. 36/PMK.010/2008 terkonfirmasi terhadap database internal Hero; formula inti (Pokok, Denda Tunggakan flat 100%, Denda Berjalan triwulan, Pokok Prorata grace 0–15/>15, periode/tunggakan cap 4, block 30-hari, rollover 365/366, Golongan A = kartu dana saja) terverifikasi matematis dengan contoh angka. Dokumen ini sumber kebenaran perhitungan; angka PMK 16/2017 lama (termasuk kartu dana Rp3.000 dalam tarif) di artefak lain TIDAK VALID dan digantikan. (Disampaikan pengguna 2026-08-28.)
- Q: Tiga item yang masih terbuka (business-logic §13): definisi anniversary prorata Case B, JTS Mutasi Keluar saat tunggakan_count == 0, granularitas dropdown? → A: Belum diputuskan — tetap item validasi terbuka; implementasi memakai asumsi terdokumentasi di business-logic.md dan TIDAK BOLEH dianggap final sampai dikonfirmasi. (Dicatat 2026-08-28.) → UPDATE sesi 2 (bawah): granularitas (§13.3) DITUTUP.

### Session 2026-08-28 (sesi 2)

- Q: Model input Card 2? → A: Dropdown jenis kendaraan diambil dari kolom `deskripsi` tabel tarif CSV (9 opsi) dan menentukan Pokok/denda/dll. (Menutup §13.3.)
- Q: Peran CC? → A: Radio CC bersifat KONFIRMASI OPSIONAL — "selama user dengan benar memilih jenis kendaraan" tidak memblokir Hitung. Radio dinamis per family: motor → <250cc / >250cc; mobil penumpang/barang → ≤2400 / >2400; sisanya tanpa CC pun tidak apa-apa. Memilih radio meng-adjust golongan dalam family yang sama (contoh: motor + >250cc → C2, pokok 80.000).
- Q: default_cc? → A: Acuan nilai default radio CC yang muncul setelah jenis kendaraan dipilih; alur ini sudah ada di Open Design (approved) — implementasi tinggal mengganti value.
- Q: Alur wizard? → A: Tombol "Lanjutkan" di Card 1 memunculkan Card 2; tombol "Hitung Premi SWDKLLJ" di Card 2 memunculkan Card 3. Skema alur lengkap ada di Open Design (approved).
- Q: Distribusi periode keringanan ke semua pengguna (Firebase Remote Config)? → A: DILEWATI/DITUNDA dulu — kebutuhan diputuskan saat implementasi. Logic inti keringanan (periode tanggalMulai/tanggalAkhir, aktif = hari ini ∈ rentang jam lokal, auto-normal setelah tanggal akhir) tetap diimplementasi; saluran distribusi admin→pengguna belum dibangun.
- Q: Besaran keringanan? → A: 100% penghapusan seluruh denda (FR-012) — mengoreksi frasa "0 atau diskon sesuai kebijakan" lama (CHK013 tertutup).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hitung Premi SWDKLLJ Lengkap (Priority: P1)

Sebagai warga/petugas Samsat, saya memilih jenis transaksi dan data kendaraan, menekan hitung, dan melihat rincian premi + denda serta tanggal jatuh tempo selanjutnya agar saya tahu total yang harus dibayar.

**Why this priority**: Ini adalah alur nilai inti aplikasi (end-to-end calculator). Tanpa ini aplikasi tidak memiliki kegunaan. Semua card dan logika perhitungan bermuara di sini.

**Independent Test**: Buka aplikasi → pilih jenis transaksi di Card 1 → tekan Lanjutkan → isi tanggal jatuh tempo, pilih jenis kendaraan (dropdown deskripsi), opsional konfirmasi radio CC di Card 2 → tekan Hitung Premi SWDKLLJ → verifikasi Card 3 menampilkan keterlambatan, Pokok/Denda Berjalan, Pokok/Denda Tunggakan 1–4, Pokok Prorata (khusus Balik Nama/Mutasi Masuk), Total Premi, dan jatuh tempo selanjutnya dengan angka sesuai business-logic.md (sumber tarif & formula 2026-08-28).

**Acceptance Scenarios**:

1. **Given** aplikasi baru dibuka, **When** pengguna memilih "Perpanjangan / Pengesahan" di Card 1 dan menekan "Lanjutkan", **Then** Card 2 muncul dan Card 3 belum terlihat.
2. **Given** Card 2 terlihat, **When** pengguna mengisi tanggal jatuh tempo (date picker), memilih jenis kendaraan (dropdown 9 opsi kolom `deskripsi` tabel tarif), opsional memilih radio CC konfirmasi (dinamis per family — golongan ter-adjust dalam family yang sama), lalu menekan "Hitung Premi SWDKLLJ", **Then** Card 3 muncul menampilkan keterlambatan, Pokok/Denda Berjalan, Pokok/Denda Tunggakan 1–4, Total Premi (termasuk kartu dana Rp3.000), dan jatuh tempo selanjutnya (business-logic.md §8).
3. **Given** Card 3 terlihat, **When** pengguna menekan "Hitung Ulang", **Then** seluruh input kembali ke keadaan awal (Card 1 aktif, Card 2 dan Card 3 tersembunyi, form kosong/default).
4. **Given** pengguna belum melengkapi semua field wajib di Card 2, **When** mencoba menekan "Hitung Premi SWDKLLJ", **Then** sistem menolak perhitungan dan menampilkan pesan validasi yang menunjukkan field yang belum diisi.
5. **Given** tanggal jatuh tempo 10 hari yang lalu (golongan C1), **When** perhitungan dijalankan, **Then** keterlambatan ditampilkan "0 tahun, 10 hari" dan Denda Berjalan masuk triwulan 1 (tanpa grace — lewat 1 hari pun naik tier, business-logic.md §5.3).
6. **Given** tanggal jatuh tempo 40 hari ke depan dan tidak ada tunggakan, **When** perhitungan Perpanjangan/Pengesahan dijalankan, **Then** sistem menampilkan pesan "Premi Belum Jatuh Tempo / Masih Berlaku" dan tidak memproses kalkulasi (kondisi block, business-logic.md §6.1); jika ada tunggakan, kalkulasi tetap diproses normal.

---

### User Story 2 - Progressive Disclosure Tiga Card (Priority: P1)

Sebagai pengguna awam, saya melihat alur bertahap: hanya Card 1 di awal, Card 2 setelah menekan Lanjutkan, dan Card 3 setelah menekan Hitung, sehingga saya tidak kebingungan mengisi data sekaligus.

**Why this priority**: Merupakan kontrak UI yang eksplisit dari deskripsi pengguna. Mengikat ke prinsip Kesederhanaan & UX (konstitusi V).

**Independent Test**: Muat ulang halaman → verifikasi hanya navbar + Card 1 terlihat → pilih transaksi + Lanjutkan → Card 2 terlihat, Card 3 belum → lengkapi Card 2 + Hitung → Card 3 terlihat.

**Acceptance Scenarios**:

1. **Given** halaman dimuat, **When** belum ada interaksi, **Then** Card 2 dan Card 3 tersembunyi, hanya Card 1 (dropdown jenis transaksi + tombol Lanjutkan) yang terlihat di bawah navbar.
2. **Given** pengguna belum memilih jenis transaksi, **When** mencoba menekan Lanjutkan, **Then** sistem mencegah transisi dan menampilkan validasi "Pilih jenis transaksi".
3. **Given** Card 2 sudah terlihat, **When** pengguna mengubah pilihan jenis transaksi di Card 1, **Then** sistem mengosongkan semua input Card 2 dan menyembunyikan Card 3 (reset penuh); **When** pengguna menekan Hitung Ulang, **Then** state kembali ke kondisi awal (Card 1 aktif, Card 2/3 tersembunyi).

---

### User Story 3 - Tampilan Keterlambatan & Batas Periode Penagihan (Priority: P2)

Sebagai petugas, saya melihat keterlambatan ("N tahun, M hari") dengan penagihan dibatasi maksimal 5 periode (1 Berjalan + maksimum 4 Tunggakan) agar perhitungan mengikuti ketentuan Jasa Raharja (business-logic.md §3, §6).

**Why this priority**: Aturan batas periode penagihan berdampak finansial langsung.

**Independent Test**: Uji tanggal jatuh tempo: 10 hari lewat (expect "0 tahun, 10 hari" + denda triwulan 1), contoh terverifikasi §9.1 (due 26 Mei 2024, today 27 Agu 2026, golongan C1 → Total 179.000), 6 tahun lewat (expect cap 4 tunggakan + 1 berjalan = 5 periode), > 365 hari dalam tahun berjalan (expect rollover ke slot Tunggakan baru), dan 40 hari ke depan tanpa tunggakan (expect pesan block).

**Acceptance Scenarios**:

1. **Given** golongan C1, jatuh tempo 26 Mei 2024, hari ini 27 Agustus 2026, **When** hitung Perpanjangan/Pengesahan, **Then** keterlambatan "2 tahun, 93 hari", Pokok Berjalan 32.000, Denda Berjalan 16.000 (triwulan 2), Tunggakan 1–2 masing-masing 32.000 + 32.000, Total Premi 179.000, JTS 26 Mei 2027 (contoh terverifikasi business-logic.md §9.1).
2. **Given** keterlambatan 6 tahun, **When** hitung, **Then** penagihan maksimal 5 periode: `tunggakan_count = MIN(total_overdue_years, 4)` — tahun paling lama terpotong, Baris tunggakan tetap maksimal 4 slot + Berjalan.
3. **Given** keterlambatan melebihi 365/366 hari dalam satu tahun berjalan, **When** hitung, **Then** kelebihan di-rollover menjadi slot Tunggakan baru (pokok + denda maksimal penuh) dan sisa hari dihitung ulang (business-logic.md §5.3).

---

### User Story 4 - Scaffolding Admin & Mode Keringanan Denda (Priority: P3)

Sebagai admin, saya dapat login untuk mengaktifkan mode kebijakan keringanan denda tanpa mengubah data tarif di database, sehingga perhitungan denda mengikuti kebijakan penghapusan/potongan denda yang berlaku.

**Why this priority**: Diminta sebagai scaffolding untuk fase awal (login belum diwajibkan di rilis pertama), tapi arsitektur harus disiapkan. Tidak memblokir P1/P2.

**Independent Test**: Verifikasi rute/state login admin ada (meski dapat dinonaktifkan via feature flag) → login berhasil → toggle "Mode Keringanan Denda" aktif → hitung ulang dengan tanggal terlambat → denda menampilkan nilai yang sudah dikeringankan sesuai kebijakan yang diaktifkan; tanpa login, denda normal.

**Acceptance Scenarios**:

1. **Given** aplikasi dalam mode normal (tanpa login admin), **When** perhitungan dengan keterlambatan dijalankan, **Then** denda dihitung penuh sesuai tabel tarif.
2. **Given** admin terverifikasi token dan periode keringanan aktif mencakup hari ini, **When** perhitungan yang sama dijalankan, **Then** denda menampilkan nilai keringanan 0 (sesuai FR-012).
3. **Given** tanggal akhir periode keringanan telah terlewati (atau periode diperbarui tanpa mencakup hari ini), **When** perhitungan dijalankan kembali, **Then** denda kembali ke nilai normal — termasuk saat perangkat offline (evaluasi jam lokal).

---

### Edge Cases

- Tanggal jatuh tempo adalah hari ini (gap_days = 0): Denda Berjalan = 0, Pokok Berjalan tetap dihitung, Berjalan_year = current_year + 1 (business-logic.md §6).
- Tanggal jatuh tempo kosong atau format tidak valid: date picker mencegah input tidak valid; jika dimanipulasi, validasi menampilkan error dan memblokir hitung.
- Golongan kendaraan tidak dipilih: tombol Hitung dinonaktifkan / validasi muncul.
- CC tidak konsisten dengan golongan terpilih: tidak terjadi — input CC mengoreksi otomatis golongan sesuai batas grup (Motor ≤250→C1 / >250→C2; Minibus AU ≤1600→DU / >1600→EU; Barang/Penumpang non-AU ≤2400→DP / >2400→F) — business-logic.md §2.1.
- Boundary wajib uji: gap_days tepat 30 vs 31 (batas Berjalan_year & JTS); lewat 1 hari (bulan_denda langsung +1, tanpa grace); rollover tepat 365/366 hari (periode lintas 29 Feb); keterlambatan tepat 4 tahun dan 4 tahun + 1 hari (cap tunggakan).
- Golongan A (kendaraan khusus): Total Premi selalu = kartu dana Rp3.000 tanpa komponen pokok/denda apa pun, berapa pun keterlambatannya (business-logic.md §7).
- Balik Nama / Mutasi Masuk tidak tunduk block 30 hari; STNK berlaku > 1 tahun penuh → status Lunas, Total 0 (§9.2 Case B). Mutasi Keluar: Pokok/Denda Berjalan selalu 0, tidak ada prorata, JTS = anchor_date (§9.3).
- Pengguna menekan Hitung Ulang di tengah pengisian Card 2: semua state tereset, tidak ada sisa data di memori yang memengaruhi perhitungan berikutnya.
- Offline: seluruh alur Card 1-3 tetap berfungsi tanpa jaringan setelah instalasi PWA; data tarif sudah tersedia lokal.
- CSV tarif gagal dimuat/rusak: tombol Hitung diblokir, pesan error "Data tarif tidak tersedia" ditampilkan — perhitungan tidak dijalankan.
- Verifikasi token admin gagal (token salah): pesan error yang jelas, tidak ada perubahan mode keringanan; verifikasi token tidak memerlukan koneksi internet (clarified 2026-08-26).
- Admin menetapkan periode keringanan: berlaku lokal; saluran distribusi ke semua pengguna (Remote Config/broadcast) masih ditunda (keputusan pengguna 2026-08-28 sesi 2).
- Tanggal akhir periode keringanan terlewati saat pengguna offline: keringanan otomatis nonaktif berdasarkan jam lokal; cache periode kedaluwarsa tidak lagi dipakai (clarified 2026-08-26).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem WAJIB menampilkan navbar yang berisi logo dan nama aplikasi "Hitung SWDKLLJ" di setiap keadaan halaman.
- **FR-002**: Sistem WAJIB menampilkan Card 1 yang berisi dropdown jenis transaksi dengan opsi: Perpanjangan / Pengesahan, Balik Nama, Mutasi Masuk, Mutasi Keluar, dan tombol "Lanjutkan".
- **FR-003**: Sistem WAJIB menyembunyikan Card 2 dan Card 3 pada pemuatan awal; Card 2 hanya muncul setelah pengguna memilih jenis transaksi dan menekan "Lanjutkan" dengan validasi. Jika pengguna mengubah jenis transaksi di Card 1 setelah Card 2 terbuka, sistem WAJIB mengosongkan semua input Card 2 dan menyembunyikan Card 3 (reset penuh ke pilihan baru) — clarified 2026-08-22 (Opsi A).
- **FR-004**: Sistem WAJIB menampilkan Card 2 yang berisi: (a) tanggal jatuh tempo via date picker, (b) dropdown jenis kendaraan dengan 9 opsi dari kolom `deskripsi` tabel tarif CSV (menutup business-logic.md §13.3, keputusan pengguna 2026-08-28 sesi 2), (c) radio CC bersifat KONFIRMASI OPSIONAL — muncul dinamis setelah jenis kendaraan dipilih (motor → <250cc / >250cc; minibus AU → ≤1600cc / >1600cc; barang/penumpang bukan AU → ≤2400cc / >2400cc; A/B/EP/EU(bus) tanpa radio), nilai default radio = `default_cc` baris golongan, memilih radio meng-adjust golongan dalam family yang sama (konfirmasiGolongan domain-api §1) dan TIDAK PERNAH memblokir tombol Hitung; dan tombol "Hitung Premi SWDKLLJ". Fungsi angkutan umum terkodifikasi dalam golongan (DU/EU) — skema alur/label mengikuti Open Design (FR-014; menggantikan input CC angka clarified 2026-08-28 sesi 1 dan radio jenis/fungsi/CC clarified 2026-08-22).
- **FR-005**: Sistem WAJIB memvalidasi kelengkapan field Card 2 (tanggal jatuh tempo valid + jenis kendaraan terpilih + tarif tersedia) sebelum mengizinkan perhitungan; field yang kosong/tidak valid harus ditandai dengan pesan yang jelas. Radio CC opsional dan tidak termasuk syarat validasi (keputusan pengguna 2026-08-28 sesi 2).
- **FR-006**: Sistem WAJIB menghitung dan menampilkan Card 3 setelah tombol hitung ditekan, berisi: keterlambatan format "{tunggakan_count} tahun, {hari_denda_berjalan} hari" (+ string bulan prorata khusus Balik Nama/Mutasi Masuk), Pokok/Denda Berjalan, Pokok/Denda Tunggakan 1–4 (slot di atas tunggakan_count = 0), Pokok Prorata, Total Premi (seluruh komponen + kartu dana Rp3.000), dan jatuh tempo selanjutnya format dd MMMM yyyy (business-logic.md §8). Penagihan maksimal 5 periode (1 Berjalan + cap 4 Tunggakan). Jika `tunggakan_count == 0` AND `gap_days > 30` pada Perpanjangan/Pengesahan, sistem menampilkan "Premi Belum Jatuh Tempo / Masih Berlaku" dan menghentikan kalkulasi (§6.1); Balik Nama/Mutasi Masuk tidak diblokir (clarified 2026-08-28 — menggantikan floor −30 hari/cap hari).
- **FR-007**: Sistem WAJIB menghitung tanggal jatuh tempo selanjutnya (JTS) dengan aturan per jenis pendaftaran/transaksi (didefinisikan 2026-08-28 di business-logic.md §6 & §9): Perpanjangan/Pengesahan — `gap_days > 30` → anchor_date, selain itu → SET_YEAR(due_date, current_year + 1); Balik Nama/Mutasi Masuk Case A (ada overdue) → today + 1 tahun; Mutasi Keluar → anchor_date. Dua validasi terbuka masih berlaku (business-logic.md §13: definisi anniversary prorata Case B, JTS Mutasi Keluar saat tunggakan_count == 0; §13.3 granularitas DITUTUP 2026-08-28 sesi 2) — implementasi memakai asumsi terdokumentasi dan belum final untuk poin tersebut.
- **FR-008**: Sistem WAJIB menghitung premi dan denda berdasarkan tabel tarif SWDKLLJ keyed per GOLONGAN kendaraan (data statis, read-only) — 9 golongan sesuai PMK No. 36/PMK.010/2008 yang terkonfirmasi terhadap database internal Hero (business-logic.md §2, disampaikan 2026-08-28; angka PMK 16/2017 lama TIDAK VALID). Tarif identik untuk keempat jenis transaksi; jenis transaksi mengubah alur perhitungan (prorata/Berjalan/JTS), bukan tarif. Nilai tersimpan format .CSV sebagai sumber kebenaran tunggal; aplikasi memuat CSV ke penyimpanan lokal read-only. Jika CSV gagal dimuat/rusak, sistem WAJIB memblokir tombol "Hitung Premi SWDKLLJ" dan menampilkan pesan error yang jelas (clarified 2026-08-22 — Opsi A), bukan menebak/menggunakan fallback.
- **FR-009**: Sistem WAJIB menyediakan tombol "Hitung Ulang" di akhir Card 3 yang mereset seluruh state ke kondisi awal (Card 1 aktif, Card 2/3 tersembunyi, form kosong/default).
- **FR-010**: Sistem WAJIB bekerja penuh secara offline setelah instalasi PWA; data tarif dan logika perhitungan tidak bergantung pada jaringan.
- **FR-011**: Sistem WAJIB menyediakan scaffolding rute/state admin meskipun belum aktif di rilis awal (feature flag / rute terproteksi). Hanya ada SATU akun admin (clarified 2026-08-26): verifikasi berbasis token — admin memasukkan token, sistem membandingkannya dengan nilai token admin di environment (.env); jika cocok, admin terverifikasi dan verifikasi ini bekerja offline (menggantikan login online-only 2026-08-22). Verifikasi TIDAK BOLEH memiliki kemampuan write/update data tarif; satu-satunya efek verifikasi adalah kemampuan mengelola mode kebijakan keringanan denda. Mempublikasikan periode keringanan global ke semua pengguna (saluran distribusi) DITUNDA — keputusan pengguna 2026-08-28 sesi 2 (lihat FR-012).
- **FR-012**: Sistem WAJIB mendukung mode kebijakan keringanan denda yang ketika aktif menghapus 100% seluruh denda (Denda Berjalan + Denda Tunggakan 1-4 → 0). Periode keringanan bersifat dinamis (clarified 2026-08-26): admin terverifikasi menetapkan tanggal awal DAN tanggal akhir periode; keringanan aktif hanya jika tanggal hari ini berada di dalam rentang tersebut (evaluasi jam lokal, berlaku juga saat offline). Logic keringanan diterapkan per modul sesuai jenis pendaftaran/transaksi (clarified 2026-08-22 — Option A), tanpa mengubah data tarif di database. Saluran distribusi periode ke semua pengguna (broadcast global) DITUNDA — dilewati dulu, kebutuhan diputuskan saat implementasi (keputusan pengguna 2026-08-28 sesi 2); periode dikelola admin secara lokal. Bila saluran nanti diadakan: cache offline dipakai, dan ketika tanggal akhir terlewati sistem WAJIB otomatis kembali ke denda normal tanpa fetch baru (clarified 2026-08-26). Cadence pengambilan status (saat aplikasi dimulai, saat online pulih, setiap > 12 jam sejak fetch berhasil) berlaku bila saluran diadakan (ditetapkan 2026-08-26).
- **FR-013**: Sistem WAJIB menggunakan penyimpanan lokal yang ringan dan mendukung operasi offline read-only untuk data tarif (tidak ada operasi write/update data tarif dari sisi aplikasi).
- **FR-014**: Kolaborasi UI dengan Open Design pada project `Hitung SWDKLLJ` melalui MCP WAJIB dihormati: token desain, komponen, dan layout mengikuti sumber Open Design; perubahan visual yang menyimpang harus disinkronkan via MCP.

### Key Entities

- **Transaksi**: Jenis operasi yang dipilih pengguna di Card 1. Atribut: kode transaksi (PERPANJANGAN/Pengesahan, BALIK_NAMA, MUTASI_MASUK, MUTASI_KELUAR). Relasi: menentukan alur perhitungan dan JTS — Balik Nama/Mutasi Masuk menambah Pokok Prorata dan tidak tunduk block 30 hari; Mutasi Keluar hanya menagih tunggakan; Mutasi Masuk identik 100% dengan Balik Nama (business-logic.md §9, confirmed 2026-08-28); besaran tarif tetap sama antar transaksi
- **Kendaraan**: Kombinasi data di Card 2. Atribut: tanggal jatuh tempo (date), jenis kendaraan (dropdown 9 opsi kolom `deskripsi` tabel tarif, §13.3 ditutup 2026-08-28 sesi 2), pilihanCc ('bawah'/'atas'/null — radio konfirmasi opsional, prefill default_cc, adjust golongan via konfirmasiGolongan; fungsi angkutan umum terkodifikasi golongan DU/EU). Relasi: golongan menjadi kunci pencarian tarif (confirmed 2026-08-28, business-logic.md §2).
- **Tarif SWDKLLJ**: Data statis read-only per golongan. Atribut per golongan: kartu_dana, tarif_pokok, tarif_denda_maksimal, konstanta_denda_triwulan (0,25), konstanta_pokok_perbulan (0,083333333); tarif_denda_maksimal DP/EP/F dipangkas ke 100.000 (baked-in tabel). Relasi: dicari berdasarkan golongan (transaksi tidak memengaruhi tarif). Sumber: PMK No. 36/PMK.010/2008 dikonfirmasi database internal Hero (business-logic.md §2, confirmed 2026-08-28).
- **Perhitungan (Hasil Hitung)**: Output Card 3. Atribut: keterlambatan ("N tahun, M hari"), pokokBerjalan, dendaBerjalan (triwulan), pokokTunggakan1-4, dendaTunggakan1-4 (flat tarif_denda_maksimal), pokokProrata (Balik Nama/Mutasi Masuk), kartuDana, totalPremi, jatuhTempoSelanjutnya. Relasi: diturunkan dari Kendaraan + Transaksi + Tarif + tanggal hari ini + mode keringanan (formula business-logic.md §5–§9, confirmed 2026-08-28).
- **AdminSession (scaffolding)**: State admin satu akun. Atribut: verifiedToken (hasil verifikasi token terhadap env, bekerja offline), lastFetchKeringananAt. Relasi: mengelola Kebijakan Keringanan tanpa mengubah Tarif.
- **Kebijakan Keringanan**: Aturan yang mengoverride denda. Atribut: tanggalMulai (date), tanggalAkhir (date), besaran keringanan = 100% penghapusan denda; status aktif diturunkan dari posisi tanggal hari ini terhadap rentang (clarified 2026-08-26). Relasi: diterapkan pada Perhitungan selama tanggal hari ini ∈ [tanggalMulai, tanggalAkhir].

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna baru dapat menyelesaikan alur hitung lengkap (Card 1 → Card 2 → Card 3) dalam waktu ≤ 2 menit pada percobaan pertama tanpa bantuan.
- **SC-002**: 100% kasus uji batas menghasilkan periode/denda yang benar per business-logic.md: gap_days 30 vs 31, lewat 1 hari (triwulan naik tanpa grace), tepat 0 hari, 1 tahun, rollover 365/366 hari, keterlambatan > 4 tahun (cap tunggakan), dan 40 hari ke depan tanpa tunggakan (block Perpanjangan).
- **SC-003**: 100% contoh terverifikasi business-logic.md §9 lolos (Perpanjangan C1 → 179.000/JTS 26 Mei 2027; Balik Nama Case A → 190.000/JTS today + 1 tahun; Mutasi Keluar → 131.000/JTS anchor_date) dan sampling kombinasi 4 transaksi × 9 golongan cocok dengan tabel tarif PMK 36/2008 (disampaikan 2026-08-28).
- **SC-004**: Aplikasi tetap menampilkan Card 3 dengan hasil yang benar saat perangkat dalam keadaan offline (airplane mode) setelah kunjungan pertama — diuji pada 3 browser evergreen (Chrome, Safari, Firefox).
- **SC-005**: Tombol "Hitung Ulang" mengembalikan aplikasi ke keadaan awal dalam < 1 detik dan tidak meninggalkan sisa state yang memengaruhi perhitungan berikutnya (verifikasi melalui 5 siklus hitung-reset-hitung berurutan).
- **SC-006**: Mode keringanan denda ketika aktif menghapus 100% seluruh denda (Denda Berjalan + Denda Tunggakan 1–4 → 0) dan ketika dinonaktifkan denda kembali normal — tanpa perubahan pada data tarif (mengoreksi frasa "diskon sesuai kebijakan" lama; konsisten FR-012).
- **SC-007**: 90% pengguna uji usability menilai alur tiga card sebagai "jelas" atau "sangat jelas" dan tidak salah menafsirkan urutan Lanjutkan → Hitung → Hitung Ulang.

## Assumptions

- Asumsi berikut dicatat secara eksplisit untuk memenuhi arahan "zero assumption" — setiap asumsi di bawah ini memerlukan konfirmasi dan akan diganti dengan spesifikasi resmi setelah klarifikasi. Sampai saat itu, implementasi TIDAK BOLEH mengarang angka atau perilaku:
- UI mengikuti desain yang disediakan Open Design via MCP pada project `Hitung SWDKLLJ`; spesifikasi ini tidak mendefinisikan warna, tipografi, atau spacing — merujuk ke token Open Design.
- Tarif dan formula perhitungan RESOLVED 2026-08-28: mengikuti business-logic.md (9 golongan PMK No. 36/PMK.010/2008, terverifikasi matematis dengan contoh angka); seluruh angka PMK 16/2017 lama di artefak lain TIDAK VALID.
- Dua item validasi terbuka (business-logic.md §13, tercatat 2026-08-28 — BELUM final): (1) definisi `anniversary_terakhir_yang_lewat` untuk Pokok Prorata Balik Nama/Mutasi Masuk Case B (asumsi saat ini = due_date_original − 1 tahun, belum ada contoh angka); (2) JTS Mutasi Keluar ketika tunggakan_count == 0 (asumsi saat ini = anchor_date). Item ketiga (§13.3 granularitas dropdown) DITUTUP 2026-08-28 sesi 2 — dropdown jenis kendaraan = kolom `deskripsi` tabel tarif CSV. Implementasi memakai asumsi terdokumentasi (1)-(2) dan wajib divalidasi sebelum dianggap final.
- Kebijakan keringanan denda menghapus 100% seluruh denda (Berjalan + Tunggakan 1-4 → 0) per modul (lihat FR-012, clarified 2026-08-22).
- Database ringan read-only diasumsikan menggunakan penyimpanan lokal di sisi klien (mis. IndexedDB / local storage) tanpa backend — keputusan teknologi final di fase plan. Verifikasi admin berbasis token dan BEKERJA OFFLINE (clarified 2026-08-26); saluran distribusi periode keringanan ke semua pengguna (broadcast Remote Config) DITUNDA — dilewati dulu, kebutuhan diputuskan saat implementasi (keputusan pengguna 2026-08-28 sesi 2).
- Tidak ada pengumpulan data personal; tidak ada analitik yang memerlukan persetujuan tambahan.
