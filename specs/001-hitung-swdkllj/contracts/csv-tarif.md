# Kontrak: CSV Tarif SWDKLLJ (`src/data/tarif-swdkllj.csv`)

Sumber kebenaran TUNGGAL angka tarif (FR-008, FR-013). Read-only — tidak ada write/update dari aplikasi. Sumber regulasi: **PMK No. 16/PMK.010/2017** (perubahan atas PMK 36/PMK.010/2008); tarif tahunan sudah termasuk biaya kartu dana Rp3.000.

## Skema (header persis, urutan tetap)

```csv
kode_transaksi,jenis_kendaraan,fungsi_kendaraan,kategori_cc,label_cc,premi_pokok,denda_per_tahun,sumber_rujukan
```

| Kolom | Tipe | Aturan |
|---|---|---|
| kode_transaksi | enum | `perpanjangan\|balik-nama\|mutasi-masuk\|mutasi-keluar` |
| jenis_kendaraan | enum | `motor\|mobil` |
| fungsi_kendaraan | enum | `pribadi\|angkutan` |
| kategori_cc | enum | `lt-250\|gt-250\|lt-2400\|gt-2400` |
| label_cc | string tampilan | `<250cc` / `>250cc` / `<2400cc` / `>2400cc` |
| premi_pokok | integer rupiah > 0 | tanpa titik/koma/desimal |
| denda_per_tahun | desimal titik, 0 < r ≤ 1 | mis. `0.25` |
| sumber_rujukan | string non-kosong | mis. `PMK 16/PMK.010/2017` |

Encoding UTF-8, pemisah koma, baris LF, tanpa BOM, tanpa kolom tambahan.

## Isi Awal (nilai dikonfirmasi ulang saat penyusunan file sebelum test disetujui)

Premi pokok per kombinasi (berlaku sama untuk keempat transaksi):

| jenis × CC | fungsi | premi_pokok |
|---|---|---|
| motor lt-250 | pribadi / angkutan | 35000 |
| motor gt-250 | pribadi / angkutan | 83000 |
| mobil lt-2400 | pribadi | 143000 |
| mobil lt-2400 | angkutan | 73000 |
| mobil gt-2400 | pribadi / angkutan | 163000 |

→ total **4 × 10 = 40 baris**. (`denda_per_tahun=0.25`, `sumber_rujukan=PMK 16/PMK.010/2017` di semua baris.)

## Aturan Validasi Parser (`domain/csv-parser.ts`) — fail-closed

1. Header harus persis sama (nama & urutan).
2. Semua nilai enum valid; `premi_pokok` integer > 0; `denda_per_tahun` ∈ (0,1].
3. Kunci `(kode_transaksi,jenis_kendaraan,fungsi_kendaraan,kategori_cc)` unik.
4. Lengkap: setiap kombinasi yang bisa dibentuk UI wajib punya baris.
5. **Satu pelanggaran apa pun → tolak SELURUH file** → `tarifStore.tariffAvailable=false` → tombol "Hitung Premi SWDKLLJ" disabled + pesan **"Data tarif tidak tersedia — muat ulang atau perbarui aplikasi"** (FR-008 Opsi A). Dilarang fallback/menebak.

## Uji Parser Wajib

- Happy path: 40 baris → parse sukses, lookup semua kunci UI ditemukan.
- Header salah / kolom kurang-lebih → reject.
- Duplikat kunci → reject.
- premi negatif / desimal / kosong; denda = 0 / ≥ 1 / bukan angka → reject masing-masing.
- File kosong / hanya header → reject.
- Baris ber-CRLF tetap terbaca (toleransi), BOM ditolak.
