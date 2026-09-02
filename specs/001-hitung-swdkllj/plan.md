# Implementation Plan: Hitung SWDKLLJ

**Branch**: `001-hitung-swdkllj` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hitung-swdkllj/spec.md`

## Summary

Kalkulator premi SWDKLLJ Jasa Raharja sebagai PWA Vue 3 yang dapat dipasang dan bekerja penuh secara offline. Alur UI tiga card (jenis transaksi → data kendaraan → hasil) mengikuti sumber kebenaran visual dari Open Design project `Hitung SWDKLLJ` via MCP, diimplementasikan dengan Tailwind CSS (wajib — ditetapkan pengguna 2026-08-23). Logika perhitungan finansial (gap_days kalender absolut + block gap>30 tanpa tunggakan, pokok/denda berjalan + tunggakan 1–4 cap MIN(total,4), denda triwulan 25% tarif-denda-maksimal tanpa grace, prorata balik nama/mutasi masuk, tanggal jatuh tempo selanjutnya per modul) hidup sebagai fungsi domain murni yang diuji test-first berdasarkan tabel 9 golongan PMK No. 36/PMK.010/2008 (terkonfirmasi database internal Hero — business-logic.md, delivered 2026-08-28) yang disajikan sebagai CSV read-only. Scaffolding admin: 2-tier (super admin Firebase Auth generate token `sk-*` SHA256; admin token-valid setup keringanan selektif). Keringanan broadcast global via Firestore Spark, di-cache offline (IndexedDB + Pinia localStorage mirror). Sidebar burger → drawer: menu Setup Admin / Setup Keringanan + exclusive switch keringanan per provisi (admin setup ≠ auto-aktif; user opt-in; expired auto-hide).

## Technical Context

**Language/Version**: TypeScript 5.x pada Vue 3.5+ (Composition API `<script setup>` — wajib konstitusi)

**Primary Dependencies**:
- Vite 7 (build tool default ekosistem Vue)
- **Tailwind CSS v4** (styling wajib — ditetapkan pengguna; token Open Design dipetakan ke tema Tailwind)
- Pinia (setup store) — satu sumber kebenaran state
- Vue Router 4 (rute utama + rute admin terproteksi)
- vite-plugin-pwa (Workbox) untuk manifest + service worker
- Vitest + @vue/test-utils (unit & smoke test)
- **Firebase JS SDK** `firebase@^10` (app, auth, firestore) — **DIHIDUPKAN 2026-09-01** (menggantikan keputusan ditunda 2026-08-28 sesi 2): Firestore Spark untuk token admin (`sk-*`, SHA256) + koleksi keringanan broadcast. Lazy dynamic-import agar bundle `/` offline tetap ringan. Lihat Extension § di bawah.

**CI/Static Analysis**: GitHub Actions `.github/workflows/build.yml` — SonarQube scan (`sonar-project.properties`, projectKey `hendro17_Hitung-SWDKLLJ`) dengan Quality Gate enforcement aktif (job gagal jika Quality Gate merah); trigger push `main` + pull_request (ditambahkan 2026-08-25).

**Storage**: Read-only murni untuk tarif — `tarif-swdkllj.csv` di-bundle bersama aplikasi dan diprecache service worker (penyimpanan lokal klien, tanpa operasi write/update). `localStorage` untuk preferensi tema, mirror Pinia (`activeKeringananId`, `keringanan_list`, `admin_session_*`). DB: **Firebase Firestore Spark** (baca keringanan + admin_tokens) + `enableIndexedDbPersistence` cache IndexedDB. Tarif tetap CSV read-only precache.

**Testing**: Vitest (unit logika domain test-first + komponen smoke)

**Target Platform**: Browser evergreen desktop & mobile (Chrome, Edge, Firefox, Safari ≥ versi pendukung Service Worker + Web App Manifest); installable PWA

**Project Type**: Single Page Application (PWA installable), tanpa backend untuk fungsi inti

**Performance Goals**: Transisi card & hasil hitung < 100 ms pada mobile kelas menengah; Lighthouse PWA "installable" lulus; total bundle JS awal < 200 kB gzip

**Constraints**: Fungsional inti 100% offline; tanpa pengumpulan data personal; akurasi finansial non-negotiable (test-first, tarif bersumber regulasi resmi, bukan hardcode tersebar); UI seluruhnya bahasa Indonesia; alur ≤ 3 langkah

**Scale/Scope**: 1 halaman utama (navbar + step indicator + 3 card) + 1 rute admin tersembunyi (feature flag off di rilis awal); ±12 komponen; 1 file CSV tarif; ±60 kasus uji batas perhitungan

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinsip | Status | Catatan |
|---|---|---|
| I. Vue 3 Composition API First | ✅ PASS | Seluruh komponen baru `<script setup>`; logika reusable → composable `useTheme`, `usePwaInstall`, `useTarif`. Options API dilarang. |
| II. Pinia Satu Sumber Kebenaran | ✅ PASS | 3 store setup-style: `tarifStore`, `kalkulatorStore` (state machine card + input), `adminStore`. Perhitungan = action/getter murni yang memanggil modul `domain/` dan dapat diuji terpisah dari UI. |
| III. Akurasi Perhitungan (NON-NEGOTIABLE) | ✅ PASS | Unit test ditulis lebih dulu untuk semua aturan tarif/batas (3 contoh terverifikasi business-logic §9 + wajib-uji domain-api §7). Tarif terpusat di `src/data/tarif-swdkllj.csv` bersumber PMK No. 36/PMK.010/2008 (business-logic.md); parser memvalidasi skema fail-closed; gagal muat → blokir Hitung (FR-008). Tidak ada angka hardcode tersebar. 3 open validation (§13) wajib ditandai pending-validasi, bukan diasumsikan final. |
| IV. PWA Installable & Offline-First | ✅ PASS | Manifest lengkap (nama `Hitung SWDKLLJ Jasa Raharja` per konstitusi; label tampilan lain mengikuti Open Design), `display: standalone`, ikon dari Open Design. Precache aset + runtime caching mengikuti strategi prototype Open Design (network-first navigasi, cache-first aset, SWR sekunder). Pembaruan aman versi lewat precache manifest Workbox. |
| V. Kesederhanaan & UX Bahasa Indonesia | ✅ PASS | Tanpa framework komponen UI tambahan; Tailwind CSS adalah utility styling (bukan library komponen) dan WAJIB sesuai penetapan pengguna 2026-08-23 — sekaligus sejalan FR-014 karena desain Open Design memang berbasis Tailwind. Alur 3 langkah, label Indonesia eksak dari Open Design. |

**Batasan Teknologi & Platform**:

| Batasan | Status | Catatan |
|---|---|---|
| Stack Vue 3 + Pinia + Vite | ✅ PASS | Sesuai. |
| Tanpa backend kecuali kebutuhan nyata terdokumentasi | ✅ PASS | **Saluran distribusi keringanan global AKTIF 2026-09-01** (menggantikan keputusan ditunda 2026-08-28 sesi 2): Firebase Firestore Spark — token admin `sk-*` disimpan hash SHA256 (doc `admin_tokens/{hash}`), keringanan broadcast koleksi `keringanan/{id}`. Verifikasi admin via lookup hash (bukan `VITE_ADMIN_TOKEN` — env dihapus). Kalkulator hitung tetap offline; Firestore hanya supply periode (lihat Extension §). |
| Tanpa dependency baru tanpa justifikasi tertulis | ✅ PASS | Semua dependency di atas dijustifikasi di research.md (R1–R8). |
| Data tidak keluar dari perangkat | ✅ PASS | Input kendaraan & hasil tidak pernah dikirim ke mana pun; satu-satunya trafik jaringan: unduh shell/tarif (precache) dan scaffolding admin saat online. |

**Re-check pasca-desain (Phase 1)**: ✅ Tetap PASS — desain kontrak (`contracts/`) tidak menambah pelanggaran; keringanan diterapkan sebagai fungsi murni pasca-hitung sehingga jalur offline tak tersentuh.

## Project Structure

### Documentation (this feature)

```text
specs/001-hitung-swdkllj/
├── plan.md              # This file (/speckit.plan command output)
├── business-logic.md    # Spesifikasi tarif & bisnis proses (delivered 2026-08-28; SUMBER KEBENARAN angka tarif & formula — menggantikan research R5/R10)
├── research.md          # Phase 0 output (/speckit.plan command) — R5/R6/R7/R8/R10 punya banner superseded 2026-08-26/28
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
│   │   ├── AppNavbar.vue          # Logo + burger (sidebar trigger) + Pasang App + toggle tema
│   │   ├── AppSidebar.vue          # Drawer global: menu Setup Admin/Keringanan + exclusive switch keringanan (expired hide, opt-in)
│   │   ├── StepIndicator.vue      # ol langkah 1-2-3 (done → ✓)
│   │   ├── CardTransaksi.vue      # Card 1: select transaksi + Lanjutkan
│   │   ├── CardDataKendaraan.vue  # Card 2: tanggal, dropdown jenis (deskripsi CSV), radio CC opsional konfirmasiGolongan + Hitung
│   │   ├── CardHasil.vue          # Card 3: baris hasil business-logic §8 + kartu dana + Total + block/lunas + Hitung Ulang
│   │   ├── ChipRingkasan.vue      # Strip chip ringkasan Card 3
│   │   └── BaseCard.vue           # Wrapper kartu (rounded-3xl + shadow.card + reveal)
│   ├── composables/
│   │   ├── useTheme.ts            # Terang/gelap + persist localStorage + theme-color meta
│   │   ├── usePwaInstall.ts       # beforeinstallprompt → tombol "Pasang App" + tips iOS
│   │   └── useTarif.ts            # Muat/parse CSV → tarifStore, status gagal-muat
│   ├── stores/
│   │   ├── tarifStore.ts          # Daftar TarifRecord + tariffAvailable flag
│   │   ├── kalkulatorStore.ts     # State machine card, input, hasil; aksi reset penuh
│   │   ├── adminStore.ts          # session hash/until/label, keringananList, visibleKeringananList, activeKeringananId (exclusive)
│   │   └── superAdminStore.ts       # auth state, login/logout, token list, revoke
│   ├── domain/                    # FUNGSI MURNI — tanpa import Vue/Pinia (dapat diuji datar)
│   │   ├── types.ts               # Semua type entri di data-model.md §1–§2
│   │   ├── csv-parser.ts          # Parse + validasi ketat CSV tarif (fail-closed, contracts/csv-tarif.md)
│   │   ├── periode.ts             # DataPeriode: anchorDate/gapDays/tunggakanCount/berjalanYear (domain-api §3)
│   │   ├── denda.ts               # roundMoney + hitungDendaBerjalan triwulan tanpa grace + hitungPokokProrata (§2, §4–§5)
│   │   ├── models/                # CalculationModel JTS per modul transaksi (FR-007, domain-api §6)
│   │   │   ├── perpanjangan.ts    #   gap>30 → anchorDate, else SET_YEAR(due,y+1)
│   │   │   ├── balik-nama.ts      #   Case A → hariIni+1tahun; Case B lunas/prorata (asumsi §13.1)
│   │   │   ├── mutasi-masuk.ts    #   identik balik-nama 100%
│   │   │   └── mutasi-keluar.ts   #   JTS = anchorDate selalu (asumsi §13.2)
│   │   └── hitung.ts              # hitungPerhitungan() orkestrator per modul + applyKeringanan()
│   ├── data/
│   │   └── tarif-swdkllj.csv      # SATU-SATUNYA sumber angka tarif (PMK 36/PMK.010/2008, 9 golongan)
│   ├── services/
│   │   ├── firebase.ts            # init, getDb(), getAuth(), sha256Hex(raw), enablePersistence
│   │   ├── adminTokenService.ts     # generate sk-*, hashToken, verifyAdminToken, list/revoke (super admin)
│   │   ├── keringananService.ts     # CRUD keringanan/{id} (label+periode+8 bool), ownership, onSnapshot collection
│   │   └── adminService.ts          # interface + reimpl onSnapshot + localStorage fallback + apply selective
│   ├── views/
│   │   ├── HomeView.vue           # Navbar + steps + 3 card (alur inti)
│   │   ├── AdminView.vue          # Login token sk-* + form keringanan (label+periode+8 toggles) — hanya doc miliknya
│   │   └── SuperAdminView.vue     # Firebase Auth + generate/list/revoke token + copy raw + override semua keringanan
│   ├── router/index.ts            # '/' publik, '/admin' guard by VITE_FEATURE_ADMIN+session, '/super-admin' guard by Auth
│   ├── main.ts
│   └── style.css                  # @import tailwindcss + @theme token Open Design
├── tests/
│   ├── unit/
│   │   ├── periode.spec.ts        # gap_days/tunggakan/boundary SC-002 (gap 30/31, cap 4)
│   │   ├── denda.spec.ts          # triwulan tanpa grace, rollover 365/366, roundMoney, prorata grace 15
│   │   ├── hitung.spec.ts         # 3 contoh terverifikasi eksak + sampling 4 transaksi × 9 golongan (SC-003)
│   │   ├── csv-parser.spec.ts     # Fail-closed 7 grup (contracts/csv-tarif.md)
│   │   ├── keringanan.spec.ts     # SC-006 denda→0 saat periode aktif; normal bila lewat tanggalAkhir
│   │   ├── keringanan-selective.spec.ts # 8 bool pokok/denda 1-4 → 0 / 'keringanan'
│   │   ├── admin-token.spec.ts     # sha256Hex, generate sk-*, status active/revoked/expired
│   │   └── models/*.spec.ts       # JTS per modul (domain-api §6, incl. marker pending-validasi §13.1/§13.2)
│   └── components/                # Smoke: visibilitas card, validasi, reset (US1-US2)
├── e2e/                           # (opsional, Playwright) alur end-to-end offline
├── index.html / vite.config.ts / tailwind config via CSS @theme / tsconfig.json / package.json
└── .env.example                   # VITE_FEATURE_ADMIN, VITE_FEATURE_SUPER_ADMIN, VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID, VITE_SUPER_ADMIN_EMAILS
```

**Structure Decision** (diperbarui 2026-09-01): Opsi tunggal SPA (konstitusi V: tanpa backend kecuali terdokumentasi — Firestore adalah BaaS read-through, bukan server custom). Folder `domain/` sengaja bebas dari Vue agar perhitungan finansial dapat diuji murni (prinsip II & III). Struktur komponen memetakan 1:1 struktur DOM Open Design (`card-transaksi`, `card-data`, `card-hasil`) demi kesetiaan FR-014.

## Complexity Tracking

> Tidak ada pelanggaran konstitusi. Justifikasi dependency & keputusan arsitektur ada di [research.md](./research.md) (R1–R8); kompleksitas tambahan yang disengaja: interface `AdminService` + lazy-load SDK (utang teknis scaffolding FR-011, pelunasan saat fitur admin diaktifkan).

---

# Extension: Admin + Keringanan — Token sk-* (SHA256) + Firebase Spark Broadcast (+ Sidebar rev2)

> Merged dari plannotator `plan-admin-keringanan-token-sk-2026-09-01-approved.md` (approved 2026-09-01, rev2.1). Ini OPSI PRIMER untuk arsitektur US4; kontrak lama `contracts/admin-service.md` (VITE_ADMIN_TOKEN + localStorage singleton) **SUPERSEDED** oleh bagian ini.

## Plan: Admin + Keringanan — Token sk-* (SHA256) + Firebase Spark Broadcast (+ Sidebar rev2)

**Branch**: `001-hitung-swdkllj` — extension US4 | **Date**: 2026-09-01 | **Spec**: `specs/001-hitung-swdkllj/spec.md` + delta below

## Summary

Extend US4 scaffolding jadi 2-tier role:
- **Super admin** (Firebase Auth email/password) → page `/super-admin` untuk generate token admin `sk-<uuid>` (hash SHA256) dengan periode valid dinamis (tanggalMulai/tanggalAkhir), list & revoke.
- **Admin** (pemegang token `sk-*`) → login di `/admin` dengan paste token, app hash SHA256 client-side lalu lookup Firestore; bila valid & dalam periode → session admin aktif → form setup periode keringanan (`mulai`/`akhir` + 8 toggle selektif) yang broadcast global ke semua pengguna via Firestore, lalu di-cache offline (Firestore IndexedDB persistence + Pinia) sehingga kalkulator tetap pakai keringanan tanpa fetch selama periode aktif.
- **Sidebar** (rev2): burger di navbar → drawer global (`AppSidebar.vue`) dengan menu statis Setup Admin / Setup Keringanan + daftar switch `Keringanan Provisi X` (satu eksklusif ON, auto-hide saat expired, default OFF/normal, user opt-in).

DB: **Firebase Firestore** Spark (free) saja — tanpa Functions/Storage. Satu collection untuk token, satu koleksi untuk keringanan. SDK di-import dinamis (lazy) agar bundle hitung offline tidak bengkak. Rules enforce ownership + super-admin override.

---

## Requirements Delta (user 2026-09-01) + Feedback rev1 + Sidebar rev2

1. **Setup keringanan oleh admin** — halaman form: periode (mulai–akhir) + 8 toggle selektif (Pokok Tunggakan 1–4 & Denda Tunggakan 1–4). Admin tentukan slot mana yang masuk keringanan; slot yang `true` saat hitung → 0 / teks `keringanan` (feedback #1/#7).
2. **Admin login via key token** — admin paste `sk-*`, diverifikasi hash SHA256 + periode valid.
3. **Super admin generate token** — halaman `/super-admin` (Auth) untuk buat token `sk-<uuid>` → hash SHA256 → simpan hash di Firestore beserta `label` (required) & periode & status; raw token copy-able kapan pun selama `active` (feedback #2/#8; #5/#6).
4. **Firebase Spark** — prefer free tier; penuhi offline + broadcast tanpa biaya.
5. **Sidebar** (rev2 tambahan #1–#6):
   - Burger trigger di navbar → drawer global.
   - Menu statis: Setup Admin (superAdmin login), Setup Keringanan (admin login).
   - Tiap keringanan yang disubmit admin muncul sebagai switch dengan label **dari input admin saat membuat rule** (field `label` required pada doc `keringanan/{id}` — admin ketik e.g. "Provisi 1", sidebar render sesuai input) — `active`/`disabled`, hanya satu bisa ON (eksklusif, tidak tumpang tindih) — feedback rev2.1: `label` keringanan ≠ `label` token.
   - Jika expired (`today > akhir`) → switch hilang dari sidebar.
   - User opt-in: admin setup tidak auto-aktif; user toggle di sidebar. OFF semua → perhitungan normal.

Clarifications (answered 2026-09-01) + feedback rev1+rev2.1:
- Token format: `sk-` + UUIDv4, disimpan sebagai **SHA256 hex** (doc ID = hash). **Token form** (super admin): `label` (required, identifier admin e.g. "Admin Samsat Bandung — Budi" — bukan provisi) + `token` (auto `sk-*`). **Keringanan form** (admin): `label` (required, nama provisi e.g. "Keringanan Provisi 1" / "Provisi 1" — input admin, jadi sumber teks switch sidebar) — feedback #5/#6/#8 + rev2.1.
- Admin multi-tenant: N token, tiap token punya `label` required + periode valid dinamis (validFrom–validUntil) set super admin; status `active | revoked | expired` (feedback #6); revoke hanya super admin (feedback #3); expired auto dari `today > validUntil`.
- Raw token tetap bisa di-copy kapan pun selama `active` (feedback #2) — super admin list ada tombol Copy (baca `tokenRaw` field; rules `get: isSuperAdmin` guard).
- Keringanan: **koleksi** `keringanan/{id}` (bukan singleton) — tiap doc punya `label` required (**nama provisi dari input admin saat create rule**, jadi sumber switch sidebar), periode, 8 bool (pokok/denda 1–4, feedback #7), `createdBy` hash owner. User biasa **memilih** rule mana yang dipakai via **sidebar switch eksklusif** (bukan selector dropdown); jika >1 tersedia hanya satu ON; OFF → normal (rev2 #3–#6). Ownership: admin hanya ubah doc miliknya, super admin ubah semua (feedback #10). Persist via Firestore IndexedDB + Pinia → offline tanpa fetch selama periode aktif.

---

## Architecture

### Sidebar (rev2 — 2026-09-01 tambahan #1–#6)

- **Trigger**: burger button di `AppNavbar` (kiri logo, `aria-label="Buka menu"`, `aria-expanded`, `aria-controls="app-sidebar"`). Klik → drawer slide dari kiri + overlay `bg-black/40` + trap focus + close on Esc/overlay/click menu. `prefers-reduced-motion` → tanpa animasi.
- **Shell**: `src/components/AppSidebar.vue` (render di `App.vue` di atas `router-view`, bukan di `HomeView` saja — global). Tailwind: `w-72`, `bg-surface`, `border-r border-line`, `rounded-r-3xl`, shadow `pop`.
- **Menu statis**:
  1. `Setup Admin` → `router.push('/super-admin')` (icon shield)
  2. `Setup Keringanan` → `router.push('/admin')` (icon settings)
  Selalu visible; guard rute yang enforce auth/token (tidak hide menu).
- **Menu dinamis — Keringanan switches**:
  - Sumber: `keringanan/*` dari `useKeringanan` (onSnapshot collection + `localStorage` fallback). Filter: **hanya doc yang belum expired** (`todayLocal <= akhir` inclusive) yang dirender. Jika `today > akhir` → hilang dari sidebar (tambahan #4) + jika `activeKeringananId` menunjuk doc yang baru expired → auto-reset ke `null` (normal).
  - Render: tiap doc → row `Keringanan {label}` + **switch** (`role="switch"`, `aria-checked`, keyboard Space/Enter). Label dari `doc.label` (required, e.g. "Keringanan Provisi 1").
  - **Eksklusif — hanya satu aktif** (tambahan #3): semua switch terikat ke satu `activeKeringananId: string|null` di `adminStore` (persist `localStorage` key `activeKeringananId`). Toggle ON satu → `activeKeringananId = id` + semua lain OFF. Toggle OFF yang aktif → `null`. Tidak ada tumpang tindih perhitungan.
  - **User opt-in** (tambahan #5/#6): admin setup **tidak auto-aktif** — sidebar default `null` (normal). User eksplisit ON untuk mengaktifkan; OFF → `kalkulatorStore` pakai hitung normal. Badge `keringanan:aktif` di `CardHasil` hanya muncul bila `activeKeringananId != null && isKeringananAktif(doc)`.
- **State**: `adminStore.activeKeringananId`, `keringananList` (computed `visibleKeringananList` = filter `!expired`), `selectedKeringanan` (computed dari `activeKeringananId`). `kalkulatorStore` computed `keringananAktifDoc` = `adminStore.selectedKeringanan`.
- **A11y**: drawer `role="dialog"` + `aria-modal`, focus return ke burger on close.

### Roles & Routes

| Role | Route | Guard | Capability |
|---|---|---|---|
| Public (all users) | `/` | none | Kalkulator; baca `keringanan/*` (read-only) + **sidebar** pilih provisi via exclusive switch (default OFF/normal) + badge `keringanan:aktif` di CardHasil saat switch ON & dalam periode (feedback #4/#5 + tambahan #3–#6) |
| Admin | `/admin` | token `sk-*` valid & dalam periode | CRUD `keringanan/*` **hanya doc miliknya** + baca semua keringanan; tulis 8 bool selektif (feedback #10/#1); tidak auto-aktif — user yang toggle di sidebar |
| Super admin | `/super-admin` | Firebase Auth (`onAuthStateChanged`) | Generate/list/revoke `admin_tokens` (copy raw anytime, feedback #2), CRUD semua `keringanan/*` (override) |

Guards: `/admin` tetap behind `VITE_FEATURE_ADMIN==='true'` **plus** token session; `/super-admin` behind `VITE_FEATURE_SUPER_ADMIN==='true'` **plus** `auth.currentUser !== null && email in allowlist` (rules server-side juga enforce). Revoke hanya super admin (feedback #3).

### Firestore Data Model (Spark)

```
/admin_tokens/{sha256Hex}   // doc ID = SHA256(rawToken)
  hash: string              // == doc ID
  label: string             // required — e.g. "Keringanan Provisi 1" / tenant (feedback #5/#8)
  tokenRaw: string          // raw sk-*; read hanya isSuperAdmin (untuk copy anytime, feedback #2)
  validFrom: string         // YYYY-MM-DD (inclusive, local)
  validUntil: string        // YYYY-MM-DD (inclusive)
  status: 'active' | 'revoked' | 'expired'  // expired = derived today>validUntil (feedback #6)
  createdAt: Timestamp
  createdBy: string         // super admin uid/email
  revokedAt?: Timestamp

/keringanan/{id}            // koleksi, bukan singleton — satu doc per provisi/tenancy (feedback #5)
  label: string             // required — "Keringanan Provisi X" (tenancy discriminator)
  mulai: string             // YYYY-MM-DD
  akhir: string             // YYYY-MM-DD
  pokokTunggakan1: boolean  // true → pokok tunggakan 1 = 0 / "keringanan"
  dendaTunggakan1: boolean
  pokokTunggakan2: boolean
  dendaTunggakan2: boolean
  pokokTunggakan3: boolean
  dendaTunggakan3: boolean
  pokokTunggakan4: boolean
  dendaTunggakan4: boolean  // 8 toggle (feedback #7)
  createdBy: string         // admin token hash pemilik (ownership, feedback #10)
  updatedAt: Timestamp
  updatedBy: string         // hash terakhir yang mengubah
```

Alternatif tokenRaw: bila simpan raw dianggap leak, simpan di doc terpisah `admin_tokens_raw/{hash}` dengan `allow get: if isSuperAdmin()`. Untuk copy anytime lintas device, simpan di doc dengan rules guard isSuperAdmin.

Konstitusi V "tanpa backend" tetap PASS: Firestore adalah BaaS read-through, bukan server custom; kalkulator inti tetap offline-first dan tidak kirim data personal.

### Token Lifecycle

1. **Generate (super admin)**: form `label` (required) + `token` (auto `sk-`+UUID, editable) → `hash = await sha256Hex(raw)` → `setDoc(doc(db, 'admin_tokens', hash), {hash, label, tokenRaw: raw, validFrom, validUntil, status:'active', createdAt: serverTimestamp(), createdBy: auth.currentUser.uid})` → list menampilkan label+hash+periode+status+ tombol **Copy** (baca `tokenRaw`, `navigator.clipboard.writeText`) kapan pun selama `active` (feedback #2/#8). `label` required, `status` includes `expired` (feedback #5/#6).
2. **Distribusi**: super admin kirim `raw` ke admin out-of-band (WA/email) atau admin copy dari list super admin (selama active).
3. **Admin login (`/admin`)**: input `sk-*` → `hash = sha256Hex(input.trim())` → `getDoc(doc(db, 'admin_tokens', hash))` (Firestore offline cache + server) → valid jika `exists && status==='active' && todayLocal ∈ [validFrom, validUntil]` (parse YYYY-MM-DD sebagai local midnight). `expired` di-derive bila `today>validUntil` → reject + lazy update status `expired`. Jika valid → simpan session di `adminStore` (Pinia + `localStorage` key `admin_session_hash` + `admin_session_until=validUntil` + `admin_session_label`) agar verifikasi **offline** tetap bisa sampai `validUntil` lewat; `resetSession` hapus key.
4. **Revoke/Expiry (hanya super admin)**: super admin set `status='revoked'`; `expired` otomatis saat `validUntil` lewat (client derive + super admin view badge) — feedback #3/#6. Admin yang sudah login gagal di tulis keringanan karena rules cek `status==='active'` server-side; next online fetch invalidate session lokal.
5. **Rotation**: super admin buat token baru, revoke lama — tanpa downtime.

> Env `VITE_ADMIN_TOKEN` **dihapus** (diganti Firestore). `VITE_FEATURE_ADMIN` tetap; tambah `VITE_FEATURE_SUPER_ADMIN`, `VITE_FIREBASE_*` (apiKey, authDomain, projectId, appId). `.env.example` hanya placeholder, nilai real di `.env` lokal/CI (tidak komit).

### Keringanan Lifecycle (global broadcast + offline)

- **Tulis**: admin di `/admin` isi `label` (required, tenancy) + `mulai`/`akhir` + **8 toggle** pokok/denda 1–4 (feedback #7) → `setDoc(doc(db, 'keringanan', id), {label, mulai, akhir, pokokTunggakan1..dendaTunggakan4, createdBy: hash (saat create), updatedBy: hash, updatedAt: serverTimestamp()})`. Ownership: rules `allow update/delete: if resource.data.createdBy == hash` (admin hanya miliknya), super admin bypass semua (feedback #10). Koleksi `keringanan` (bukan singleton) sehingga >1 provisi bisa aktif bersamaan tanpa tumpang tindih (feedback #5).
- **Baca (public + admin)**: `onSnapshot(collection(db, 'keringanan'), cb)` saat app start; `enableIndexedDbPersistence(db)` cache IndexedDB otomatis offline. `observeKeringanan(cb)` di-wrap ke `onSnapshot` + fallback `localStorage` key `keringanan_list` (JSON array) untuk boot offline. Sidebar render **hanya yang belum expired** (`today <= akhir`); expired hilang (tambahan #4). User **opt-in via sidebar switch eksklusif** — bila >1 rule tersedia, hanya satu yang bisa ON (tambahan #3); OFF semua → normal (tambahan #6); admin setup tidak auto-aktif (tambahan #5).
- **Evaluasi aktif**: `isKeringananAktif(doc) = todayLocal ∈ [mulai, akhir]` per doc. Kalkulator pakai **doc terpilih** (`activeKeringananId` di Pinia/localStorage, exclusive). Selektif: `applyKeringanan(hasil, doc)` hanya nol-kan slot yang flag `true` (e.g. `if doc.pokokTunggakan1 then hasil.pokokTunggakan1=0`, `if doc.dendaTunggakan1 then hasil.dendaTunggakan1=0`, dst). Slot `true` tampil `0` atau teks `keringanan` di CardHasil (feedback #1). Jika `activeKeringananId == null` atau doc tidak aktif → hitung normal. `todayLocal` = jam lokal.
- **Badge**: `CardHasil.vue` tampilkan badge `keringanan:aktif` (chip) bila `selectedKeringanan` aktif (feedback #4).
- **Pinia**: `adminStore.keringananList`, `visibleKeringananList` (filter !expired), `activeKeringananId` (string|null, localStorage, **exclusive**), `selectedKeringanan` (computed dari activeKeringananId + active check); `kalkulatorStore` baca `selectedKeringanan` untuk `applyKeringananSelective`. Default `null` → normal.

### Offline Strategy

- `enableIndexedDbPersistence(db)` (Firestore) → cache `admin_tokens/{hash}` + `keringanan/*` di IndexedDB; reads offline hit cache, writes antri sampai online (admin write butuh online untuk konfirmasi — toast "tersimpan lokal, akan sync saat online").
- Pinia `persistedState` (`localStorage`) mirror untuk `keringanan_list`, `activeKeringananId`, `admin_session_*` — kalkulator (`hitungPerhitungan` + `applyKeringananSelective`) baca dari Pinia tanpa import Firebase, jalur hitung tetap 100% offline & tanpa SDK. Selama periode aktif tidak perlu fetch.
- PWA precache tidak berubah; Firebase SDK di-lazy: `() => import('firebase/app')` hanya di route `/admin` & `/super-admin` serta `useKeringanan` — bundle `/` tidak membengkak (hanya listener collection, ~1 read per open, cache >12h).

### Firestore Security Rules (Spark-compatible, tanpa Functions)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isSuperAdmin() {
      return request.auth != null && request.auth.token.email in ["superadmin@example.com"]; // ganti allowlist real
    }
    function tokenDoc(hash) {
      return get(/databases/$(db)/documents/admin_tokens/$(hash))
    }
    function isActiveAdmin(hash) {
      return exists(/databases/$(db)/documents/admin_tokens/$(hash))
          && tokenDoc(hash).data.status == 'active'
    }
    // admin_tokens: GET by hash boleh (admin verify), LIST/CREATE/UPDATE/REVOKE hanya super admin
    match /admin_tokens/{hash} {
      allow get: if true; // hash tidak bisa ditebak (256-bit)
      allow list: if isSuperAdmin();
      allow create, update: if isSuperAdmin();
      allow delete: if false;
    }
    // keringanan: semua boleh read (public butuh list untuk sidebar)
    // tulis: admin hanya doc miliknya (createdBy == hash), super admin semua doc
    match /keringanan/{id} {
      allow read: if true;
      allow create: if isSuperAdmin() || isActiveAdmin(request.resource.data.createdBy);
      allow update, delete: if isSuperAdmin() || resource.data.createdBy == request.resource.data.updatedBy
                            && isActiveAdmin(request.resource.data.updatedBy);
    }
  }
}
```

Catatan rev1: `tokenRaw` field — `allow get: if true` sudah expose hash lookup; untuk guard `tokenRaw` super-only simpan di doc terpisah `admin_tokens_raw/{hash}` dengan `allow read: if isSuperAdmin()`. Ownership keringanan via `createdBy == updatedBy` (admin hanya miliknya, feedback #10). `expired` di-derive client; super admin view bisa update status `expired`. Enumerasi token dicegah `allow list: if isSuperAdmin()`. Catatan: `updatedBy` harus = hash admin; super admin pakai `request.auth.uid` path terpisah bila ingin strict — untuk MVP, super admin tulis dengan `updatedBy = request.auth.uid` dan rules cabang `isSuperAdmin()` meng-cover tanpa cek `admin_tokens`. Alternatif: split `keringanan/current` write jadi dua allow clause (super admin OR valid token). Enumerasi token dicegah dengan `allow list: if isSuperAdmin()`.

### Tech Stack Delta

- **Tambah**: `firebase@^10` (app, auth, firestore). Hanya `firebase` — tidak ada `@firebase/*` terpisah.
- **Hapus**: tidak ada dep baru selain firebase; `VITE_ADMIN_TOKEN` env dihapus.
- **Build**: `vite.config.ts` unchanged; Firebase tree-shakeable; dynamic import di `src/services/firebase.ts` (initApp + getFirestore + enableIndexedDbPersistence + getAuth).
- **Env**: `.env.example` → `VITE_FEATURE_ADMIN`, `VITE_FEATURE_SUPER_ADMIN`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_SUPER_ADMIN_EMAILS` (comma list).

### Project Structure Delta

```
src/services/firebase.ts         // init, getDb(), getAuth(), sha256Hex(raw), enablePersistence
src/services/adminTokenService.ts // generateToken() sk-*, hashToken(), verifyAdminToken(hash), list/revoke (super admin only), copyRaw()
src/services/keringananService.ts // CRUD keringanan/{id} (label+periode+8 bools), ownership check, onSnapshot collection
src/services/adminService.ts     // keep interface, reimpl: observeKeringanan via onSnapshot collection + localStorage fallback, apply selective
src/stores/adminStore.ts         // session hash/until/label, isAuthenticated, keringananList, visibleKeringananList, activeKeringananId
src/stores/superAdminStore.ts    // auth state, login/logout, token list, revoke
src/views/SuperAdminView.vue     // login + token generator (label+token) + copy anytime + list/revoke + override keringanan semua tenant
src/views/AdminView.vue          // rework: token input + verify + form keringanan (label+periode+8 toggles) — hanya miliknya
src/components/AppSidebar.vue        // burger drawer + menu Setup Admin/Keringanan + exclusive switches Keringanan Provisi X (rev2 #1–#6) + expired hide + opt-in
src/components/CardHasil.vue     // tambah badge `keringanan:aktif` + teks `keringanan` untuk slot yang di-nol-kan (feedback #4, #1)
src/composables/useKeringanan.ts // onSnapshot collection wrapper + Pinia sync + cadence (app start / online / >12h) + selected persistence
src/domain/keringanan.ts         // isKeringananAktif(doc, today), applyKeringananSelective(hasil, doc) — 8 bool per-slot (murni, testable)
```

Router: tambah `/super-admin` (guard `isSuperAdmin`), `/admin` guard perbaharui (cek session hash + Firestore + status active). `firestore.rules` di root.

### Constitution Check

| Prinsip | Status | Catatan |
|---|---|---|
| I Vue 3 Composition | PASS | Views/composables `<script setup>` |
| II Pinia | PASS | adminStore + superAdminStore + tarifStore |
| III Akurasi | PASS | keringanan tetap `applyKeringanan()` murni; Firestore hanya supply periode |
| IV PWA Offline | PASS | Hitung tetap offline; Firestore cache IndexedDB + localStorage fallback |
| V Simplicity | PASS | Satu koleksi token + satu doc keringanan; tanpa Functions/Storage |

### Risks & Mitigations (Spark)

- **Spark limits** (50k reads/day, 20k writes/day): estimasi <2k reads/day untuk 1k DAU (1 collection read `keringanan` per open, 1 read token per admin login) → aman. Mitigasi: cache + cadence >12h; collection ~N docs tetap 1 query.
- **Token brute force**: SHA256 256-bit, doc ID tidak listable → infeasible.
- **Admin write tanpa Auth**: rules cek `admin_tokens` existence; trade-off: admin harus kirim hash sebagai `updatedBy` — tidak bisa spoof tanpa tahu raw token.
- **Offline token verify**: pakai session cache sampai `validUntil`; revoke baru efektif saat online berikutnya — diterima (window max 12h).

---

## Implementation Phases (tasks.md delta)

**Phase 6 revised (US4)** — ganti T048–T054 lama (rev1+rev2):

- T048 `tests/unit/keringanan.spec.ts` + `tests/unit/keringanan-selective.spec.ts` — hash, periode valid, `expired` derive, selective 8 bool (pokok/denda 1–4 → 0), badge condition, multi-provisi selector tidak crash; tambah `tests/unit/sidebar-keringanan.spec.ts` — exclusive switch, expired hide, default OFF→normal, opt-in
- T048b `tests/unit/admin-token.spec.ts` — sha256Hex, generate sk-*, copy anytime, status active/revoked/expired
- T049 `src/services/firebase.ts` + `adminTokenService.ts` + `keringananService.ts` + `src/domain/keringanan.ts` (selective apply)
- T050 `src/stores/superAdminStore.ts` + `src/views/SuperAdminView.vue` (Auth + generate label+token + list + Copy anytime + revoke super-only)
- T051 rework `src/views/AdminView.vue` + `src/stores/adminStore.ts` + `src/components/AppSidebar.vue` + `AppNavbar.vue` burger (verify hash, session persist, form label+periode+8 toggles, ownership, drawer a11y)
- T052 `src/services/adminService.ts` reimpl (onSnapshot collection + localStorage fallback) + `src/composables/useKeringanan.ts`
- T053 wiring `kalkulatorStore` ← `activeKeringananId` exclusive (`applyKeringananSelective`) + `CardHasil.vue` badge `keringanan:aktif` + teks `keringanan` + sidebar toggle logic (satu aktif, OFF→normal, expired auto-hide)
- T054 router guards `/admin` & `/super-admin` + `firestore.rules` (per-doc ownership, super admin override) + `firebase.json` + `.env.example` update
- T055 E2E manual: generate token (label+sk-*) → copy anytime → admin login offline/online → set keringanan selective (mis. pokok1+denda1) → sidebar switch ON/OFF → CardHasil badge + slot 0/`keringanan` → >1 provisi → hanya satu ON → expired → hilang → OFF semua → normal; rev2#1–#6 verified

Phase 7 Polish tetap; tambah T057 audit rules (ownership, tokenRaw super-only, expired) & Spark quota (collection reads) + T058 sidebar a11y (focus trap, Esc, reduced-motion) + T059 expired hide E2E.

---

## Decisions Requiring User Confirmation — rev1+rev2

1. **Email super admin allowlist** — sebutkan email yang akan jadi super admin (untuk rules `isSuperAdmin`).
2. ~~Admin boleh tulis keringanan langsung~~ → **Opsi A confirmed** (feedback #10): admin CRUD hanya doc miliknya, super admin CRUD semua. Implemented via `createdBy` ownership.
3. **Validasi periode token** inclusive (sampai akhir hari) — confirmed ya (feedback #11).
4. **Selector keringanan public** → resolved rev2: **sidebar exclusive switches** (tambahan #3) — bukan dropdown di HomeView/CardHasil. Satu ON, lain OFF.
5. **Teks `keringanan`**: tampil sebagai `Rp 0 (keringanan)` atau chip `keringanan` saja? Perlu konfirmasi copy.


---
