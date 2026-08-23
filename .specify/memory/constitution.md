<!--
SYNC IMPACT REPORT
==================
Version change: (belum diratifikasi — scaffold kosong) → 1.0.0
Modified principles: tidak ada penggantian nama (adopsi awal, seluruh prinsip baru)
Added sections:
  - Core Principles (5 prinsip: Composition API First, Pinia State, Akurasi Perhitungan,
    PWA Offline-First, Kesederhanaan & UX)
  - Batasan Teknologi & Platform
  - Alur Kerja Pengembangan & Quality Gates
  - Governance
Removed sections: tidak ada
Follow-up TODOs: tidak ada placeholder yang ditunda.
Catatan inferensi: Vite diasumsikan sebagai build tool default (scaffolding resmi Vue);
dapat diamandemen jika stack build aktual berbeda.
-->

# Konstitusi Hitung SWDKLLJ Jasa Raharja

## Core Principles

### I. Vue 3 Composition API First

Aplikasi ini adalah Single Page Application (SPA) berbasis web. Seluruh kode
komponen BARU WAJIB menggunakan Vue 3 dengan Composition API (`<script setup>`).
Options API TIDAK BOLEH digunakan untuk kode baru. Logika yang dapat dipakai ulang
WAJIB diekstrak ke composable (`use*`) alih-alih diduplikasi antar komponen.
Rationale: satu gaya penulisan menjaga konsistensi, keterbacaan, dan kemudahan
onboarding; Composition API adalah arah resmi ekosistem Vue 3.

### II. Pinia sebagai Satu Sumber Kebenaran State

Seluruh state yang dibagikan lintas komponen/rute WAJIB dikelola melalui store
Pinia (gaya setup store). State lokal komponen hanya untuk UI efemeral
(misal visibilitas elemen). Dilarang membuat state global di luar Pinia atau
menyalin state store ke state lokal tanpa alasan terukur. Logika perhitungan
SWDKLLJ WAJIB hidup sebagai getter/action store yang murni dan dapat diuji
terpisah dari UI. Rationale: state tunggal mencegah divergensi data dan membuat
perhitungan mudah diverifikasi.

### III. Akurasi Perhitungan (NON-NEGOTIABLE)

Hasil perhitungan SWDKLLJ Jasa Raharja adalah keluaran finansial: kesalahan angka
TIDAK DAPAT ditoleransi. Setiap aturan tarif, golongan kendaraan, dan masa berlaku
WAJIB memiliki unit test yang ditulis lebih dulu (test-first) dan gagal sebelum
implementasi. Tabel tarif WAJIB disimpan sebagai data terpusat bersumber dari
regulasi resmi Jasa Raharja, bukan angka hardcode tersebar. Perubahan tarif tanpa
sumber rujukan resmi DILARANG. Rationale: aplikasi ini bernilai karena akurat;
test-first pada domain finansial adalah gerbang mutu minimum.

### IV. PWA Installable & Offline-First

Aplikasi WAJIB dapat dipasang seperti aplikasi mobile: manifest web lengkap
(nama `Hitung SWDKLLJ Jasa Raharja`, ikon, `display: standalone`). Fungsi inti
(kalkulator SWDKLLJ) WAJIB tetap berfungsi penuh saat offline melalui service
worker dengan strategi cache yang tepat (precache aset aplikasi; runtime cache
untuk aset sekunder). Pembaruan aset HARUS aman versi (tidak menyajikan campuran
cache lama/baru). Rationale: nilai jual utama adalah pemakaian seperti aplikasi
mobile di lapangan dengan jaringan tidak pasti.

### V. Kesederhanaan & UX Bahasa Indonesia

Mulai sederhana, terapkan YAGNI: tanpa backend/server kecuali ada kebutuhan nyata
yang terdokumentasi; tanpa dependency baru tanpa justifikasi tertulis di plan.
Antarmuka WAJIB berbahasa Indonesia, mobile-first, responsif, dan dapat diselesaikan
pengguna dalam maksimal 3 langkah dari membuka aplikasi hingga melihat hasil hitung
(pilih jenis/golongan kendaraan → isi masa berlaku → lihat hasil). Elemen formulir
WAJIB memiliki label eksplisit dan kontras memadai. Rationale: pengguna akhir adalah
masyarakat umum di loket Samsat; kejelasan mengalahkan kecanggihan.

## Batasan Teknologi & Platform

- Stack wajib: Vue 3 (Composition API), Pinia, dan tooling build standar ekosistem
  Vue (default: Vite) kecuali diamandemen melalui mekanisme Governance.
- Tanpa framework UI tambahan kecuali disetujui di fase plan dengan alasan terukur.
- Target platform: browser evergreen desktop dan mobile (Chrome, Edge, Firefox,
  Safari ≥ versi yang mendukung service worker dan Web App Manifest).
- Aplikasi TIDAK BOLEH bergantung pada server untuk fungsi perhitungan inti;
  seluruh logika tarif berjalan di sisi klien.
- Tidak mengumpulkan maupun mengirim data personal pengguna ke mana pun.

## Alur Kerja Pengembangan & Quality Gates

- Pengembangan fitur mengikuti alur Spec Kit: `/speckit.specify` →
  `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze` →
  `/speckit.implement`. Tidak ada implementasi langsung tanpa artefak spesifikasi.
- Quality gate per fitur: (1) unit test logika perhitungan lulus penuh,
  (2) smoke test komponen utama lulus, (3) build produksi sukses,
  (4) verifikasi manual mode offline dan instalabilitas PWA untuk perubahan
  terkait service worker/manifest.
- Code review WAJIB memverifikasi kepatuhan pada lima prinsip inti; pelanggaran
  memblokir merge.
- Utang teknis yang disengaja HARUS dicatat di plan beserta rencana pelunasannya.

## Governance

Konstitusi ini mengesampingkan semua praktik pengembangan lain dalam proyek ini.
Amendemen memerlukan: dokumentasi perubahan, peningkatan nomor versi semantik
(MAJOR = perubahan prinsip yang tidak kompatibel/penghapusan; MINOR = prinsip atau
bagian baru/perluasan materi; PATCH = klarifikasi dan perbaikan redaksi), serta
rencana migrasi bila ada dampak ke artefak spesifikasi yang sudah ada. Semua PR
dan review WAJIB memeriksa kepatuhan konstitusi; kompleksitas apa pun harus
dijustifikasi secara tertulis. Detail panduan runtime pengembangan mengacu pada
artefak Spesifikasi Kit di `.specify/` dan dokumen plan per fitur.

**Version**: 1.0.0 | **Ratified**: 2026-08-22 | **Last Amended**: 2026-08-22
