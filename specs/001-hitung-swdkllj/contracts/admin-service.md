# Kontrak: Scaffolding Admin Service (`src/services/adminService.ts`)

Status: **scaffolding** (FR-011/FR-012) — dinonaktifkan rilis awal via feature flag `VITE_FEATURE_ADMIN=false`. Rute `/admin` hanya terdaftar saat flag aktif.

Diperbarui 2026-08-26 (clarified session): satu akun admin berbasis token env (menggantikan Firebase Auth email/password); keringanan berupa PERIODE (tanggalMulai/tanggalAkhir) dengan evaluasi jam lokal; cadence fetch ditetapkan.

Diperbarui 2026-08-28 (sesi 2, keputusan pengguna): **Firebase (Auth & Remote Config) DILEWATI/DITUNDA** — tidak diinstal, tidak di-import. Periode keringanan ditetapkan admin dan disimpan **lokal** (cache `localStorage`); saluran distribusi global ke semua pengguna belum dibangun dan keputusan salurannya akan dilihat kembali saat implementasi bila diperlukan.

## Interface (vendor-agnostic)

```ts
export interface PeriodeKeringanan {
  mulai: string   // ISO date YYYY-MM-DD
  akhir: string   // ISO date YYYY-MM-DD
}

export interface AdminService {
  /** Verifikasi token satu akun admin terhadap VITE_ADMIN_TOKEN (env build-time).
   *  Sinkron, bekerja OFFLINE. Cocok → isAuthenticated() = true.
   *  Tidak cocok → false + pesan error jelas; tanpa perubahan mode keringanan. */
  verifyToken(token: string): boolean
  /** Hapus sesi admin terverifikasi (keluar dari mode admin). */
  resetSession(): void
  readonly isAuthenticated(): boolean
  /** Observe periode keringanan dari cache lokal (localStorage). Emit null bila
   *  tidak ada periode tersimpan. Status aktif DITURUNKAN LOKAL:
   *  today >= mulai && today <= akhir (jam lokal) — saat tanggal akhir terlewati,
   *  emit berakhir otomatis walau offline. */
  observeKeringanan(cb: (periode: PeriodeKeringanan | null) => void): () => void
  /** Admin-only (butuh isAuthenticated): tetapkan periode keringanan & simpan
   *  ke cache lokal. Saluran broadcast global belum ada (DITUNDA). */
  setPeriodeKeringanan(periode: PeriodeKeringanan): void
}
```

## Implementasi Referensi — Lokal (berlaku sekarang)

- **Verifikasi token**: perbandingan konstan `VITE_ADMIN_TOKEN` (build-time env) — tanpa Firebase Auth, tanpa backend. Nilai riil hanya di `.env` lokal/CI (tidak pernah dikomit; `.env.example` berisi placeholder).
- **Penyimpanan periode**: kunci `keringanan_periode` di `localStorage` (JSON `{"mulai":"YYYY-MM-DD","akhir":"YYYY-MM-DD"}`). `setPeriodeKeringanan` menulis kunci; `observeKeringanan` membaca & meng-emit.
- **Env**: hanya `VITE_FEATURE_ADMIN`, `VITE_ADMIN_TOKEN` — tanpa kredensial Firebase.

## Saluran Distribusi Global — DITUNDA (keputusan pengguna 2026-08-28 sesi 2)

Firebase Remote Config direncanakan sebelumnya (parameter `keringanan_periode`, SDK di-import dinamis) namun **dilewati dulu**. Kebutuhan distribusi ke semua pengguna belum dibangun; bila nanti dihidupkan, ia harus memakai `interface AdminService` di atas tanpa mengubah konsumen, mengikuti cadence di bawah.

## Cadence Fetch Status Keringanan (berlaku bila saluran distribusi diadakan; ditetapkan 2026-08-26)

1. Saat aplikasi dimulai (app start).
2. Saat konektivitas pulih (event `online`), jika sedang ada nilai ter-cache atau periode aktif.
3. Periodik: fetch ulang hanya jika online DAN fetch berhasil terakhir sudah > 12 jam (lastFetchKeringananAt).
4. Hasil perhitungan keringanan efektif selalu memakai evaluasi jam lokal terhadap periode ter-cache — keputusan 100% benar tanpa jaringan.

## Aturan Perilaku (dari spec clarified 2026-08-22, 2026-08-26 & sesi keputusan 2026-08-28)

| Situasi | Perilaku |
|---|---|
| Verifikasi token saat offline | DIPERBOLEHKAN — perbandingan lokal terhadap env; tidak ada auth jaringan |
| Token salah | Pesan error jelas; status admin tidak berubah; mode keringanan TIDAK berubah |
| Tetapkan periode (tanpa saluran global) | Disimpan lokal via `setPeriodeKeringanan`; distribusi ke semua pengguna belum tersedia (DITUNDA) |
| Periode mencakup hari ini | Seluruh denda → 0 (FR-012, 100% penghapusan) untuk semua pengguna yang memiliki periode tersebut |
| Tanggal akhir periode terlewati | Denda kembali normal OTOMATIS via evaluasi jam lokal — termasuk saat offline tanpa fetch baru |
| Klien offline | Hitung memakai cache periode terakhir; fungsi inti tak tersentuh |

## Batas Tanggung Jawab

- Verifikasi TIDAK memberi kemampuan write/update data tarif — satu-satunya efek adalah penetapan periode keringanan.
- `adminStore` (Pinia) hanya membungkus interface ini; komponen tidak pernah memanggil layer persistensi/vendor langsung.
- Utang teknis tercatat di plan.md Complexity Tracking; pelunasan saat fitur admin diaktifkan.

## Trade-off Keamanan yang Diterima (ditetapkan pengguna 2026-08-26)

- `VITE_ADMIN_TOKEN` ter-bundle di sisi klien (semua env `VITE_*` terekspos) — siapa pun yang membongkar bundle dapat membaca token. Diterima karena: (1) satu akun, tanpa data sensitif; (2) satu-satunya efek admin = periode keringanan denda, bukan data tarif/uang; (3) konstitusi V melarang backend. Mitigasi: rotasi token bila bocor (ubah `.env` + redeploy).
- Tambahan (2026-08-28 sesi 2): tanpa saluran distribusi global, periode yang ditetapkan admin hanya berlaku pada perangkat/browser yang menyimpan cache lokal — konsekuensi yang diketahui & diterima selama saluran masih ditunda.
