# Implementation Plan: Hitung SWDKLLJ

**Branch**: `001-hitung-swdkllj` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hitung-swdkllj/spec.md`

## Summary

Kalkulator premi SWDKLLJ Jasa Raharja sebagai PWA Vue 3 yang dapat dipasang dan bekerja penuh secara offline. Alur UI tiga card (jenis transaksi → data kendaraan → hasil) mengikuti sumber kebenaran visual dari Open Design project `Hitung SWDKLLJ` via MCP, diimplementasikan dengan Tailwind CSS (wajib — ditetapkan pengguna 2026-08-23). Logika perhitungan finansial (selisih keterlambatan floor −30 hari / cap 5 tahun, premi berjalan + tunggakan 1–4, denda 25%/periode, tanggal jatuh tempo selanjutnya) hidup sebagai fungsi domain murni yang diuji test-first berdasarkan tabel tarif resmi PMK No. 16/PMK.010/2017 yang disajikan sebagai CSV read-only. Scaffolding admin (login online-only + mode keringanan denda 100% broadcast global) disiapkan sebagai rute terproteksi feature-flag.

## Technical Context

**Language/Version**: TypeScript 5.x pada Vue 3.5+ (Composition API `<script setup>` — wajib konstitusi)

**Primary Dependencies**:
- Vite 7 (build tool default ekosistem Vue)
- **Tailwind CSS v4** (styling wajib — ditetapkan pengguna; token Open Design dipetakan ke tema Tailwind)
- Pinia (setup store) — satu sumber kebenaran state
- Vue Router 4 (rute utama + rute admin terproteksi)
- vite-plugin-pwa (Workbox) untuk manifest + service worker
- Vitest + @vue/test-utils (unit & smoke test)
- Firebase JS SDK (lazy-loaded, hanya untuk scaffolding admin/keringanan — lihat research R6)

**Storage**: Read-only murni untuk tarif — `tarif-swdkllj.csv` di-bundle bersama aplikasi dan diprecache service worker (penyimpanan lokal klien, tanpa operasi write/update). `localStorage` hanya untuk preferensi tema, cache status keringanan terakhir, dan sesi admin. Tidak ada database tulis.

**Testing**: Vitest (unit logika domain test-first + komponen smoke)

**Target Platform**: Browser evergreen desktop & mobile (Chrome, Edge, Firefox, Safari ≥ versi pendukung Service Worker + Web App Manifest); installable PWA

**Project Type**: Single Page Application (PWA installable), tanpa backend untuk fungsi inti

**Performance Goals**: Transisi card & hasil hitung < 100 ms pada mobile kelas menengah; LHS PWA "installable" lulus; total bundle JS awal < 200 kB gzip

**Constraints**: Fungsional inti 100% offline; tanpa pengumpulan data personal; akurasi finansial non-negotiable (test-first, tarif bersumber regulasi resmi, bukan hardcode tersebar); UI seluruhnya bahasa Indonesia; alur ≤ 3 langkah

**Scale/Scope**: 1 halaman utama (navbar + step indicator + 3 card) + 1 rute admin tersembunyi (feature flag off di rilis awal); ±12 komponen; 1 file CSV tarif; ±60 kasus uji batas perhitungan

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinsip | Status | Catatan |
|---|---|---|
| I. Vue 3 Composition API First | ✅ PASS | Seluruh komponen baru `<script setup>`; logika reusable → composable `useTheme`, `usePwaInstall`, `useTarif`. Options API dilarang. |
| II. Pinia Satu Sumber Kebenaran | ✅ PASS | 3 store setup-style: `tarifStore`, `kalkulatorStore` (state machine card + input), `adminStore`. Perhitungan = action/getter murni yang memanggil modul `domain/` dan dapat diuji terpisah dari UI. |
| III. Akurasi Perhitungan (NON-NEGOTIABLE) | ✅ PASS | Unit test ditulis lebih dulu untuk semua aturan tarif/batas (matriks boundary di quickstart.md). Tarif terpusat di `src/data/tarif-swdkllj.csv` bersumber PMK No. 16/PMK.010/2017; parser memvalidasi skema; gagal muat → blokir Hitung (FR-008). Tidak ada angka hardcode tersebar. |
| IV. PWA Installable & Offline-First | ✅ PASS | Manifest lengkap (nama `Hitung SWDKLLJ Jasa Raharja` per konstitusi; label tampilan lain mengikuti Open Design), `display: standalone`, ikon dari Open Design. Precache aset + runtime caching mengikuti strategi prototype Open Design (network-first navigasi, cache-first aset, SWR sekunder). Pembaruan aman versi lewat precache manifest Workbox. |
| V. Kesederhanaan & UX Bahasa Indonesia | ✅ PASS | Tanpa framework komponen UI tambahan; Tailwind CSS adalah utility styling (bukan library komponen) dan WAJIB sesuai penetapan pengguna 2026-08-23 — sekaligus sejalan FR-014 karena desain Open Design memang berbasis Tailwind. Alur 3 langkah, label Indonesia eksak dari Open Design. |

**Batasan Teknologi & Platform**:

| Batasan | Status | Catatan |
|---|---|---|
| Stack Vue 3 + Pinia + Vite | ✅ PASS | Sesuai. |
| Tanpa backend kecuali kebutuhan nyata terdokumentasi | ✅ PASS | Kebutuhan backend minimal TERDOKUMENTASI: login admin online-only + broadcast global status keringanan (clarified spec 2026-08-22, FR-011/FR-012). Implementasi dibungkus interface `AdminService`; vendor final Firebase Auth + Remote Config (research R6); tidak menyentuh fungsi hitung offline. |
| Tanpa dependency baru tanpa justifikasi tertulis | ✅ PASS | Semua dependency di atas dijustifikasi di research.md (R1–R8). |
| Data tidak keluar dari perangkat | ✅ PASS | Input kendaraan & hasil tidak pernah dikirim ke mana pun; satu-satunya trafik jaringan: unduh shell/tarif (precache) dan scaffolding admin saat online. |

**Re-check pasca-desain (Phase 1)**: ✅ Tetap PASS — desain kontrak (`contracts/`) tidak menambah pelanggaran; keringanan diterapkan sebagai fungsi murni pasca-hitung sehingga jalur offline tak tersentuh.

## Project Structure

### Documentation (this feature)

```text
specs/001-hitung-swdkllj/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── csv-tarif.md     #   Skema & aturan validasi CSV tarif
│   ├── domain-api.md    #   Kontrak API mesin perhitungan (TypeScript)
│   ├── ui-components.md #   Kontrak komponen/card + token Tailwind ↔ Open Design
│   └── admin-service.md #   Kontrak scaffolding auth + keringanan
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
hitung-swdkllj/
├── index.html                     # Shell HTML + meta PWA (mengikuti Open Design)
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── assets/brand/              # Ikon & logo dari Open Design (icon-192/512.svg)
│   ├── components/
│   │   ├── AppNavbar.vue          # Logo + nama app + Pasang App + toggle tema
│   │   ├── StepIndicator.vue      # ol langkah 1-2-3 (done → ✓)
│   │   ├── CardTransaksi.vue      # Card 1: select transaksi + Lanjutkan
│   │   ├── CardDataKendaraan.vue  # Card 2: tanggal, jenis, fungsi, CC dinamis + Hitung
│   │   ├── CardHasil.vue          # Card 3: baris 1-7 + Total + Hitung Ulang
│   │   ├── ChipRingkasan.vue      # Strip chip ringkasan Card 3
│   │   └── BaseCard.vue           # Wrapper kartu (rounded-3xl + shadow.card + reveal)
│   ├── composables/
│   │   ├── useTheme.ts            # Terang/gelap + persist localStorage + theme-color meta
│   │   ├── usePwaInstall.ts       # beforeinstallprompt → tombol "Pasang App" + tips iOS
│   │   └── useTarif.ts            # Muat/parse CSV → tarifStore, status gagal-muat
│   ├── stores/
│   │   ├── tarifStore.ts          # Daftar TarifRecord + tariffAvailable flag
│   │   ├── kalkulatorStore.ts     # State machine card, input, hasil; aksi reset penuh
│   │   └── adminStore.ts          # isAuthenticated, isKeringananActive (scaffolding)
│   ├── domain/                    # FUNGSI MURNI — tanpa import Vue/Pinia (dapat diuji datar)
│   │   ├── types.ts               # Semua type entri di data-model.md
│   │   ├── csv-parser.ts          # Parse + validasi ketat CSV tarif
│   │   ├── selisih.ts             # hitungSelisihKeterlambatan (floor/cap/boundary)
│   │   ├── models/                # CalculationModel per jenis transaksi (FR-007)
│   │   │   ├── perpanjangan.ts    #   baseline rumus jatuh tempo selanjutnya
│   │   │   ├── balik-nama.ts
│   │   │   ├── mutasi-masuk.ts
│   │   │   └── mutasi-keluar.ts
│   │   └── hitung.ts              # hitungPerhitungan() orkestrator + applyKeringanan()
│   ├── data/
│   │   └── tarif-swdkllj.csv      # SATU-SATUNYA sumber angka tarif (PMK 16/PMK.010/2017)
│   ├── services/
│   │   └── adminService.ts        # Interface + implementasi Firebase (lazy import)
│   ├── views/
│   │   ├── HomeView.vue           # Navbar + steps + 3 card (alur inti)
│   │   └── AdminView.vue          # Login + toggle keringanan (rute terproteksi, flag)
│   ├── router/index.ts            # '/' publik, '/admin' guard by VITE_FEATURE_ADMIN
│   ├── main.ts
│   └── style.css                  # @import tailwindcss + @theme token Open Design
├── tests/
│   ├── unit/
│   │   ├── selisih.spec.ts        # Matriks boundary SC-002
│   │   ├── hitung.spec.ts         # SC-003 kombinasi tarif × transaksi
│   │   ├── csv-parser.spec.ts     # Validitas/rusak/kosong → error
│   │   ├── keringanan.spec.ts     # SC-006 denda→0 on/off
│   │   └── models/*.spec.ts       # Rumus jatuh tempo selanjutnya per modul
│   └── components/                # Smoke: visibilitas card, validasi, reset (US1-US2)
├── e2e/                           # (opsional, Playwright) alur end-to-end offline
├── index.html / vite.config.ts / tailwind config via CSS @theme / tsconfig.json / package.json
└── .env.example                   # VITE_FEATURE_ADMIN, kredensial firebase (tanpa nilai rahasia)
```

**Structure Decision**: Opsi tunggal SPA (konstitusi V: tanpa backend kecuali terdokumentasi). Folder `domain/` sengaja bebas dari Vue agar perhitungan finansial dapat diuji murni (prinsip II & III). Struktur komponen memetakan 1:1 struktur DOM Open Design (`card-transaksi`, `card-data`, `card-hasil`) demi kesetiaan FR-014.

## Complexity Tracking

> Tidak ada pelanggaran konstitusi. Justifikasi dependency & keputusan arsitektur ada di [research.md](./research.md) (R1–R8); kompleksitas tambahan yang disengaja: interface `AdminService` + lazy-load SDK (utang teknis scaffolding FR-011, pelunasan saat fitur admin diaktifkan).
