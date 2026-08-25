# Phase 0 Research: Hitung SWDKLLJ

**Tanggal**: 2026-08-23 | **Status**: Semua NEEDS CLARIFICATION teresolusi

## R1. Stack aplikasi: Vue 3 + Vite + TypeScript

- **Decision**: Vue 3.5+ dengan Composition API `<script setup>`, Vite sebagai build tool, TypeScript untuk seluruh kode (termasuk modul domain finansial).
- **Rationale**: Diwajibkan konstitusi (Vue 3 Composition API, Pinia, tooling build standar Vue = Vite). TypeScript dipilih karena keluaran aplikasi adalah angka finansial — type-safe domain mengurangi risiko salah tipe/units pada perhitungan; konstitusi mensyaratkan akurasi non-negotiable.
- **Alternatives considered**: Plain JavaScript (ditolak: tanpa jaminan tipe pada domain uang); Nuxt (ditolak: SSR tidak dibutuhkan, melanggar kesederhanaan).

## R2. Testing framework: Vitest + @vue/test-utils

- **Decision**: Vitest untuk unit test domain (test-first) dan smoke test komponen. Playwright hanya opsional untuk verifikasi offline end-to-end.
- **Rationale**: Native ke Vite (konfigurasi nol, satu toolchain), mendukung pola test-first konstitusi III. Quality gate konstitusi: unit logika lulus penuh + smoke komponen + build sukses + verifikasi manual offline/PWA.
- **Alternatives considered**: Jest (ditolak: butuh adapter Vite, duplikasi konfigurasi); Cypress (ditolak: lebih berat untuk kebutuhan smoke).

## R3. PWA: vite-plugin-pwa (Workbox generateSW)

- **Decision**: Gunakan `vite-plugin-pwa` mode `generateSW`; precache seluruh aset hasil build (termasuk CSV tarif) + runtime caching yang meniru strategi prototype Open Design: navigasi same-origin → network-first fallback cache; aset same-origin → cache-first; sekunder → stale-while-revalidate.
- **Rationale**: Manifest dari Open Design dipertahankan isinya (nama disesuaikan konstitusi → `Hitung SWDKLLJ Jasa Raharja`). Precache otomatis Workbox menjamin pembaruan aman versi (tidak ada campuran cache lama/baru — konstitusi IV) tanpa menjaga daftar file manual seperti `sw.js` prototype (cache name `swdkllj-v4`) yang rawan lupa saat nama aset ter-hash.
- **Alternatives considered**: Salin `sw.js` Open Design apa adanya (ditolak: daftar precache manual rapuh terhadap hashed filenames; tetap dipakai sebagai referensi strategi fetch); InjectManifest custom SW (ditunda: YAGNI, tak ada kebutuhan push/sync).

## R4. Penyimpanan tarif: CSV di-bundle + precache service worker (tanpa IndexedDB)

- **Decision**: `src/data/tarif-swdkllj.csv` di-import sebagai URL aset oleh Vite, di-fetch & divalidasi saat startup, hasil parse disimpan di `tarifStore`. Kegagalan fetch/parse/validasi → `tariffAvailable=false` → tombol "Hitung Premi SWDKLLJ" dinonaktifkan + pesan "Data tarif tidak tersedia — muat ulang atau perbarui aplikasi" (FR-008). Tidak ada IndexedDB.
- **Rationale**: CSV ikut shell yang diprecache → tersedia offline sejak kunjungan pertama; memenuhi FR-013 ("penyimpanan lokal ringan read-only") dengan kompleksitas minimum. Tidak ada operasi write/update sama sekali (spec).
- **Alternatives considered**: IndexedDB/localForage (ditolak: duplikasi data tanpa manfaat karena CSV read-only dan sudah lokal); SQLite WASM (ditolak: overkill untuk ±20 baris data); hardcode objek TS (ditolak: melanggar FR-008 — CSV adalah sumber kebenaran tunggal).

## R5. Sumber angka tarif: PMK No. 16/PMK.010/2017

- **Decision**: Angka premi pokok dalam CSV merujuk PMK No. 16/PMK.010/2017 (perubahan atas PMK 36/PMK.010/2008), tarif tahunan termasuk biaya kartu dana Rp3.000: motor 50–250cc Rp35.000; motor >250cc Rp83.000; mobil penumpang/pickup/sedan/jeep bukan AU ≤2400cc Rp143.000; mobil barang/truk >2400cc Rp163.000; bus/mikrobus bukan AU Rp153.000; mobil penumpang AU ≤1600cc Rp73.000; bus AU >1600cc Rp90.000. Denda mengikuti model aplikasi: 25% premi per periode tunggakan (denda berjalan pro-rata 25% × sisa hari/365) — konsisten prototype Open Design; kolom `denda_per_tahun` di CSV membuat nilai ini data-driven sehingga perubahan regulasi tidak menyentuh kode. Setiap baris CSV membawa kolom `sumber_rujukan`.
- **Rationale**: Zero-assumption — angka tidak dikarang; footer Open Design sendiri mencantumkan rujukan PMK tersebut. Nilai final dikonfirmasi ulang saat penyusunan CSV (tugas implementasi) sebelum test disetujui.
- **Alternatives considered**: Tarif tiered denda harian resmi PMK (25%/50%/75%/100% per 90-hari) (ditolak untuk rilis ini: model Card 3 spesifik spec adalah Berjalan + Tunggakan 1–4 sesuai desain Open Design; struktur CSV tetap memungkinkan evolusi).

## R6. Distribusi global status keringanan + login admin online-only

- **Decision**: Scaffolding memakai Firebase Auth (email/password, aturan admin) + Firebase Remote Config boolean `keringanan_aktif`. Admin login HANYA dieksekusi saat `navigator.onLine` (offline → blokir dengan pesan "Login admin memerlukan koneksi internet"). Toggle admin menulis Remote Config → semua klien mengambil nilai saat app start / kembali online; nilai terakhir di-cache ke localStorage sehingga mode offline memakai status terakhir yang diketahui. Seluruhnya dibungkus interface `AdminService` (`login`, `logout`, `observeKeringanan`) dan disembunyikan di balik feature flag `VITE_FEATURE_ADMIN=false` untuk rilis awal (FR-011). SDK di-import dinamis agar bundle utama tetap ringan dan jalur offline tidak memuat kode jaringan.
- **Rationale**: Spec clarified 2026-08-22 meminta broadcast global + brainstorming mekanisme distribusi di fase plan. Remote Config memberi distribusi global nyata tanpa membangun backend sendiri; caching lokal menjaga prinsip offline-first untuk fungsi hitung. Ini satu-satunya kebutuhan server, terdokumentasi di konstitusi ("kecuali ada kebutuhan nyata yang terdokumentasi").
- **Alternatives considered**: Supabase Auth + tabel status (setara, ditunda sebagai vendor swap — interface `AdminService` membuat penggantian murah); polling JSON statis di hosting (ditolak: tanpa auth, siapa pun bisa men-flip status keringanan); BroadcastChannel (ditolak: hanya antar-tab perangkat sama, bukan global).

## R7. Daftar jenis kendaraan & filter CC dinamis

- **Decision**: Dropdown jenis kendaraan mengikuti Open Design persis: `Sepeda Motor` (opsi CC: `<250cc`, `>250cc`) dan `Mobil Penumpang` (opsi CC: `<2400cc`, `>2400cc`). Fieldset CC tersembunyi sampai jenis dipilih; opsi dirender dinamis dari data (`TARIF[jenis].opsi`), bukan hardcoded di template. Skema CSV mendukung penambahan golongan lain (bus, truk, dsb.) tanpa perubahan kode.
- **Rationale**: FR-014 mengikat UI ke sumber Open Design; zero-assumption melarang menambah golongan yang tidak ada di desain. Struktur data-driven memenuhi FR-004 Opsi A sekaligus menyisakan jalur ekspansi.
- **Alternatives considered**: Daftar lengkap golongan PMK (bus, truk, derek…) di dropdown awal (ditunda: tidak ada di desain Open Design; aktifkan via CSV + satu entri mapping saat diminta).

## R8. Model perhitungan per jenis transaksi (FR-007)

- **Decision**: Pola strategy: interface `CalculationModel` dengan metode `hitungJatuhTempoSelanjutnya(jatuhTempo, periodeTerpakai)` — empat implementasi (`perpanjangan`, `balik-nama`, `mutasi-masuk`, `mutasi-keluar`) di `domain/models/`. Baseline rumus identik dengan prototype Open Design: `jatuh tempo + (n+1) tahun` (n = jumlah periode tunggakan terhitung). Besaran premi/denda TIDAK berubah antar transaksi (asumsi spec); diferensiasi rumus tanggal diverifikasi unit test per modul, dan penyimpangan rumus per transaksi (jika ketemu saat implementasi) cukup mengubah satu model tanpa menyentuh UI/store.
- **Rationale**: FR-007 clarified: "beberapa model penghitungan… masing-masing memiliki logic tanggal jatuh tempo selanjutnya sendiri… didefinisikan saat implementasi dan diverifikasi per modul". Strategy pattern memisahkan titik variasi itu secara eksplisit.
- **Alternatives considered**: Satu fungsi bercabang `switch` (ditolak: menumpuk titik variasi di satu tempat, sulit diuji per modul); konfigurasi data rumus (ditolak: YAGNI untuk 4 modul).

## R9. Tema Tailwind ↔ token Open Design

- **Decision** (mandat pengguna 2026-08-23): Seluruh styling memakai **Tailwind CSS v4**. Token Open Design (palet oklch light/dark, font Plus Jakarta Sans, radius 2xl/3xl/full, shadow card/pop, animasi reveal) dipetakan 1:1 ke blok `@theme` di `src/style.css`; dark mode via class `html.dark` (custom variant). Dilarang CSS kustom di luar utilitas Tailwind, kecuali keyframes `rise` dan `color-mix` yang tak dapat diekspresikan sebagai utility murni.
- **Rationale**: Mandat eksplisit pengguna + kesesuaian alami: prototype Open Design memang ditulis dengan utilitas Tailwind, sehingga pemetaan token bersifat transkripsi langsung, bukan re-desain (FR-014 aman).
- **Alternatives considered**: CSS variables polos tanpa Tailwind (ditolak: melanggar mandat pengguna); library komponen (daisyUI dst.) (ditolak: konstitusi V melarang framework UI tambahan).

## R10. Semantika tanggal & batas keterlambatan

- **Decision**: Selisih hari = selisih kalender UTC (hindari DST/locale drift): `hariAktual = floor((hariIni − jatuhTempo)/86400000)`. Aturan batas: `hariEfektif = clamp(hariAktual, −30, 1825)` (1826 pada rentang lintas tahun kabisat — cap "5 tahun" diuji dengan kedua nilai); `tahunPenuh = max(0, floor(hariEfektif/365))` → jumlah periode tunggakan k=1..min(tahunPenuh,4) + premi berjalan (maks 5 periode total). Status: belum-jatuh-tempo (negatif), tepat (0), terlambat (positif). Boundary wajib-uji: −40, −30, −1, 0, 1, 365, 366, 1825, 1826, 2190 (6 tahun → cap).
- **Rationale**: Mencerminkan acceptance scenario SC-002 & US3 (-30 hari floor, 0, ~730 aktual, 5 tahun cap) dan konstanta prototype Open Design (`MAKS_AWAL_HARI=30`, `MAX_TERLAMBAT_HARI=1825`, `DENDA_PER_TAHUN=0.25`).
- **Alternatives considered**: Library date (date-fns/dayjs) (ditolak: YAGNI — operasi cukup Date aritmetika UTC); pembagian 365.25 (ditolak: menyimpang dari prototype dan mempersulit boundary test).
