# Quickstart: Validasi Hitung SWDKLLJ

Panduan menjalankan & memvalidasi fitur end-to-end. Detail rumus/skema: [contracts/](./contracts/) · entitas: [data-model.md](./data-model.md).

## Prasyarat

- Node.js ≥ 20, npm ≥ 10
- Browser evergreen (Chrome/Edge/Firefox/Safari)

## Setup & Jalankan

```bash
npm install
npm run dev            # http://localhost:5173
```

Build produksi + preview (wajib lulus sebelum selesai):

```bash
npm run build && npm run preview
```

## Test-First (konstitusi III — tulis test dulu, merah sebelum implementasi)

```bash
npm run test           # Vitest watch
npm run test -- --run  # sekali jalan
```

Urutan TDD per modul: `tests/unit/csv-parser.spec.ts` → `selisih.spec.ts` (matriks boundary di [contracts/domain-api.md](./contracts/domain-api.md) §1) → `hitung.spec.ts` (SC-003) → `keringanan.spec.ts` (SC-006) → `models/*.spec.ts` → smoke komponen `tests/components/`.

## Skenario Validasi Manual (petakan ke acceptance spec.md)

1. **Alur inti US1**: buka app → hanya navbar+Card 1 terlihat → pilih "Perpanjangan / Pengesahan" → Lanjutkan → Card 2 muncul, Card 3 tidak → isi tanggal `2026-07-13`, jenis "Sepeda Motor", fungsi Pribadi, CC "<250cc" (fieldset CC baru muncul setelah jenis dipilih) → Hitung Premi SWDKLLJ → Card 3: Terlambat 40 hari, Premi Berjalan 35.000, Denda Berjalan >0, Tunggakan sesuai periode, Total = jumlah baris.
2. **Validasi US1#4**: kosongkan salah satu field → tombol hitung disabled + hint muncul.
3. **Floor/cap US3**: tanggal 40 hari ke depan → "Belum jatuh tempo…"; hari ini → "Tepat jatuh tempo hari ini" & Denda Berjalan "Rp 0"; 2018-08-22 → "Terlambat … (maks 5 tahun)" dan hanya 4 pasang tunggakan; 2024-08-22 → nilai aktual ~730 hari.
4. **Reset US2#3 / FR-009**: ubah transaksi saat Card 2 terbuka → form Card 2 kosong & Card 3 hilang; "Hitung Ulang" → kondisi awal; ulangi 5 siklus hitung-reset-hitung (SC-005) — hasil siklus ke-5 identik siklus ke-1.
5. **CSV gagal (FR-008)**: sementara ganti nama kolom header CSV → dev server → banner "Data tarif tidak tersedia — muat ulang atau perbarui aplikasi", tombol hitung disabled; kembalikan CSV → pulih.
6. **PWA offline (FR-010/SC-004)**: `npm run build && npm run preview` → buka via http://localhost:4173 → DevTools Application: manifest valid + SW terpasang → matikan jaringan (DevTools Offline) → reload → seluruh alur Card 1→3 tetap berfungsi. Ulangi minimal di Chrome + Safari (+ Firefox).
7. **Instalabilitas (konstitusi IV)**: Chrome desktop → ikon install di omnibox / tombol "Pasang App" muncul; pasang → jendela standalone dengan nama & ikon benar.
8. **Admin scaffolding (FR-011/FR-012)** — hanya bila `VITE_FEATURE_ADMIN=true`: `/admin` terbuka; matikan jaringan → login diblokir pesan "Login admin memerlukan koneksi internet"; online login salah → error, mode tak berubah; login benar → toggle keringanan ON → hitung dengan tanggal terlambat → SEMUA denda Rp 0, premi utuh; logout/OFF → denda normal.

## Kriteria Selesai Fitur

- [ ] Seluruh unit/smoke test lulus (`npm run test -- --run`)
- [ ] `npm run build` sukses tanpa error TS
- [ ] Skenario manual 1–8 sesuai harapan
- [ ] Tidak ada angka tarif hardcode di kode (hanya dari CSV)
- [ ] UI mengikuti token/label Open Design ([contracts/ui-components.md](./contracts/ui-components.md))
