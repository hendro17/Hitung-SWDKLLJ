# Kontrak: Komponen UI & Tema Tailwind ↔ Open Design

Sumber kebenaran visual: Open Design project **Hitung SWDKLLJ** (FR-014). Styling **Tailwind CSS v4** (mandat pengguna 2026-08-23) — token dipetakan ke `@theme` di `src/style.css`. Semua teks user-facing di bawah adalah string EKSAK.

## 1. Pemetaan Token (Open Design → Tailwind)

| Token OD (CSS var) | Light | Dark | Utilitas Tailwind |
|---|---|---|---|
| `--bg` | `oklch(.962 .012 230)` | `oklch(.185 .03 252)` | `bg-app` |
| `--surface` | `oklch(.996 .003 230)` | `oklch(.235 .032 250)` | `bg-surface` |
| `--fg` | `oklch(.26 .05 252)` | `oklch(.94 .01 230)` | `text-ink` |
| `--muted` | `oklch(.53 .03 250)` | `oklch(.71 .02 240)` | `text-mu` |
| `--border` | `oklch(.895 .018 232)` | `oklch(.33 .03 250)` | `border-line` |
| `--brand` / `--brand-strong` / `--brand-soft` | oklch biru | oklch biru | `text-brand`, `bg-brand-strong`, `bg-brand-soft` |
| `--cyan` / `--cyan-ink` | oklch cyan | oklch cyan | gradien logo, aksen |
| `--danger` (`warn`) | `oklch(.55 .18 27)` | `oklch(.72 .15 24)` | `text-warn` (hanya utk nominal terlambat) |

Non-warna: font `Plus Jakarta Sans` (400–800); radius card `rounded-3xl`, kontrol `rounded-2xl`, chip/navbar-btn `rounded-full`; shadow `card` & `pop`; shell max-width `30rem`; animasi reveal `.reveal` keyframes `rise` (opacity 0→1, translateY 14px→0, .4s cubic-bezier(.22,1,.36,1), mati saat `prefers-reduced-motion`); angka pakai `tabular-nums`. Dark mode via class `html.dark` + meta theme-color `#0e6db8` light / `#0b1c30` dark.

## 2. Struktur Halaman (HomeView)

```
skip-link "Lewati ke konten"
AppNavbar (sticky)
StepIndicator: 1 Transaksi · 2 Data Kendaraan · 3 Hasil (done → ✓)
main#mulai
├── CardTransaksi   data-testid="card-transaksi"
├── CardDataKendaraan [hidden]  data-testid="card-data"
└── CardHasil [hidden] aria-live="polite"  data-testid="card-hasil"
footer: "Tarif dasar mengacu pada PMK No. 36/PMK.010/2008 · denda triwulan 25% dari tarif denda maksimal per triwulan. Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat & Jasa Raharja."
```

## 3. Kontrak Komponen

### AppNavbar
Logo persegi gradien brand→cyan (ikon perisai+centang OD) · judul **"Hitung SWDKLLJ"** subjudul **"Kalkulator Jasa Raharja"** · tombol **"Pasang App"** (`#btn-install`, hidden sampai beforeinstallprompt) · tombol tema bulat aria-label "Ganti tema terang/gelap". Tips iOS (`#hint-ios`, hanya iOS non-standalone): "Tips iPhone: buka menu Bagikan lalu pilih Tambahkan ke Layar Utama untuk memasang aplikasi."

### CardTransaksi
h2 "Jenis Transaksi", sub "Pilih transaksi yang akan dilakukan di Samsat." Label "Transaksi" → select opsi (value = KodeTransaksi data-model §1): placeholder "Pilih jenis transaksi…"; `PERPANJANGAN`="Perpanjangan / Pengesahan", `BALIK_NAMA`="Balik Nama", `MUTASI_MASUK`="Mutasi Masuk", `MUTASI_KELUAR`="Mutasi Keluar". Tombol **"Lanjutkan"** disabled sampai terpilih.

### CardDataKendaraan
h2 "Data Kendaraan", sub "Lengkapi data untuk menghitung premi.", tombol-link "Ubah" (fokus ke Card 1). Field:
- Label "Tanggal jatuh tempo" → `<input type=date>`
- Label "Jenis kendaraan" → select (opsi = kolom `deskripsi` tarif CSV, value `golongan`; §13.3 DITUTUP keputusan pengguna 2026-08-28 sesi 2): placeholder "Pilih jenis kendaraan…" · 9 opsi sesuai tabel master business-logic §2
- Fieldset radio "CC mesin" (hidden hingga jenis kendaraan dipilih; OPSIONAL — tak pernah memblokir Hitung) → pilihan radio dinamis per family: motor (C1/C2) → "<250cc" / ">250cc"; minibus AU (DU/EU) → "≤1600cc" / ">1600cc"; barang/penumpang bukan AU (DP/F) → "≤2400cc" / ">2400cc"; A/B/EP/EU(bus) → tanpa radio. Pilihan default ditentukan `default_cc` baris golongan (terpilih bila `default_cc > batas family`, keputusan pengguna 2026-08-28 sesi 2). Memilih radio → `konfirmasiGolongan` adjust golongan dalam family sama (domain-api §1); label/kemunculan persis mengikuti Open Design (FR-014, T005)
- Tombol **"Hitung Premi SWDKLLJ"** (disabled hanya bila tanggal invalid / golongan belum dipilih / tarif tak tersedia) + hint "Lengkapi tanggal jatuh tempo dan jenis kendaraan."

Emits/interaksi via store: `lanjutkan`, `ubahTransaksi→reset penuh`, `hitung`.

### CardHasil
h2 "Hasil Perhitungan", sub "Estimasi tarif SWDKLLJ Anda." Chip ringkasan: label transaksi · jenis kendaraan (deskripsi) · label radio CC terpilih (absen bila null). Status khusus menggantikan seluruh baris dengan pesan tunggal: `belum-jatuh-tempo` → **"Premi Belum Jatuh Tempo / Masih Berlaku"** (block §6.1, hanya PERPANJANGAN); `lunas` → pesan Lunas total 0 (Case B BALIK_NAMA/MUTASI_MASUK). Baris `<dl>` utk status `rincian` (business-logic §8):
1. **"Keterlambatan"** — dd `"{tunggakan_count} tahun, {hari_denda_berjalan} hari"` (`text-warn`)
2. **"Pokok berjalan"** · 3. **"Denda berjalan"** ("Rp 0" bila nol) · 4–11. pasangan **"Pokok tunggakan {k}"** / **"Denda tunggakan {k}"** k=1..n, n≤4, baris absen bila tunggakan k tak ada (dd `text-warn` bila >0) · **"Pokok prorata"** + note "{bulan_prorata} bulan" (hanya BALIK_NAMA / MUTASI_MASUK)
Baris tetap: **"Kartu dana"** (Rp 3.000) · **"Total estimasi"** (Intl id-ID IDR, 0 desimal) · panel **"Jatuh tempo selanjutnya"** (format `dd MMMM yyyy` Indonesia) · tombol outline **"Hitung Ulang"**.

Format uang: `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })`.

## 4. Aturan Kesetiaan Desain

- Token/label/layout di atas ditranskrip 1:1 dari Open Design; perubahan visual apa pun HARUS disinkronkan lewat MCP Open Design terlebih dahulu, lalu diterjemahkan ke utilitas Tailwind (FR-014).
- Dilarang CSS kustom di luar Tailwind kecuali: blok `@theme`, custom variant dark, keyframes `rise`.
- Semua kontrol interaktif: label eksplisit, fokus-ring (`ring` brand), kontras AA.
