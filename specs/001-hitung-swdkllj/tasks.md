# Tasks: Hitung SWDKLLJ (Kalkulator Premi PWA)

**Input**: Design documents dari `/specs/001-hitung-swdkllj/`

**Prerequisites**: plan.md ✅ (extension 2026-09-01 merged), spec.md ✅, business-logic.md ✅ (sumber kebenaran angka & formula, delivered 2026-08-28), research.md ✅ (R5/R6/R7/R8/R10 superseded — ikut banner), data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: WAJIB — konstitusi III (Akurasi Perhitungan NON-NEGOTIABLE) mewajibkan test-first: test ditulis lebih dulu dan dibuat MERAH sebelum implementasi.

**Sumber kebenaran perhitungan**: `business-logic.md` §2–§13. Kontrak mesin: `contracts/domain-api.md`. Kontrak CSV: `contracts/csv-tarif.md`. Kontrak UI: `contracts/ui-components.md`. Kontrak admin: **SUPERSEDED** — `contracts/admin-service.md` (VITE_ADMIN_TOKEN + localStorage singleton) diganti `plan.md Extension 2026-09-01` (token `sk-*` SHA256 + Firestore Spark `admin_tokens/{hash}` + `keringanan/{id}` 8 bool + sidebar exclusive).

**⚠️ Open Validations (business-logic §13)** — JANGAN diasumsikan final; implementasi memakai asumsi terdokumentasi dengan marker `pending-validasi` di unit test:
1. §13.1 Case B Balik Nama/Mutasi Masuk: anniversary prorata (asumsi = `due_date_original − 1 tahun`)
2. §13.2 Mutasi Keluar: JTS saat `tunggakan_count == 0` (asumsi = `anchor_date`)
3. §13.3 Granularitas dropdown — **DITUTUP 2026-08-28 sesi 2**: dropdown jenis kendaraan = kolom `deskripsi` tabel tarif CSV (9 opsi); radio CC konfirmasi opsional, `default_cc` = acuan default radio

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Bisa paralel (file berbeda, tanpa dependensi ke task belum selesai)
- **[Story]**: US1/US2/US3/US4; Setup/Foundational/Polish tanpa label
- Setiap task menyebut path file eksak

## Path Conventions

Single project (SPA): `src/`, `tests/` di root repo — sesuai struktur "Source Code" plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inisialisasi proyek Vue 3 + Vite + TypeScript + Tailwind v4 + Pinia + vite-plugin-pwa

- [x] T001 Scaffold proyek sesuai plan.md `Source Code`: buat `package.json` (name `hitung-swdkllj`, scripts: `dev`, `build` = `vue-tsc -b && vite build`, `preview`, `test` = `vitest`, `typecheck` = `vue-tsc --noEmit`), `vite.config.ts` (plugin `@vitejs/plugin-vue`, `@tailwindcss/vite`, `vite-plugin-pwa` mode `generateSW` — precache semua aset build termasuk `src/data/tarif-swdkllj.csv`; runtime caching: navigasi same-origin network-first, aset same-origin cache-first; manifest name `Hitung SWDKLLJ Jasa Raharja`), `tsconfig.json` + `tsconfig.app.json` (strict), `src/main.ts` (createApp + router + pinia), `src/App.vue` (router-view)
- [x] T002 Install dependency: `npm i vue vue-router pinia` + `npm i -D vite @vitejs/plugin-vue typescript vue-tsc @tailwindcss/vite tailwindcss vite-plugin-pwa vitest @vue/test-utils jsdom` (tanpa dependency lain — research R1–R3; jangan tambah library date/uang)
- [x] T003 [P] Buat shell `index.html` PWA mengikuti Open Design (FR-014): meta viewport, meta `theme-color` (light `#0e6db8` / dark `#0b1c30` via `media`/script), link manifest dari vite-plugin-pwa, font `Plus Jakarta Sans`; `public/favicon.svg` + `public/robots.txt`; ikon brand `src/assets/brand/icon-192.svg` + `icon-512.svg` (transkrip dari Open Design via MCP)
- [x] T004 [P] Buat `src/style.css`: `@import "tailwindcss"` + custom variant dark (`html.dark`) + blok `@theme` memetakan 1:1 token Open Design (bg/surface/fg/muted/border/brand/brand-strong/brand-soft/cyan/cyan-ink/danger → utilitas `bg-app`, `bg-surface`, `text-ink`, `text-mu`, `border-line`, `text-brand`, `bg-brand-strong`, `bg-brand-soft`, `text-warn`) + font, radius `rounded-3xl/2xl/full`, shadow `card`/`pop`, shell max-width 30rem, `tabular-nums`, keyframes `rise` utk `.reveal` (mati saat `prefers-reduced-motion`) — persis contracts/ui-components.md §1
- [x] T005 [P] Ambil & transkrip desain UI lengkap proyek `Hitung SWDKLLJ` dari Open Design via MCP → `specs/001-hitung-swdkllj/design-transcript.md` (FR-014): layout home, bentuk visual AppNavbar/StepIndicator/CardTransaksi/CardDataKendaraan/CardHasil/chip, spacing, copy teks eksak, state light/dark, TERMASUK alur radio CC dinamis + prefill default_cc & tombol Lanjutkan/Hitung (keputusan pengguna 2026-08-28 sesi 2: "UI di Open Design sudah saya approved — tinggal mengganti value"). Dokumen ini referensi WAJIB semua task komponen (T029–T039); bila beda dengan contracts/ui-components.md, Open Design menang & selisih dicatat di dokumen
- [x] T006 [P] Buat `.env.example`: `VITE_FEATURE_ADMIN=false`, `VITE_ADMIN_TOKEN=` (tanpa nilai rahasia apa pun; Firebase dilewati/ditunda keputusan pengguna 2026-08-28 sesi 2 — jangan tambah key Firebase) — **SUPERSEDED 2026-09-01**: akan di-rework di T054 menjadi `VITE_FEATURE_ADMIN`, `VITE_FEATURE_SUPER_ADMIN`, `VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID`, `VITE_SUPER_ADMIN_EMAILS`; `VITE_ADMIN_TOKEN` dihapus
- [x] T007 Buat `src/router/index.ts`: route `/` → `views/HomeView.vue`; route `/admin` → `views/AdminView.vue` dengan guard: bila `import.meta.env.VITE_FEATURE_ADMIN !== 'true'` redirect ke `/` (implementasi guard final di T054 — extension)

**Checkpoint**: `npm run dev` menampilkan halaman kosong tanpa error; `npm run test` berjalan (0 test / pass).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mesin perhitungan domain murni + data tarif + fail-closed parser. Semua user story bergantung pada fase ini.

**⚠️ CRITICAL**: Test ditulis DULU dan MERAH (konstitusi III). Tidak ada user story dimulai sebelum fase ini hijau.

### Tests (tulis dulu, pastikan MERAH)

- [x] T008 [P] Tulis `tests/unit/csv-parser.spec.ts` — fail-closed 7 grup persis contracts/csv-tarif.md "Uji Parser Wajib": happy path 9 baris valid; header salah/urut kolom beda → reject; golongan duplikat/hilang/tak dikenal → reject; uang negatif/desimal/kosong/bukan integer → reject; konstanta <0 / >1 → reject (non-A wajib >0); file kosong & hanya header → reject; CRLF diterima, BOM ditolak
- [x] T009 [P] Tulis `tests/unit/periode.spec.ts` — DataPeriode (domain-api §3): `anchorDate = SET_YEAR(due, currentYear)`; `gapDays` signed selisih kalender absolut presisi kabisat; `totalOverdueYears`; `tunggakanCount = min(totalOverdueYears, 4)`; `berjalanYear` (gapDays>30 → currentYear, else currentYear+1); slot Tunggakan N = `currentYear − N`; boundary gap_days 30 vs 31; rollover 365/366 hari lintas 29 Feb (SC-002)
- [x] T010 [P] Tulis `tests/unit/denda.spec.ts` — `roundMoney(x) = CEIL(x/100)*100` (§2); `hitungDendaBerjalan` triwulan TANPA grace: 1 hari lewat → triwulan 1, `bulanDenda = fullMonths + (sisa>0?1:0)`, `triwulan = min(ceil(bulan/3),4)`, denda = `dendaMaksimal × 0.25 × triwulan`, contoh C1 93 hari → 16.000; rollover >365/366 hari → slot tunggakan baru; `hitungPokokProrata` grace ≤15 turun / >15 naik, contoh 5 bulan → 16.400 & 3 bulan → 11.000 (business-logic §5.3–§5.4); plus `konfirmasiGolongan(golongan, pilihanCc)` (domain-api §1): pilihan null/family tanpa radio → golongan apa adanya, motor bawah↔C1 atas↔C2, minibus-au bawah↔DU atas↔EU, non-umum bawah↔DP atas↔F, tiap default_cc mereproduksi golongannya sendiri
- [x] T011 [P] Tulis `tests/unit/hitung.spec.ts` — orkestrator (domain-api §6): 3 contoh terverifikasi EKSAK (PERPANJANGAN C1 2024-05-26/2026-08-27 → total 179.000 & JTS 26 Mei 2027; BALIK_NAMA Case A → 190.000; MUTASI_KELUAR → 131.000 & JTS 26 Mei 2026); Golongan A total selalu kartu_dana 3.000; denda tunggakan = `tarif_denda_maksimal` flat; pokok = `tarif_pokok`; block `belum-jatuh-tempo` pesan eksak hanya utk PERPANJANGAN (tunggakanCount=0 && gapDays>30); `lunas` Case B (due > hariIni+1 tahun, total 0); keringanan aktif → semua denda 0, pokok/tarif utuh; sampling 4 transaksi × 9 golongan (SC-003); case §13.1 & §13.2 diberi marker `pending-validasi` (mis. `it.skip`/describe bernama eksplisit) dengan asumsi terdokumentasi
- [x] T012 [P] Tulis `tests/unit/models/jts.spec.ts` — JTS per modul (domain-api §6): PERPANJANGAN gap>30 → anchorDate / else `SET_YEAR(due, y+1)`; BALIK_NAMA Case A → hariIni+1 tahun; MUTASI_MASUK identik BALIK_NAMA; MUTASI_KELUAR → anchorDate (asumsi §13.2 marker `pending-validasi`); lompatan 29 Feb pada `SET_YEAR`

### Implementation (buat test hijau)

- [x] T013 Buat `src/data/tarif-swdkllj.csv` — isi PERSIS kontrak csv-tarif.md (header 8 kolom `golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan`; 9 baris dengan deskripsi & default_cc baru: A=2499/0/0, B=2499/20000/20000, C1=150/32000/32000, C2=255/80000/80000, DP=1500/140000/100000, DU=1500/70000/70000, EP=3000/150000/100000, EU=3000/87000/87000, F=2499/160000/100000; semua `kartu_dana` 3000; non-A konstanta 0.25 & 0.083333333; field berkoma dalam petik ganda RFC4180; UTF-8, LF, tanpa BOM). Ini SATU-SATUNYA sumber angka tarif (FR-008/FR-013)
- [x] T014 Buat `src/domain/types.ts` — semua type data-model.md §1–§2: `KodeTransaksi`, `Golongan`, `FamilyCc`, `StatusHasil`, `Transaksi`, `KendaraanInput`, `TarifGolongan`, `DataPeriode`, `HasilPerhitungan`, `PeriodeKeringanan`, `InputHitung` (domain-api §1); tanpa import Vue/Pinia
- [x] T015 Buat `src/domain/periode.ts` — fungsi pembangun `DataPeriode` (domain-api §3) dgn `hariIni` sebagai parameter injeksi (deterministik utk test); aritmetika Date lokal tanpa library; buat T009 hijau
- [x] T016 Buat `src/domain/denda.ts` — `roundMoney`, `hitungDendaBerjalan(titikAwal, hariIni, tarifDendaMaksimal)`, `hitungPokokProrata(titikAwal, titikAkhir, tarifPokok, kartuDana)`, plus helper `konfirmasiGolongan(golongan, pilihanCc)` adjustment radio CC per family (domain-api §1–§2, §4–§5); buat T010 hijau
- [x] T017 Buat `src/domain/models/perpanjangan.ts` — interface `CalculationModel` (`hitungJatuhTempoSelanjutnya` + keputusan status) & implementasi PERPANJANGAN (gap>30 → anchor, else SET_YEAR(due,y+1)); buat bagian terkait T012 hijau (research R8: strategy pattern DIPERTAHANKAN)
- [x] T018 [P] Buat `src/domain/models/balik-nama.ts` — BALIK_NAMA: Case A (gapDays≤30) seperti Perpanjangan + prorata + JTS hariIni+1tahun; Case B: due>hariIni+1tahun → `lunas`; else prorata dari anniversary (asumsi §13.1 `due − 1 tahun`, komentar `pending-validasi`)
- [x] T019 [P] Buat `src/domain/models/mutasi-masuk.ts` — delegasi 100% logika `balik-nama.ts` (business-logic §9.4)
- [x] T020 [P] Buat `src/domain/models/mutasi-keluar.ts` — Pokok/Denda Berjalan=0 selalu, tanpa prorata, hanya tunggakan, JTS=anchorDate (asumsi §13.2 utk tunggakanCount=0, komentar `pending-validasi`)
- [x] T021 Buat `src/domain/hitung.ts` — `hitungPerhitungan(input, tarif, hariIni, keringananAktif)` orkestrator (domain-api §6): pilih model per transaksi, rakit `HasilPerhitungan` (semua field integer rupiah), format string keterlambatan `"{tunggakanCount} tahun, {hariDendaBerjalan} hari"` & JTS `dd MMMM yyyy` (Intl id-ID), `applyKeringanan()` (semua denda → 0, set `keringananDiterapkan`); buat T011 hijau — **akan diperluas selective 8 bool di T049/T053**
- [x] T022 Buat `src/domain/csv-parser.ts` — parse + validasi ketat fail-closed persis contracts/csv-tarif.md (header eksak, 9 baris lengkap & unik, uang integer ≥0, konstanta [0,1] non-A >0, tolak BOM, toleransi CRLF); buat T008 hijau
- [x] T023 Buat `src/stores/tarifStore.ts` — Pinia setup store: state `records: TarifGolongan[]`, `tariffAvailable: boolean`, aksi `loadRecords`/`setFailed`
- [x] T024 Buat `src/composables/useTarif.ts` — fetch URL aset CSV → `parseCsvTarif` → `tarifStore`; segala kegagalan (fetch/parse/validasi) → `tariffAvailable=false` (tanpa fallback apa pun, FR-008)
- [x] T025 Jalankan `npm run test -- --run` — seluruh test Phase 2 HIJAU (csv-parser, periode, denda, hitung incl. 3 contoh eksak, jts models)

**Checkpoint**: mesin perhitungan lengkap & teruji; `npm run test -- --run` hijau penuh. User story implementation dapat mulai.

---

## Phase 3: User Story 1 - Hitung Premi SWDKLLJ Lengkap (Priority: P1) 🎯 MVP

**Goal**: Pengguna memilih transaksi → mengisi tanggal, golongan, CC → mendapat hasil perhitungan SWDKLLJ lengkap dengan tarif resmi.

**Independent Test**: quickstart.md skenario 1–2: alur Card 1→2→3 menghasilkan rincian benar persis business-logic §8 (verifikasi angka oleh unit test Phase 2).

### Tests for User Story 1 (tulis dulu, pastikan MERAH)

- [x] T026 [P] [US1] Tulis `tests/components/card-transaksi.spec.ts` — select berisi 4 opsi KodeTransaksi label persis ui-components §3; "Lanjutkan" disabled sebelum pilihan; memilih → store `step` maju
- [x] T027 [P] [US1] Tulis `tests/components/card-data.spec.ts` — dropdown jenis kendaraan dirender dari tarifStore (9 opsi = kolom `deskripsi`); radio CC dinamis per family (motor <250/>250, minibus-au ≤1600/>1600, non-umum ≤2400/>2400; A/B/EP/EU(bus) tanpa radio) dgn prefill dari `default_cc`; memilih radio adjust golongan via `konfirmasiGolongan`; radio OPSIONAL — tombol "Hitung Premi SWDKLLJ" tetap enabled tanpa interaksi radio; disabled hanya saat tanggal invalid/golongan belum dipilih/`tariffAvailable=false` (+ pesan eksak "Data tarif tidak tersedia — muat ulang atau perbarui aplikasi")
- [x] T028 [P] [US1] Tulis `tests/components/card-hasil.spec.ts` — status `rincian`: semua baris §8 muncul (keterlambatan, pokok/denda berjalan, pasangan tunggakan 1–4, pokok prorata hanya Balik Nama/Mutasi Masuk, kartu dana 3.000, total, JTS format `dd MMMM yyyy`, Intl id-ID 0 desimal); chip ringkasan transaksi·golongan·CC

### Implementation for User Story 1

- [x] T029 [P] [US1] Buat `src/composables/useTheme.ts` — terang/gelap class `html.dark`, persist localStorage, sinkron meta theme-color (ui-components §1)
- [x] T030 [P] [US1] Buat `src/composables/usePwaInstall.ts` — tangkap `beforeinstallprompt`, expose `canInstall`/`promptInstall`; deteksi iOS non-standalone utk tips
- [x] T031 [P] [US1] Buat `src/components/BaseCard.vue` — wrapper `rounded-3xl` + shadow `card` + animasi `.reveal(rise)` + hidden prop
- [x] T032 [US1] Buat `src/components/AppNavbar.vue` (pakai T029/T030): logo gradien perisai+centang OD, judul **"Hitung SWDKLLJ"** sub **"Kalkulator Jasa Raharja"**, tombol **"Pasang App"** (`#btn-install` hidden sampai bisa), tombol tema aria-label "Ganti tema terang/gelap", tips iOS `#hint-ios` (ui-components §3) — **akan ditambah burger trigger di T051** (Extension sidebar rev2)
- [x] T033 [P] [US1] Buat `src/components/StepIndicator.vue` — ol 3 langkah (1 Transaksi, 2 Data Kendaraan, 3 Hasil), state active/done (✓)
- [x] T034 [US1] Buat `src/stores/kalkulatorStore.ts` — Pinia setup store state machine data-model.md §3: `step`, `input` (transaksi, KendaraanInput), `hasil`, `tariffAvailable` guard; aksi `pilihTransaksi`, `lanjutkan`, `hitung` (panggil `hitungPerhitungan` dgn `hariIni=new Date()`), `resetPenuh`, `hitungUlang` — **akan di-wiring keringanan selective di T053**
- [x] T035 [US1] Buat `src/components/CardTransaksi.vue` — h2/sub/label/select/tombol **"Lanjutkan"** persis ui-components §3 + `data-testid="card-transaksi"`
- [x] T036 [US1] Buat `src/components/CardDataKendaraan.vue` — date picker, select jenis kendaraan (kolom `deskripsi` CSV) dari tariffStore, radio CC dinamis opsional + prefill `default_cc` + adjust via `konfirmasiGolongan` (alur/label persis Open Design — T005), tombol **"Hitung Premi SWDKLLJ"** + hint "Lengkapi tanggal jatuh tempo dan jenis kendaraan.", tombol-link "Ubah" → reset penuh (FR-003), `data-testid="card-data"`
- [x] T037 [P] [US1] Buat `src/components/ChipRingkasan.vue` — strip chip label transaksi · golongan · CC
- [x] T038 [US1] Buat `src/components/CardHasil.vue` — seluruh baris hasil (dl) + kartu dana + Total + panel JTS + tombol outline **"Hitung Ulang"** + `aria-live="polite"` + `data-testid="card-hasil"` — **akan ditambah badge `keringanan:aktif` + teks `keringanan` per-slot di T053**
- [x] T039 [US1] Buat `src/views/HomeView.vue` — rangkai: skip-link, AppNavbar, StepIndicator, `main#mulai` berisi 3 card (Card 2/3 hidden sesuai step), footer teks eksak ui-components §2; muat tarif via `useTarif` saat mount
- [x] T040 [US1] Jalankan `npm run test -- --run` — test US1 hijau; verifikasi manual quickstart skenario 1–2

**Checkpoint**: User Story 1 berfungsi penuh & teruji independen (MVP siap demo).

---

## Phase 4: User Story 2 - Progressive Disclosure Tiga Card (Priority: P1)

**Goal**: Alur tiga card muncul bertahap, validasi menghambat tombol, reset penuh saat transaksi berubah.

**Independent Test**: quickstart.md skenario 2 & 4: Card 3 tak pernah muncul prematur; ubah transaksi saat Card 2 terbuka → form kosong & Card 3 hilang; 5 siklus hitung-reset identik (SC-005).

### Tests for User Story 2 (tulis dulu, pastikan MERAH)

- [x] T041 [P] [US2] Tulis `tests/components/wizard.spec.ts` — transisi visibilitas card (awal hanya Card 1; setelah Lanjutkan Card 2; setelah Hitung Card 3); ubah transaksi pada step≥2 → seluruh input & hasil ter-reset (FR-003 Option A); "Hitung Ulang" → kembali kondisi awal tanpa sisa state; StepIndicator done ✓ mengikuti step; guard tombol Hitung (field kurang / tarif tak tersedia)

### Implementation for User Story 2

- [x] T042 [US2] Lengkapi aksi reset & guard di `src/stores/kalkulatorStore.ts` (dari T034): reset penuh pada `ubahTransaksi`, transisi step ter-guard, `hitungUlang` membersihkan hasil+input Card 2; buat T041 hijau
- [x] T043 [US2] Sinkronkan animasi reveal & state done `src/components/StepIndicator.vue` + HomeView (class `.reveal` saat card muncul; `prefers-reduced-motion` aman)
- [x] T044 [US2] Jalankan `npm run test -- --run` — test US2 hijau; verifikasi manual quickstart skenario 4

**Checkpoint**: US1 + US2 berfungsi independen.

---

## Phase 5: User Story 3 - Tampilan Keterlambatan & Batas Periode Penagihan (Priority: P2)

**Goal**: Keterlambatan ditampilkan "{N} tahun, {M} hari", penagihan dibatasi 5 periode (Berjalan + maks 4 Tunggakan), block saat premi masih berlaku.

**Independent Test**: quickstart.md skenario 3: tanggal 40 hari ke depan tanpa tunggakan → pesan block "Premi Belum Jatuh Tempo / Masih Berlaku"; telat >4 tahun → hanya 4 pasang tunggakan; boundary gap 30/31 benar.

### Tests for User Story 3 (tulis dulu, pastikan MERAH)

- [x] T045 [P] [US3] Tulis `tests/components/card-hasil-batas.spec.ts` — status `belum-jatuh-tempo` → pesan tunggal eksak (hanya PERPANJANGAN); status `lunas` → pesan total 0; string keterlambatan eksak utk 0/1/2/4 tahun + cap (mis. "4 tahun, X hari" utk telat >4 tahun); pasangan tunggakan k=5 tidak pernah dirender; blok message TIDAK muncul utk BALIK_NAMA/MUTASI_*

### Implementation for User Story 3

- [x] T046 [US3] Perluas `src/components/CardHasil.vue` (dari T038): render status `belum-jatuh-tempo` & `lunas` sebagai pesan tunggal menggantikan baris; format keterlambatan + `text-warn`; buat T045 hijau
- [x] T047 [US3] Jalankan `npm run test -- --run` seluruh suite (incl. boundary SC-002 di periode/hitung) hijau; verifikasi manual quickstart skenario 3

**Checkpoint**: US1–US3 independen berfungsi.

---

## Phase 6: User Story 4 - Admin 2-Tier + Keringanan Selective + Sidebar Exclusive (Priority: P3) — REVISI 2026-09-01 (Extension)

**Goal**: Super admin (Firebase Auth) generate token `sk-*` SHA256 (hash doc `admin_tokens/{hash}`) + periode valid dinamis, list & revoke, copy raw anytime. Admin (pemegang `sk-*`) login via hash lookup + session persist (`admin_session_hash/until/label`) → setup keringanan koleksi `keringanan/{id}` (label + periode + 8 bool pokok/denda 1–4) broadcast global via Firestore Spark + IndexedDB persistence + localStorage fallback. Public user pilih keringanan via **sidebar burger drawer** (`AppSidebar.vue`) — switches exclusive (satu ON, lain OFF), expired auto-hide, default OFF/normal (opt-in). `applyKeringananSelective` murni per-slot (true → 0 / `keringanan`).

**Independent Test**: plan.md Extension + quickstart.md skenario 8 revised: super admin login → generate `sk-*` label → copy anytime → admin login (hash verify, periode valid) bahkan offline (session cache) → set keringanan selective (e.g. pokok1+denda1) → sidebar switch ON → CardHasil badge `keringanan:aktif` + slot 0/`keringanan` → >1 provisi → hanya satu ON → expired → hilang → OFF semua → normal; revoke super-only; offline tanpa fetch selama periode aktif.

**SUPERSEDED**: `contracts/admin-service.md` (VITE_ADMIN_TOKEN singleton localStorage) diganti Architecture Extension § plan.md. `VITE_ADMIN_TOKEN` env dihapus. Firebase SDK `firebase@^10` (app/auth/firestore) dynamic-import (lazy) agar bundle `/` tetap ringan.

### Tests for User Story 4 (tulis dulu, pastikan MERAH)

- [ ] T048 [P] [US4] Tulis `tests/unit/keringanan.spec.ts` + `tests/unit/keringanan-selective.spec.ts` + `tests/unit/sidebar-keringanan.spec.ts` — SC-006 selective: `isKeringananAktif(doc, today)` inclusive [mulai,akhir] jam lokal (batas tepat mulai/akhir, H+1 akhir → false); `applyKeringananSelective(hasil, doc)` 8 bool pokok/denda 1–4 → 0 + teks `keringanan`, pokok/tarif/kartu_dana tak berubah; multi-provisi tidak crash; badge condition `selectedKeringanan != null && aktif`; sidebar: exclusive switch (satu ON semua OFF), expired (`today > akhir`) hide + auto-reset `activeKeringananId→null`, default OFF → hitung normal (opt-in), `visibleKeringananList` filter
- [ ] T048b [P] [US4] Tulis `tests/unit/admin-token.spec.ts` — `sha256Hex(raw)` hex 64, `generateToken()` → `sk-`+UUIDv4, copy raw anytime (field `tokenRaw` read super-only guard), status `active|revoked|expired` derive `today > validUntil`, `verifyAdminToken(hash)` valid hanya `active && today ∈ [validFrom,validUntil]` inclusive, revoke hanya super admin

### Implementation for User Story 4

- [ ] T049 [US4] Buat `src/services/firebase.ts` (init, `getDb()`, `getAuth()`, `sha256Hex(raw)` SubtleCrypto, `enablePersistence` IndexedDB) + `src/services/adminTokenService.ts` (generate `sk-*`, `hashToken`, `verifyAdminToken`, list/revoke super-only, `copyRaw`) + `src/services/keringananService.ts` (CRUD `keringanan/{id}` label+periode+8 bool, ownership `createdBy` hash, `onSnapshot` collection) + `src/domain/keringanan.ts` (`isKeringananAktif`, `applyKeringananSelective` — 8 bool per-slot, murni testable)
- [ ] T050 [US4] Buat `src/stores/superAdminStore.ts` (auth state `onAuthStateChanged`, login/logout, token list, revoke, `isSuperAdmin` allowlist `VITE_SUPER_ADMIN_EMAILS`) + `src/views/SuperAdminView.vue` (login form Firebase Auth + generator `label` required + `token` auto `sk-*` editable + tombol Copy raw anytime + list hash+label+periode+status+ revoke button super-only + override keringanan semua tenant)
- [ ] T051 [US4] Rework `src/views/AdminView.vue` + `src/stores/adminStore.ts` + `src/components/AppSidebar.vue` + `src/components/AppNavbar.vue` burger — verify token: `hash=sha256Hex(input.trim())` → `getDoc(admin_tokens/hash)` → valid `active && today∈[validFrom,validUntil]` → persist `admin_session_hash/until/label` (offline cache sampai validUntil); expired derive → reject + lazy update; `resetSession` hapus key; form `label` required + `mulai/akhir` + **8 toggle** `pokokTunggakan1..dendaTunggakan4`; ownership: admin hanya doc miliknya (`createdBy==hash`), super admin semua; sidebar: trigger burger `aria-label="Buka menu"` `aria-expanded` `aria-controls="app-sidebar"` → drawer `w-72 bg-surface border-r rounded-r-3xl` + overlay `bg-black/40` + trap focus + Esc/overlay/click close + `prefers-reduced-motion`; menu statis Setup Admin→/super-admin, Setup Keringanan→/admin; switches `Keringanan {label}` `role="switch"` `aria-checked` Space/Enter, exclusive `activeKeringananId` localStorage
- [ ] T052 [US4] Buat `src/services/adminService.ts` reimpl + `src/composables/useKeringanan.ts` — `observeKeringanan(cb)` via `onSnapshot(collection(db,'keringanan'))` + `enableIndexedDbPersistence` cache + fallback `localStorage` key `keringanan_list` (JSON array) untuk boot offline; cadence app-start + event `online` + refetch bila `>12h`; sync ke `adminStore.keringananList`/`visibleKeringananList` (filter `today<=akhir`); `setPeriodeKeringanan` via `keringananService`
- [ ] T053 [US4] Wiring `src/stores/kalkulatorStore.ts` ← `adminStore.activeKeringananId` exclusive + `src/components/CardHasil.vue` — `kalkulatorStore` computed `selectedKeringanan` + `keringananAktifDoc`; aksi `hitung` → `applyKeringananSelective(hasil, doc)` bila `activeKeringananId!=null && isKeringananAktif`; CardHasil badge `keringanan:aktif` (chip) + slot `true` tampil `Rp 0 (keringanan)` atau chip `keringanan` (feedback #1/#4); sidebar toggle logic satu aktif, OFF→null normal, expired auto-reset `null` via watch
- [ ] T054 [US4] Finalkan router guards + Firestore rules + config: `src/router/index.ts` `/admin` guard `VITE_FEATURE_ADMIN==='true'` **plus** session hash valid, `/super-admin` guard `VITE_FEATURE_SUPER_ADMIN==='true'` **plus** `auth.currentUser != null && email ∈ allowlist`; `firestore.rules` (per-doc ownership `createdBy == updatedBy`, super admin bypass, `tokenRaw` super-only via `admin_tokens_raw/{hash}` atau guard `isSuperAdmin`, `allow get: if true` hash lookup, `allow list: if isSuperAdmin` anti-enumerasi); `firebase.json`/`firestore.indexes.json`; `.env.example` update `VITE_FEATURE_ADMIN`, `VITE_FEATURE_SUPER_ADMIN`, `VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID`, `VITE_SUPER_ADMIN_EMAILS` (hapus `VITE_ADMIN_TOKEN`)
- [ ] T055 [US4] E2E manual US4 + Sidebar rev2 #1–#6: super admin generate (label+`sk-*`) → copy anytime → admin login offline/online → set keringanan selective (mis. pokok1+denda1) → sidebar switch ON/OFF → CardHasil badge+slot → >1 provisi → hanya satu ON → expired → hilang + auto-reset → OFF semua → normal; revoke super-only; offline toggle tanpa fetch; dokumentasikan hasil

**Checkpoint**: Semua user story (US1–US4) independen berfungsi — US4 2-tier + selective + sidebar exclusive verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validasi PWA/offline, instalabilitas, build bersih, gerbang open-validations + Firestore rules + Spark quota + a11y, laporan pra-commit

- [ ] T056 [P] Validasi PWA & offline (FR-010/SC-004): `npm run build && npm run preview` → http://localhost:4173 → DevTools: manifest valid + SW terpasang → Offline → reload → alur Card 1→3 berfungsi penuh (+ sidebar eksklusif tetap ON tanpa fetch); ulang di Chrome + Safari + Firefox (dokumentasikan hasil di PR/commit message)
- [ ] T057 [P] Validasi instalabilitas (konstitusi IV): Chrome desktop ikon install muncul → jendela standalone nama & ikon benar (quickstart skenario 7)
- [ ] T058 [P] Audit gerbang open-validations + Firestore rules + Spark quota: pastikan semua unit test §13.1/§13.2 marker `pending-validasi` + komentar asumsi (§13.3 DITUTUP); anotasi `specs/001-hitung-swdkllj/checklists/requirements-quality.md` (CHK027/CHK028, CHK013/CHK015 tertutup) JANGAN centang [x]; audit `firestore.rules` (ownership `createdBy==updatedBy` super bypass, `tokenRaw` super-only, `allow list: if isSuperAdmin` anti-enumerasi, `expired` derive); estimasi Spark quota (<2k reads/day untuk 1k DAU: 1 collection read `keringanan` per open + 1 read token per login, cache >12h) — aman; koleksi ~N docs = 1 query
- [ ] T059 Verifikasi kualitas build + a11y: `npm run typecheck` bersih, `npm run test -- --run` hijau penuh, `npm run build` sukses tanpa error; tidak ada angka tarif hardcode di `src/` selain isi CSV (FR-008/FR-013) — grep audit; sidebar a11y: drawer `role="dialog"` `aria-modal`, trap focus, Esc, click overlay close, burger `aria-expanded`, `prefers-reduced-motion` tanpa animasi
- [ ] T060 Jalankan seluruh skenario manual `specs/001-hitung-swdkllj/quickstart.md` 1–8 sebagai gate akhir (checklist "Kriteria Selesai Fitur") + verifikasi expired hide E2E (hari > akhir → switch hilang + auto-reset normal)
- [ ] T061 Pra-commit: jalankan GitNexus `detect_changes()` (AGENTS.md) — pastikan hanya simbol/file yang diharapkan terdampak; JANGAN commit tanpa instruksi pengguna

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Tanpa dependensi — mulai segera
- **Foundational (Phase 2)**: Butuh Setup selesai — MEMBLOKIR semua user story
- **US1 (Phase 3)**: Butuh Foundational
- **US2 (Phase 4)**: Butuh T034/T039 dari US1 (menyempurnakan store/home yang sama) — tipis, kerjakan setelah US1
- **US3 (Phase 5)**: Butuh T038 dari US1 (CardHasil); domain boundary sudah di Phase 2
- **US4 (Phase 6 revised)**: Butuh Foundational + T034 kalkulatorStore; detail: T049 firebase/services sebelum T050/T051 (stores/views), T052 `useKeringanan` sebelum T053 wiring, T054 guards/rules setelah T050/T051
- **Polish (Phase 7)**: Setelah seluruh user story selesai

### User Story Dependencies

- **US1 (P1)**: MVP — mandiri setelah Foundational
- **US2 (P1)**: bergantung implementasi awal US1 (store/view), tetap teruji independen
- **US3 (P2)**: bergantung CardHasil US1
- **US4 (P3 revised)**: bergantung kalkulatorStore US1 utk wiring selective (`activeKeringananId` exclusive) + sidebar global di `App.vue`

### Within Each User Story

- Test ditulis DULU dan dibuat MERAH (konstitusi III)
- Models/domain → stores → services → components → views → verifikasi manual

### Parallel Opportunities

- T003–T006 (shell/tema/transkrip desain Open Design/env) paralel
- T008–T012 (semua test Foundational) paralel
- T018–T020 (model balik-nama/mutasi-masuk/mutasi-keluar) paralel setelah T017
- T026–T028 (test komponen US1) paralel; T029–T031 & T033 & T037 paralel
- T045 (test US3) bisa mulai segera setelah Foundational
- T048 + T048b (test US4 selective + token) paralel dengan US2/US3 setelah Foundational
- T049 (services+domain) → T050+T051 paralel; T052 setelah T049; T053 setelah T051+T052; T056–T058 paralel

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch 5 test files sekaligus (tulis dulu, merah):
Task: "tests/unit/csv-parser.spec.ts"     (T008)
Task: "tests/unit/periode.spec.ts"        (T009)
Task: "tests/unit/denda.spec.ts"           (T010)
Task: "tests/unit/hitung.spec.ts"          (T011)
Task: "tests/unit/models/jts.spec.ts"      (T012)

# Lalu model transaksi paralel setelah T017:
Task: "src/domain/models/balik-nama.ts"   (T018)
Task: "src/domain/models/mutasi-masuk.ts" (T019)
Task: "src/domain/models/mutasi-keluar.ts"(T020)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Selesaikan Phase 1: Setup
2. Selesaikan Phase 2: Foundational (test-first domain — CRITICAL)
3. Selesaikan Phase 3: US1
4. **STOP & VALIDATE**: quickstart skenario 1–2 + test hijau → MVP siap demo

### Incremental Delivery

1. Setup + Foundational → mesin teruji
2. + US1 → validasi → demo (MVP)
3. + US2 (progressive disclosure/reset) → demo
4. + US3 (tampilan keterlambatan/batas/block) → demo
5. + US4 revised (admin 2-tier + selective keringanan + sidebar exclusive, flag-gated) → demo
6. Polish: offline/PWA 3 browser, build bersih, audit open-validations + rules + quota + a11y, detect_changes

### Parallel Team Strategy

Setelah Foundational: US1 wajib lebih dulu (membuat CardHasil/kalkulatorStore yang dipakai US2/US3); US4 revised (admin scaffolding, file terpisah) bisa paralel penuh oleh developer lain sejak Foundational kecuali T053 wiring.

---

## Notes

- [P] = file berbeda, tanpa dependensi ke task belum selesai
- Test MERAH dulu (konstitusi III) — verifikasi `npm run test -- --run` gagal sebelum implementasi dimulai
- Angka tarif HANYA dari `src/data/tarif-swdkllj.csv`; angka lain (konstanta denda/prorata) dari kolom CSV — jangan hardcode di logika
- Open validations §13: marker `pending-validasi` wajib, jangan dianggap final
- Commit per task/grup logis HANYA bila pengguna meminta (kebijakan sesi saat ini: jangan commit tanpa instruksi)
- **SYNC 2026-09-02**: Phase 6 T048–T055 lama (VITE_ADMIN_TOKEN singleton) SUPERSEDED oleh plan.md Extension 2026-09-01 (Firebase Spark token `sk-*` SHA256 + koleksi `keringanan/{id}` 8 bool + sidebar exclusive + SuperAdmin). Mapping: T048→T048+T048b selective, T049→firebase/services, T050→SuperAdmin, T051→Admin+Sidebar+Navbar burger, T052→adminService+useKeringanan, T053→wiring selective+CardHasil badge, T054→guards+rules+.env, T055 E2E rev2. Polish T055→T056, T056→T057, T057→T058 (+rules/quota), T058→T059 (+a11y), T059→T060 (+expired hide), T060→T061
