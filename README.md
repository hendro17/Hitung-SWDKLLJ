# Hitung SWDKLLJ — Kalkulator Jasa Raharja

Kalkulator estimasi tarif SWDKLLJ Jasa Raharja: premi berjalan, denda, dan tunggakan hingga 5 tahun. PWA offline-first, installable, tanpa backend.

> Tarif dasar mengacu pada **PMK No. 36/PMK.010/2008** · denda triwulan resmi (`triwulan = MIN(CEIL(bulan/3), 4)`, denda = `tarif_denda_maksimal × 0,25 × triwulan`). Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat & Jasa Raharja.

## Fitur

- **3-card flow**: Transaksi → Data Kendaraan → Hasil Perhitungan (progressive disclosure)
- **4 jenis transaksi**: Perpanjangan / Pengesahan, Balik Nama, Mutasi Masuk, Mutasi Keluar — aturan JTS (jatuh tempo selanjutnya) per modul, prorata Balik Nama/Mutasi Masuk, Berjalan = 0 untuk Mutasi Keluar
- **Tarif read-only dari CSV** (`src/data/tarif-swdkllj.csv`, 9 golongan) — fail-closed jika CSV rusak; angka tarif identik untuk semua transaksi
- **Perhitungan**: block Perpanjangan `belum-jatuh-tempo` (gap > 30 hari), cap tunggakan 4 tahun (maks 5 periode), anti-fraud selisih kalender absolut
- **Keringanan denda**: admin token (env, offline-capable) + super admin; periode keringanan lokal, staleness bound dinamis = tanggal akhir periode (Firebase Remote Config ditunda)
- **PWA**: `standalone`, 28 precache entries, network-first navigasi / cache-first aset, `lang: id`
- **Kualitas**: 143 unit test + 9 E2E Playwright (Chromium/Firefox/WebKit), typecheck bersih

## Tech Stack

- **Vue 3** Composition API `<script setup>` + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** — satu-satunya fondasi styling; token Open Design (`oklch` light/dark, Plus Jakarta Sans, `rounded-3xl/2xl/full`, `shadow-card/pop`) dipetakan sebagai `@theme`
- **Pinia** setup stores, **vue-router** (history mode), **reka-ui**, **vite-plugin-pwa** (Workbox `generateSW`)
- **Firebase JS SDK** (lazy, chunk terpisah) — distribusi cloud ditunda, kontrak cadence tetap terdokumentasi
- **Vitest** + `@vue/test-utils`, **Playwright** E2E

## Struktur Proyek

```
src/
  components/  # AppNavbar, StepIndicator, CardTransaksi, CardDataKendaraan, CardHasil, ...
  composables/ # useTheme, usePwaInstall, useTarif, useKeringanan
  stores/      # tarifStore, kalkulatorStore, adminStore, superAdminStore
  domain/      # types, csv-parser, periode, denda, hitung, keringanan, models/* (pure, Vue-free)
  data/tarif-swdkllj.csv
  services/    # adminService, adminTokenService, keringananService, firebase
  views/       # HomeView, AdminView
  router/
e2e/                    # Playwright smoke (wizard, manifest+SW, offline precache)
specs/001-hitung-swdkllj/  # spec, plan, research, business-logic, contracts, checklists
vercel.json             # rewrite SPA → /index.html
firestore.rules         # ownership + super bypass, list super-only
```

## Prasyarat

- Node.js ≥ 20, pnpm ≥ 10 (`packageManager: pnpm@10.15.0`)

## Quickstart

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm build && pnpm preview  # PWA preview di :4173 — uji offline & installability
pnpm test -- --run    # Vitest (143 test)
pnpm e2e              # Playwright, butuh preview server di :4173
pnpm typecheck        # vue-tsc --noEmit
```

## Tarif (PMK No. 36/PMK.010/2008, kartu dana Rp3.000 semua golongan)

| Golongan | Deskripsi | Pokok | Denda maks |
|---|---|---|---|
| A | Kendaraan Khusus (Ambulans, Damkar, dsb) | Rp 0 | Rp 0 |
| B | Alat Berat (Exavator, Crane, dsb) | Rp 20.000 | Rp 20.000 |
| C1 | Sepeda Motor Roda 2 / Roda 3 | Rp 32.000 | Rp 32.000 |
| C2 | Sepeda Motor Sport > 250cc | Rp 80.000 | Rp 80.000 |
| DP | Minibus, Jeep, Sedan, Pickup Ang. Barang | Rp 140.000 | Rp 100.000 |
| DU | Minibus Angkutan Umum s.d. 1600cc | Rp 70.000 | Rp 70.000 |
| EP | Bus dan Microbus Bukan Ang. Umum | Rp 150.000 | Rp 100.000 |
| EU | Bus/Microbus AU, Minibus AU > 1600cc | Rp 87.000 | Rp 87.000 |
| F | Truck / Ang. Barang > 2400cc | Rp 160.000 | Rp 100.000 |

## Deploy (Vercel)

1. Push ke GitHub, import repo di vercel.com (preset Vite otomatis: `pnpm build` → `dist`).
2. `vercel.json` sudah sediakan rewrite `/(.*)` → `/index.html` (wajib untuk history mode).
3. Isi Environment Variables (lihat `.env.example`, jangan commit `.env.local`):
   `VITE_FEATURE_ADMIN`, `VITE_FEATURE_SUPER_ADMIN`, `VITE_FIREBASE_API_KEY`,
   `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`,
   `VITE_SUPER_ADMIN_EMAILS`.
4. Verifikasi: refresh di route dalam, `manifest.webmanifest` + SW aktif.

## Keamanan

Lihat [SECURITY.md](SECURITY.md) untuk versi yang didukung dan cara melaporkan kerentanan. Dependabot version updates aktif (`.github/dependabot.yml`).

## Konstitusi

Lihat `.specify/memory/constitution.md` — 5 prinsip: Vue `<script setup>` only, Pinia setup stores, akurasi kalkulasi non-negotiable (test-first, data tarif terpusat), PWA offline-first, simplicity/UI Indonesia/YAGNI.

## Lisensi

Internal — Jasa Raharja calculator.
