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

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hitung Premi SWDKLLJ Lengkap (Priority: P1)

Sebagai warga/petugas Samsat, saya memilih jenis transaksi dan data kendaraan, menekan hitung, dan melihat rincian premi + denda serta tanggal jatuh tempo selanjutnya agar saya tahu total yang harus dibayar.

**Why this priority**: Ini adalah alur nilai inti aplikasi (end-to-end calculator). Tanpa ini aplikasi tidak memiliki kegunaan. Semua card dan logika perhitungan bermuara di sini.

**Independent Test**: Buka aplikasi → pilih jenis transaksi di Card 1 → tekan Lanjutkan → isi tanggal jatuh tempo, jenis kendaraan, fungsi kendaraan, CC mesin di Card 2 → tekan Hitung Premi SWDKLLJ → verifikasi Card 3 menampilkan selisih keterlambatan, 5 pasang premi/denda (Berjalan + Tunggakan 1-4), dan tanggal jatuh tempo selanjutnya dengan angka yang sesuai tabel tarif resmi.

**Acceptance Scenarios**:

1. **Given** aplikasi baru dibuka, **When** pengguna memilih "Perpanjangan / Pengesahan" di Card 1 dan menekan "Lanjutkan", **Then** Card 2 muncul dan Card 3 belum terlihat.
2. **Given** Card 2 terlihat, **When** pengguna mengisi tanggal jatuh tempo (date picker), jenis kendaraan (dropdown), fungsi kendaraan (radio, default Pribadi), dan CC mesin (radio: <250cc / >250cc / <2400cc / >2400cc) lalu menekan "Hitung Premi SWDKLLJ", **Then** Card 3 muncul menampilkan Baris 1 selisih keterlambatan, Baris 2-6 rincian premi/denda berjalan + tunggakan 1-4, Baris 7 tanggal jatuh tempo selanjutnya.
3. **Given** Card 3 terlihat, **When** pengguna menekan "Hitung Ulang", **Then** seluruh input kembali ke keadaan awal (Card 1 aktif, Card 2 dan Card 3 tersembunyi, form kosong/default).
4. **Given** pengguna belum melengkapi semua field wajib di Card 2, **When** mencoba menekan "Hitung Premi SWDKLLJ", **Then** sistem menolak perhitungan dan menampilkan pesan validasi yang menunjukkan field yang belum diisi.
5. **Given** tanggal jatuh tempo 10 hari yang lalu, **When** perhitungan dijalankan, **Then** selisih keterlambatan ditampilkan sebagai 10 hari (bukan 0) dan premi/denda dihitung untuk 1 periode tunggakan yang relevan.
6. **Given** tanggal jatuh tempo 40 hari ke depan (belum jatuh tempo), **When** perhitungan dijalankan, **Then** selisih keterlambatan ditampilkan sebagai -30 hari (floor) dan hanya Premi Berjalan (+ Denda Berjalan = 0) yang relevan.

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

### User Story 3 - Menampilkan Selisih & Batas Keterlambatan (Priority: P2)

Sebagai petugas, saya perlu melihat selisih keterlambatan yang dibatasi (-30 hari minimum, 5 tahun maksimum) agar denda tidak dihitung melebihi ketentuan Jasa Raharja.

**Why this priority**: Aturan batas ini adalah satu-satunya logika bisnis yang dijelaskan rinci untuk Baris 1 Card 3; kesalahan di sini berdampak finansial.

**Independent Test**: Uji dengan tanggal jatuh tempo 40 hari ke depan (expect -30 hari), tepat hari ini (expect 0), 6 tahun lewat (expect 5 tahun / 1825-1826 hari), dan 2 tahun lewat (expect nilai aktual ~730 hari).

**Acceptance Scenarios**:

1. **Given** hari ini 2026-08-22 dan tanggal jatuh tempo 2026-09-30 (39 hari ke depan), **When** hitung, **Then** Baris 1 menampilkan "-30 hari" (floor).
2. **Given** hari ini 2026-08-22 dan tanggal jatuh tempo 2018-08-22 (8 tahun lewat), **When** hitung, **Then** Baris 1 menampilkan "5 tahun" (cap), dan Baris 2-6 tetap menghitung maksimal 5 periode (Berjalan + Tunggakan 1-4) meskipun keterlambatan aktual > 5 tahun.
3. **Given** hari ini 2026-08-22 dan tanggal jatuh tempo 2024-08-22 (2 tahun lewat), **When** hitung, **Then** Baris 1 menampilkan nilai aktual ~730 hari tanpa cap.

---

### User Story 4 - Scaffolding Admin & Mode Keringanan Denda (Priority: P3)

Sebagai admin, saya dapat login untuk mengaktifkan mode kebijakan keringanan denda tanpa mengubah data tarif di database, sehingga perhitungan denda mengikuti kebijakan penghapusan/potongan denda yang berlaku.

**Why this priority**: Diminta sebagai scaffolding untuk fase awal (login belum diwajibkan di rilis pertama), tapi arsitektur harus disiapkan. Tidak memblokir P1/P2.

**Independent Test**: Verifikasi rute/state login admin ada (meski dapat dinonaktifkan via feature flag) → login berhasil → toggle "Mode Keringanan Denda" aktif → hitung ulang dengan tanggal terlambat → denda menampilkan nilai yang sudah dikeringankan sesuai kebijakan yang diaktifkan; tanpa login, denda normal.

**Acceptance Scenarios**:

1. **Given** aplikasi dalam mode normal (tanpa login admin), **When** perhitungan dengan keterlambatan dijalankan, **Then** denda dihitung penuh sesuai tabel tarif.
2. **Given** admin telah login dan mengaktifkan mode keringanan denda, **When** perhitungan yang sama dijalankan, **Then** denda menampilkan nilai keringanan (mis. 0 atau diskon sesuai kebijakan aktif).
3. **Given** admin logout atau menonaktifkan mode keringanan, **When** perhitungan dijalankan kembali, **Then** denda kembali ke nilai normal.

---

### Edge Cases

- Tanggal jatuh tempo adalah hari ini: selisih 0 hari, Denda Berjalan = 0, Premi Berjalan tetap dihitung.
- Tanggal jatuh tempo kosong atau format tidak valid: date picker mencegah input tidak valid; jika dimanipulasi, validasi menampilkan error dan memblokir hitung.
- Jenis kendaraan tidak dipilih: tombol Hitung dinonaktifkan / validasi muncul.
- Kombinasi CC tidak relevan: tidak terjadi karena filter dinamis (FR-004 Opsi A) — hanya opsi CC relevan yang ditampilkan per jenis kendaraan.
- Keterlambatan tepat -30 hari, 0 hari, 1 tahun, 5 tahun, 5 tahun + 1 hari: semua berada di boundary cap/floor dan harus diuji.
- Pengguna menekan Hitung Ulang di tengah pengisian Card 2: semua state tereset, tidak ada sisa data di memori yang memengaruhi perhitungan berikutnya.
- Offline: seluruh alur Card 1-3 tetap berfungsi tanpa jaringan setelah instalasi PWA; data tarif sudah tersedia lokal.
- CSV tarif gagal dimuat/rusak: tombol Hitung diblokir, pesan error "Data tarif tidak tersedia" ditampilkan — perhitungan tidak dijalankan.
- Admin login gagal (kredensial salah): pesan error yang jelas, tidak ada perubahan mode keringanan.
- Admin login saat offline: diblokir, tampilkan pesan "Login admin memerlukan koneksi internet" — tidak ada percobaan autentikasi lokal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem WAJIB menampilkan navbar yang berisi logo dan nama aplikasi "Hitung SWDKLLJ" di setiap keadaan halaman.
- **FR-002**: Sistem WAJIB menampilkan Card 1 yang berisi dropdown jenis transaksi dengan opsi: Perpanjangan / Pengesahan, Balik Nama, Mutasi Masuk, Mutasi Keluar, dan tombol "Lanjutkan".
- **FR-003**: Sistem WAJIB menyembunyikan Card 2 dan Card 3 pada pemuatan awal; Card 2 hanya muncul setelah pengguna memilih jenis transaksi dan menekan "Lanjutkan" dengan validasi. Jika pengguna mengubah jenis transaksi di Card 1 setelah Card 2 terbuka, sistem WAJIB mengosongkan semua input Card 2 dan menyembunyikan Card 3 (reset penuh ke pilihan baru) — clarified 2026-08-22 (Opsi A).
- **FR-004**: Sistem WAJIB menampilkan Card 2 yang berisi: (a) tanggal jatuh tempo via date picker, (b) jenis kendaraan via dropdown, (c) fungsi kendaraan via radio button (Pribadi default, Angkutan Umum), (d) besar CC mesin via radio button (<250cc, >250cc, <2400cc, >2400cc) dengan filter dinamis — hanya opsi CC yang relevan untuk jenis kendaraan terpilih yang ditampilkan (clarified 2026-08-22 — Opsi A), dan tombol "Hitung Premi SWDKLLJ".
- **FR-005**: Sistem WAJIB memvalidasi kelengkapan semua field Card 2 sebelum mengizinkan perhitungan; field yang kosong/tidak valid harus ditandai dengan pesan yang jelas.
- **FR-006**: Sistem WAJIB menghitung dan menampilkan Card 3 setelah tombol hitung ditekan, berisi Baris 1 selisih keterlambatan dengan aturan floor -30 hari dan cap 5 tahun (1825/1826 hari), Baris 2-6 rincian Premi Berjalan, Denda Berjalan, Premi Tunggakan 1-4 dan Denda Tunggakan 1-4, serta Baris 7 tanggal jatuh tempo selanjutnya.
- **FR-007**: Sistem WAJIB menghitung tanggal jatuh tempo selanjutnya berdasarkan model perhitungan per jenis pendaftaran/transaksi. Aplikasi memiliki beberapa model penghitungan (sesuai jenis transaksi: Perpanjangan/Pengesahan, Balik Nama, Mutasi Masuk/Keluar) yang masing-masing memiliki logic tanggal jatuh tempo selanjutnya sendiri. Detail rumus per model didefinisikan saat implementasi dan diverifikasi per modul (clarified 2026-08-22).
- **FR-008**: Sistem WAJIB menghitung premi dan denda berdasarkan tabel tarif resmi Jasa Raharja yang didefinisikan di awal (data statis, read-only) dengan kombinasi jenis kendaraan + fungsi kendaraan + CC mesin + jenis transaksi. Nilai tarif spesifik disediakan saat implementasi dalam format .CSV sebagai sumber kebenaran tunggal (clarified 2026-08-22); aplikasi memuat CSV tersebut ke penyimpanan lokal read-only. Jika CSV gagal dimuat/rusak, sistem WAJIB memblokir tombol "Hitung Premi SWDKLLJ" dan menampilkan pesan error yang jelas (clarified 2026-08-22 — Opsi A), bukan menebak/menggunakan fallback.
- **FR-009**: Sistem WAJIB menyediakan tombol "Hitung Ulang" di akhir Card 3 yang mereset seluruh state ke kondisi awal (Card 1 aktif, Card 2/3 tersembunyi, form kosong/default).
- **FR-010**: Sistem WAJIB bekerja penuh secara offline setelah instalasi PWA; data tarif dan logika perhitungan tidak bergantung pada jaringan.
- **FR-011**: Sistem WAJIB menyediakan scaffolding rute/state login admin meskipun belum aktif di rilis awal (feature flag / rute terproteksi). Login admin HANYA dapat dilakukan saat online — jika offline, login diblokir dengan pesan "Login admin memerlukan koneksi internet" (clarified 2026-08-22); login TIDAK BOLEH memiliki kemampuan write/update data tarif; satu-satunya efek login adalah mengaktifkan/menonaktifkan mode kebijakan keringanan denda.
- **FR-012**: Sistem WAJIB mendukung mode kebijakan keringanan denda yang ketika aktif menghapus 100% seluruh denda (Denda Berjalan + Denda Tunggakan 1-4 → 0). Logic keringanan diterapkan per modul sesuai jenis pendaftaran/transaksi (clarified 2026-08-22 — Option A), tanpa mengubah data tarif di database. Ketika admin mengaktifkan status keringanan, perhitungan yang dikeringankan WAJIB berlaku untuk semua pengguna secara umum (broadcast global saat online); mekanisme distribusi ditunda dan akan di-brainstorming di fase plan (clarified 2026-08-22).
- **FR-013**: Sistem WAJIB menggunakan penyimpanan lokal yang ringan dan mendukung operasi offline read-only untuk data tarif (tidak ada operasi write/update data tarif dari sisi aplikasi).
- **FR-014**: Kolaborasi UI dengan Open Design pada project `Hitung SWDKLLJ` melalui MCP WAJIB dihormati: token desain, komponen, dan layout mengikuti sumber Open Design; perubahan visual yang menyimpang harus disinkronkan via MCP.

### Key Entities

- **Transaksi**: Jenis operasi yang dipilih pengguna di Card 1. Atribut: kode transaksi (Perpanjangan/Pengesahan, Balik Nama, Mutasi Masuk, Mutasi Keluar). Relasi: memengaruhi konteks perhitungan di Card 3 (dampak spesifik per jenis transaksi — perlu konfirmasi apakah formula berbeda per transaksi atau hanya label, lihat FR-008)
- **Kendaraan**: Kombinasi data di Card 2. Atribut: tanggal jatuh tempo (date), jenis kendaraan (dropdown, daftar nilai — perlu konfirmasi, lihat FR-008), fungsi kendaraan (Pribadi | Angkutan Umum), CC mesin (<250cc | >250cc | <2400cc | >2400cc). Relasi: menjadi kunci pencarian tarif.
- **Tarif SWDKLLJ**: Data statis read-only. Atribut: premi pokok per kombinasi kendaraan, denda per periode, periode tunggakan (Berjalan + 1-4). Relasi: dicari berdasarkan Kendaraan + Transaksi. Sumber: regulasi resmi Jasa Raharja (angka spesifik — perlu konfirmasi, lihat FR-008).
- **Perhitungan (Hasil Hitung)**: Output Card 3. Atribut: selisih keterlambatan (hari/tahun, floor -30 hari, cap 5 tahun), premiBerjalan, dendaBerjalan, premiTunggakan1-4, dendaTunggakan1-4, tanggalJatuhTempoSelanjutnya. Relasi: diturunkan dari Kendaraan + Transaksi + Tarif + tanggal hari ini + mode keringanan.
- **AdminSession (scaffolding)**: State login admin. Atribut: isAuthenticated, isKeringananActive. Relasi: memodifikasi perhitungan denda pada Perhitungan tanpa mengubah Tarif.
- **Kebijakan Keringanan**: Aturan yang mengoverride denda. Atribut: status aktif/nonaktif, besaran keringanan = 100% penghapusan denda (clarified FR-012). Relasi: diterapkan pada Perhitungan saat AdminSession.isKeringananActive = true.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna baru dapat menyelesaikan alur hitung lengkap (Card 1 → Card 2 → Card 3) dalam waktu ≤ 2 menit pada percobaan pertama tanpa bantuan.
- **SC-002**: 100% perhitungan selisih keterlambatan untuk kasus uji batas (-40 hari, -30 hari, 0 hari, 1 tahun, 5 tahun, 6 tahun) menampilkan floor/cap yang benar.
- **SC-003**: 100% kombinasi uji perhitungan (mencakup setiap jenis transaksi × setiap jenis kendaraan × setiap fungsi × setiap CC yang valid) menghasilkan angka premi/denda yang cocok dengan tabel tarif resmi yang didefinisikan (setelah tabel disediakan).
- **SC-004**: Aplikasi tetap menampilkan Card 3 dengan hasil yang benar saat perangkat dalam keadaan offline (airplane mode) setelah kunjungan pertama — diuji pada 3 browser evergreen (Chrome, Safari, Firefox).
- **SC-005**: Tombol "Hitung Ulang" mengembalikan aplikasi ke keadaan awal dalam < 1 detik dan tidak meninggalkan sisa state yang memengaruhi perhitungan berikutnya (verifikasi melalui 5 siklus hitung-reset-hitung berurutan).
- **SC-006**: Mode keringanan denda ketika diaktifkan mengubah nilai denda sesuai kebijakan (verifikasi: denda tunggakan menjadi 0 atau diskon sesuai kebijakan) dan ketika dinonaktifkan denda kembali normal — tanpa perubahan pada data tarif.
- **SC-007**: 90% pengguna uji usability menilai alur tiga card sebagai "jelas" atau "sangat jelas" dan tidak salah menafsirkan urutan Lanjutkan → Hitung → Hitung Ulang.

## Assumptions

- Asumsi berikut dicatat secara eksplisit untuk memenuhi arahan "zero assumption" — setiap asumsi di bawah ini memerlukan konfirmasi dan akan diganti dengan spesifikasi resmi setelah klarifikasi. Sampai saat itu, implementasi TIDAK BOLEH mengarang angka atau perilaku:
- UI mengikuti desain yang disediakan Open Design via MCP pada project `Hitung SWDKLLJ`; spesifikasi ini tidak mendefinisikan warna, tipografi, atau spacing — merujuk ke token Open Design.
- Daftar jenis kendaraan pada dropdown Card 2 diasumsikan mencakup kategori Jasa Raharja (mis. Sepeda Motor, Mobil Penumpang, Mobil Bus, Mobil Barang, dst.) — daftar eksak perlu konfirmasi (lihat FR-008).
- Pemetaan CC: <250cc dan >250cc untuk roda dua; <2400cc dan >2400cc untuk roda empat/lebih — hanya opsi relevan ditampilkan per jenis kendaraan (FR-004 Opsi A, clarified 2026-08-22).
- Rumus tanggal jatuh tempo selanjutnya mengikuti model per jenis pendaftaran/transaksi dan didefinisikan saat implementasi (lihat FR-007, clarified 2026-08-22).
- Jenis transaksi (Perpanjangan, Balik Nama, Mutasi Masuk/Keluar) diasumsikan tidak mengubah besaran premi pokok, namun dapat memengaruhi konteks tampilan/label — perbedaan formula perlu konfirmasi (lihat FR-008).
- Kebijakan keringanan denda menghapus 100% seluruh denda (Berjalan + Tunggakan 1-4 → 0) per modul (lihat FR-012, clarified 2026-08-22).
- Database ringan read-only diasumsikan menggunakan penyimpanan lokal di sisi klien (mis. IndexedDB / local storage) tanpa backend — keputusan teknologi final di fase plan. Pengecualian: login admin mensyaratkan online dan aktivasi keringanan bersifat global/broadcast — mekanisme distribusi ditunda (clarified 2026-08-22) dan menyimpang dari asumsi offline penuh.
- Tidak ada pengumpulan data personal; tidak ada analitik yang memerlukan persetujuan tambahan.
