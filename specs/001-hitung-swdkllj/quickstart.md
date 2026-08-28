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

Urutan TDD per modul: `tests/unit/csv-parser.spec.ts` (fail-closed [contracts/csv-tarif.md](./contracts/csv-tarif.md)) → `periode.spec.ts` (DataPeriode: gap_days/tunggakan [contracts/domain-api.md](./contracts/domain-api.md) §3) → `denda-prorata.spec.ts` (§4–§5, tanpa grace §5.3) → `hitung.spec.ts` (3 contoh terverifikasi business-logic §9 + SC-003) → `keringanan.spec.ts` (SC-006) → `models/*.spec.ts` (JTS per modul §6) → smoke komponen `tests/components/`.

## Skenario Validasi Manual (petakan ke acceptance spec.md)

1. **Alur inti US1**: buka app → hanya navbar+Card 1 terlihat → pilih "Perpanjangan / Pengesahan" → Lanjutkan → Card 2 muncul, Card 3 tidak → isi tanggal jatuh tempo (contoh telat ±2 tahun), pilih jenis kendaraan "Sepeda Motor Roda 2 / Roda 3" (dropdown deskripsi CSV; radio CC opsional muncul dgn prefill default_cc — memilih ">"250cc" meng-adjust golongan ke C2 via `konfirmasiGolongan`, business-logic §2.1 + keputusan pengguna 2026-08-28 sesi 2; tanpa menyentuh radio pun tombol Hitung tetap aktif) → Hitung Premi SWDKLLJ → Card 3: keterlambatan "{N} tahun, {M} hari", Pokok Berjalan 32.000 (C1), Denda Berjalan triwulan >0, Tunggakan sesuai periode (pokok+denda 32.000 pasang), Total = jumlah baris + kartu dana 3.000. Angka eksak terverifikasi utk 2024-05-26/2026-08-27 = 179.000 (unit test, business-logic §9.1).
2. **Validasi US1#4**: kosongkan salah satu field → tombol hitung disabled + hint muncul.
3. **Boundary US3 (SC-002)**: tanggal 40 hari ke depan tanpa tunggakan → pesan block "Premi Belum Jatuh Tempo / Masih Berlaku" (§6.1, hanya Perpanjangan); selisih gap_days 30 vs 31 mengubah tahun Berjalan/JTS (§6); telat >4 tahun → hanya 4 pasang tunggakan (cap MIN(total,4)) + Pokok Berjalan; rollover 365/366 hari lintas 29 Feb (unit test §4).
4. **Reset US2#3 / FR-009**: ubah transaksi saat Card 2 terbuka → form Card 2 kosong & Card 3 hilang; "Hitung Ulang" → kondisi awal; ulangi 5 siklus hitung-reset-hitung (SC-005) — hasil siklus ke-5 identik siklus ke-1.
5. **CSV gagal (FR-008)**: sementara ganti nama kolom header CSV → dev server → banner "Data tarif tidak tersedia — muat ulang atau perbarui aplikasi", tombol hitung disabled; kembalikan CSV → pulih.
6. **PWA offline (FR-010/SC-004)**: `npm run build && npm run preview` → buka via http://localhost:4173 → DevTools Application: manifest valid + SW terpasang → matikan jaringan (DevTools Offline) → reload → seluruh alur Card 1→3 tetap berfungsi. Ulangi minimal di Chrome + Safari (+ Firefox).
7. **Instalabilitas (konstitusi IV)**: Chrome desktop → ikon install di omnibox / tombol "Pasang App" muncul; pasang → jendela standalone dengan nama & ikon benar.
8. **Admin scaffolding (FR-011/FR-012, clarified 2026-08-26)** — hanya bila `VITE_FEATURE_ADMIN=true`: `/admin` terbuka; masukkan token salah (offline maupun online) → error, mode tak berubah; token benar (== `VITE_ADMIN_TOKEN`) → verifikasi sukses bahkan offline; keringanan aktif bila hari ini ∈ [tanggalMulai, tanggalAkhir] → hitung dengan tanggal terlambat → SEMUA denda Rp 0, pokok/tarif utuh; tanggal hari ini lewat tanggalAkhir → otomatis kembali normal tanpa koneksi (cache lokal); resetSession/logout → mode non-admin.

## Kriteria Selesai Fitur

- [ ] Seluruh unit/smoke test lulus (`npm run test -- --run`)
- [ ] `npm run build` sukses tanpa error TS
- [ ] Skenario manual 1–8 sesuai harapan
- [ ] Tidak ada angka tarif hardcode di kode (hanya dari CSV)
- [ ] UI mengikuti token/label Open Design ([contracts/ui-components.md](./contracts/ui-components.md))
