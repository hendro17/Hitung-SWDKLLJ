# Hitung SWDKLLJ — Kalkulator Jasa Raharja

Kalkulator estimasi tarif SWDKLLJ Jasa Raharja: premi berjalan, denda, dan tunggakan hingga 5 tahun. PWA offline-first, installable, tanpa backend.

> Tarif dasar mengacu pada **PMK No. 16/PMK.010/2017** · denda berjenjang 25%/50%/75%/100% dari pokok (maks Rp100.000). Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat & Jasa Raharja.

## Fitur

- **3-card flow**: Transaksi → Data Kendaraan → Hasil Perhitungan (progressive disclosure)
- **4 jenis transaksi**: Perpanjangan / Pengesahan, Balik Nama, Mutasi Masuk, Mutasi Keluar
- **Tarif read-only dari CSV** (40 baris, `kode_transaksi × jenis × fungsi × kategori CC`) — fail-closed jika CSV rusak
- **Perhitungan**: floor −30 hari, cap 5 tahun (1825/1826 hari), premi Berjalan + Tunggakan 1–4, denda berjenjang PMK 16/2017 (25%/50%/75%/100% dari pokok, maks Rp100.000)
- **Keringanan denda**: scaffolding admin (login online-only) — toggle `keringanan_aktif` nol-kan 100% denda global via Firebase Remote Config (lazy-load, `VITE_FEATURE_ADMIN`)
- **PWA**: `standalone`, precache shell, network-first navigations / cache-first assets, `lang: id`

## Tech Stack

- **Vue 3** Composition API `<script setup>` + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** — satu-satunya fondasi styling; token Open Design (`oklch` light/dark, Plus Jakarta Sans, `rounded-3xl/2xl/full`, `shadow-card/pop`) dipetakan sebagai `@theme` (FR-014)
- **Pinia** setup stores (logika kalkulasi pure/testable), **vue-router**, **vite-plugin-pwa** (Workbox `generateSW`)
- **Firebase JS SDK** (lazy) untuk admin scaffolding — tidak masuk bundle publik
- **Vitest** + `@vue/test-utils`

## Struktur Proyek

```
src/
  components/  # AppNavbar, StepIndicator, CardTransaksi, CardDataKendaraan, CardHasil, ...
  composables/ # useTheme, usePwaInstall, useTarif
  stores/      # tarifStore, kalkulatorStore, adminStore
  domain/      # types, csv-parser, selisih, hitung, models/* (pure, Vue-free)
  data/tarif-swdkllj.csv
  services/adminService.ts
  views/       # HomeView, AdminView
  router/
specs/001-hitung-swdkllj/  # spec, plan, research, data-model, contracts, quickstart
```

## Prasyarat

- Node.js ≥ 20, npm ≥ 10

## Quickstart

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview  # PWA preview di :4173 — uji offline & installability
npm test           # Vitest
```

Urutan TDD: `csv-parser → selisih → hitung → keringanan → models → component smoke`.

## Tarif (PMK 16/PMK.010/2017, termasuk kartu dana)

| Kategori | Premi |
|---|---|
| Motor 50–250cc | Rp 35.000 |
| Motor >250cc | Rp 83.000 |
| Mobil pribadi ≤2400cc | Rp 143.000 |
| Mobil AU ≤1600cc | Rp 73.000 |
| Mobil barang/truk >2400cc | Rp 163.000 |
| Bus non-AU | Rp 153.000 |
| Bus AU >1600cc | Rp 90.000 |
| Derek/dll | Rp 23.000 |
| Exempt (<50cc, ambulans, dll) | Rp 3.000 |

`denda_per_tahun = 0.25` (data-driven via CSV `sumber_rujukan`).

## Konstitusi

Lihat `.specify/memory/constitution.md` — 5 prinsip: Vue `<script setup>` only, Pinia setup stores, akurasi kalkulasi non-negotiable (test-first, data tarif terpusat), PWA offline-first, simplicity/UI Indonesia/YAGNI.

## Lisensi

Internal — Jasa Raharja calculator.
