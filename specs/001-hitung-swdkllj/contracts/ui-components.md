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
footer: "Tarif dasar mengacu pada PMK No. 16/PMK.010/2017 · denda 25% per tahun keterlambatan. Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat & Jasa Raharja."
```

## 3. Kontrak Komponen

### AppNavbar
Logo persegi gradien brand→cyan (ikon perisai+centang OD) · judul **"Hitung SWDKLLJ"** subjudul **"Kalkulator Jasa Raharja"** · tombol **"Pasang App"** (`#btn-install`, hidden sampai beforeinstallprompt) · tombol tema bulat aria-label "Ganti tema terang/gelap". Tips iOS (`#hint-ios`, hanya iOS non-standalone): "Tips iPhone: buka menu Bagikan lalu pilih Tambahkan ke Layar Utama untuk memasang aplikasi."

### CardTransaksi
h2 "Jenis Transaksi", sub "Pilih transaksi yang akan dilakukan di Samsat." Label "Transaksi" → select opsi: placeholder "Pilih jenis transaksi…"; `perpanjangan`="Perpanjangan / Pengesahan", `balik-nama`="Balik Nama", `mutasi-masuk`="Mutasi Masuk", `mutasi-keluar`="Mutasi Keluar". Tombol **"Lanjutkan"** disabled sampai terpilih.

### CardDataKendaraan
h2 "Data Kendaraan", sub "Lengkapi data untuk menghitung premi.", tombol-link "Ubah" (fokus ke Card 1). Field:
- Label "Tanggal jatuh tempo" → `<input type=date>`
- Label "Jenis kendaraan" → select: "Pilih jenis kendaraan…" · `motor`="Sepeda Motor" · `mobil`="Mobil Penumpang"
- Legend "Fungsi kendaraan" → radio-chip: `pribadi`="Pribadi" (default checked) · `angkutan`="Angkutan Umum"
- Fieldset "Besar CC mesin" (hidden hingga jenis dipilih) → radio-chip dinamis dari data: motor→"<250cc"/">250cc", mobil→"<2400cc"/">2400cc"
- Tombol **"Hitung Premi SWDKLLJ"** (disabled saat invalid) + hint "Lengkapi tanggal jatuh tempo, jenis kendaraan, dan besar CC."

Emits/interaksi via store: `lanjutkan`, `ubahTransaksi→reset penuh`, `hitung`.

### CardHasil
h2 "Hasil Perhitungan", sub "Estimasi tarif SWDKLLJ Anda." Chip ringkasan: label transaksi · jenis · fungsi · CC. Baris `<dl>`:
1. **"Selisih keterlambatan"** (+ note "min 30 hari · maks 5 tahun" bila terlambat) — dd: `"Terlambat {N} hari"` (+ " (maks 5 tahun)" bila dicap, `text-warn`) | "Tepat jatuh tempo hari ini" | "Belum jatuh tempo, lebih awal {N} hari"
2. **"Premi berjalan"** · 3. **"Denda berjalan"** ("Rp 0" bila nol) · 4–7. pasangan **"Premi tunggakan {k}"** / **"Denda tunggakan {k}"** k=1..n (dd `text-warn` bila >0)
Baris tetap: **"Total estimasi"** (Intl id-ID IDR, 0 desimal) · panel **"Jatuh tempo selanjutnya"** (tanggal panjang Indonesia) · tombol outline **"Hitung Ulang"**.

Format uang: `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })`.

## 4. Aturan Kesetiaan Desain

- Token/label/layout di atas ditranskrip 1:1 dari Open Design; perubahan visual apa pun HARUS disinkronkan lewat MCP Open Design terlebih dahulu, lalu diterjemahkan ke utilitas Tailwind (FR-014).
- Dilarang CSS kustom di luar Tailwind kecuali: blok `@theme`, custom variant dark, keyframes `rise`.
- Semua kontrol interaktif: label eksplisit, fokus-ring (`ring` brand), kontras AA.
