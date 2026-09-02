# Design Transcript — Hitung SWDKLLJ

**Status: FALLBACK — Open Design MCP TIDAK TERSEDIA**

Task T005 (tasks.md) mewajibkan transkrip desain UI lengkap dari Open Design project `Hitung SWDKLLJ` via MCP `@open-design`. Delegate open-design dipanggil (2026-08-28 sesi pipeline) dan **mengembalikan tanpa output** — project tidak dapat diakses/diekstrak pada sesi ini. Sesuai kebijakan sesi pengguna (T005): *"bila Open Design tidak tersedia jangan block pipeline — gunakan contracts/ui-components.md + catat selisih di dokumen."*

Dokumen ini = transkrip FALLBACK bersumber **contracts/ui-components.md** (kontrak token & komponen), kontrak domain-api §1 (aturan radio CC), dan data-model §3 (state machine wizard). Bukan ekstraksi visual langsung dari Open Design. Referensi WAJIB untuk task komponen T029–T039 tetap berlaku — bila Open Design tersedia kembali, dokumen ini harus diganti dengan transkrip asli dan selisih dicatat.

---

## 1. Pemetaan Token (Open Design → Tailwind v4)

| Token | Light | Dark | Utilitas |
|---|---|---|---|
| `--bg` | `oklch(.962 .012 230)` | `oklch(.185 .03 252)` | `bg-app` |
| `--surface` | `oklch(.996 .003 230)` | `oklch(.235 .032 250)` | `bg-surface` |
| `--fg` | `oklch(.26 .05 252)` | `oklch(.94 .01 230)` | `text-ink` |
| `--muted` | `oklch(.53 .03 250)` | `oklch(.71 .02 240)` | `text-mu` |
| `--border` | `oklch(.895 .018 232)` | `oklch(.33 .03 250)` | `border-line` |
| `--brand` / `--brand-strong` / `--brand-soft` | oklch biru | oklch biru | `text-brand`, `bg-brand-strong`, `bg-brand-soft` |
| `--cyan` / `--cyan-ink` | oklch cyan | oklch cyan | gradien logo, aksen |
| `--danger` (`warn`) | `oklch(.55 .18 27)` | `oklch(.72 .15 24)` | `text-warn` (nominal terlambat) |

Non-warna: font `Plus Jakarta Sans` (400–800); radius card `rounded-3xl`, kontrol `rounded-2xl`, chip/navbar-btn `rounded-full`; shadow `card` & `pop`; shell max-width `30rem`; angka `tabular-nums`; animasi `.reveal` keyframes `rise` (opacity 0→1, translateY 14px→0, .4s cubic-bezier(.22,1,.36,1), mati saat `prefers-reduced-motion`). Dark mode via class `html.dark` + meta theme-color `#0e6db8` light / `#0b1c30` dark.

## 2. Struktur Halaman (HomeView)

skip-link "Lewati ke konten" → AppNavbar (sticky) → StepIndicator (1 Transaksi · 2 Data Kendaraan · 3 Hasil; done → ✓) → `main#mulai`:
- CardTransaksi `data-testid="card-transaksi"`
- CardDataKendaraan `[hidden]` `data-testid="card-data"`
- CardHasil `[hidden]` `aria-live="polite"` `data-testid="card-hasil"`

Footer: "Tarif dasar mengacu pada PMK No. 36/PMK.010/2008 · denda triwulan 25% dari tarif denda maksimal per triwulan. Hasil bersifat estimasi — penetapan resmi mengikuti ketentuan Samsat & Jasa Raharja."

## 3. Komponen & Copy Eksak

- **AppNavbar**: logo persegi gradien brand→cyan (ikon perisai+centang) · judul **"Hitung SWDKLLJ"** sub **"Kalkulator Jasa Raharja"** · tombol **"Pasang App"** (`#btn-install`, hidden sampai beforeinstallprompt) · tombol tema bulat aria-label **"Ganti tema terang/gelap"** · tips iOS `#hint-ios` (hanya iOS non-standalone): "Tips iPhone: buka menu Bagikan lalu pilih Tambahkan ke Layar Utama untuk memasang aplikasi."
- **CardTransaksi**: h2 **"Jenis Transaksi"** sub "Pilih transaksi yang akan dilakukan di Samsat." Label **"Transaksi"** → select: placeholder "Pilih jenis transaksi…"; opsi value=KodeTransaksi: PERPANJANGAN="Perpanjangan / Pengesahan", BALIK_NAMA="Balik Nama", MUTASI_MASUK="Mutasi Masuk", MUTASI_KELUAR="Mutasi Keluar". Tombol **"Lanjutkan"** disabled sampai terpilih.
- **CardDataKendaraan**: h2 **"Data Kendaraan"** sub "Lengkapi data untuk menghitung premi." Tombol-link **"Ubah"** (fokus ke Card 1). Field: label **"Tanggal jatuh tempo"** → input type=date; label **"Jenis kendaraan"** → select opsi = kolom `deskripsi` CSV (9 opsi, value=golongan), placeholder "Pilih jenis kendaraan…". Fieldset radio **"CC mesin"** (hidden hingga jenis dipilih; OPSIONAL, tak pernah memblokir Hitung): motor (C1/C2) "<250cc"/">250cc"; minibus-au (DU/EU) "≤1600cc"/">1600cc"; non-umum (DP/F) "≤2400cc"/">2400cc"; A/B/EP/EU(bus) tanpa radio. Default = `default_cc` baris golongan (`> batas family` → opsi atas). Pilih radio → `konfirmasiGolongan` adjust dalam family. Tombol **"Hitung Premi SWDKLLJ"** disabled hanya bila tanggal invalid / golongan belum dipilih / tarif tak tersedia; hint: "Lengkapi tanggal jatuh tempo dan jenis kendaraan."
- **CardHasil**: h2 **"Hasil Perhitungan"** sub "Estimasi tarif SWDKLLJ Anda." Chip ringkasan: label transaksi · jenis kendaraan (deskripsi) · label radio CC terpilih (absen bila null). Status khusus → pesan tunggal: `belum-jatuh-tempo` → **"Premi Belum Jatuh Tempo / Masih Berlaku"** (hanya PERPANJANGAN); `lunas` → pesan total 0. Baris `<dl>` status `rincian`:
  1. **"Keterlambatan"** `"{N} tahun, {M} hari"` (`text-warn`)
  2. **"Pokok berjalan"** · 3. **"Denda berjalan"** ("Rp 0" bila nol) · 4–11. pasangan **"Pokok tunggakan {k}"** / **"Denda tunggakan {k}"** k=1..n, n≤4 (dd `text-warn` bila >0) · **"Pokok prorata"** + note "{bulan_prorata} bulan" (hanya BALIK_NAMA/MUTASI_MASUK)
  Baris tetap: **"Kartu dana"** (Rp 3.000) · **"Total estimasi"** (Intl id-ID IDR 0 desimal) · panel **"Jatuh tempo selanjutnya"** `dd MMMM yyyy` · tombol outline **"Hitung Ulang"**.

Format uang: `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })`.

## 4. Alur Radio CC Dinamis + Prefill default_cc

- Radio muncul hanya untuk family `motor` / `minibus-au` / `barang-penumpang-non-umum`; family `null` (A/B/EP/EU-bus) tanpa radio.
- Pilihan default saat golongan dipilih = `default_cc > batas family` (motor 250, minibus-au 1600, non-umum 2400) → untuk seluruh 9 baris, prefill mereproduksi golongan baris itu tanpa adjustment.
- Radio OPSIONAL: tombol "Hitung Premi SWDKLLJ" enabled tanpa interaksi radio. Memilih radio → `konfirmasiGolongan(golongan, pilihanCc)`: bawah→C1/DU/DP, atas→C2/EU/F dalam family sama; null → apa adanya.
- Metadata pilihan CC (label opsi) hanya untuk chip Card 3 — tidak dipakai kalkulasi.

## 5. State Machine Wizard (data-model §3)

Idle → Step1 (pilih transaksi) → Lanjutkan → Step2 → Hitung (guard: tanggal valid && golongan && tariffAvailable) → Step3 (hasil/block/lunas). "Ubah" / ganti transaksi saat step≥2 → reset penuh (FR-003). "Hitung Ulang" → reset ke Card 1.

## 6. Selisih dengan contracts/ui-components.md

Karena Open Design tidak tersedia, transkrip ini = kontrak (tidak ada selisih yang bisa dicatat). Aspek yang TETAP BELUM TERVERIFIKASI terhadap Open Design asli (risiko, harus disinkronkan saat MCP tersedia): warna oklch eksak, ikon logo perisai+centang, spacing/typography rendering, label radio CC eksak (fallback dipakai "<250cc"/">250cc"/"≤1600cc"/">1600cc"/"≤2400cc"/">2400cc"), dan detail visual chip/hasil. Implementasi komponen T029–T039 memakai fallback ini + kontrak.