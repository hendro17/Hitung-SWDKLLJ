# Kontrak: Scaffolding Admin Service (`src/services/adminService.ts`)

Status: **scaffolding** (FR-011/FR-012) — dinonaktifkan rilis awal via feature flag `VITE_FEATURE_ADMIN=false`. Rute `/admin` hanya terdaftar saat flag aktif.

## Interface (vendor-agnostic)

```ts
export interface AdminService {
  /** Login HANYA dieksekusi saat navigator.onLine === true.
   *  Offline → throw AdminOfflineError tanpa percobaan autentikasi lokal.
   *  Kredensial salah → throw AdminAuthError (pesan jelas, tidak ada perubahan mode). */
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  readonly isAuthenticated(): boolean
  /** Observe status keringanan global: nilai Remote Config saat online,
   *  cache localStorage terakhir saat offline. */
  observeKeringanan(cb: (aktif: boolean) => void): () => void
  /** Admin-only: tulis status keringanan global (broadcast). */
  setKeringanan(aktif: boolean): Promise<void>
}
```

## Implementasi Referensi: Firebase

- **Auth**: Firebase Auth email/password; aturan keamanan membatasi akun admin (daftar allowlist UID). SDK di-import dinamis (`import()`) agar bundle publik bebas kode admin/jaringan dan jalur offline tak memuatnya.
- **Remote Config**: parameter boolean `keringanan_aktif` (default `false`). Admin toggle → `setKeringanan` menulis parameter; klien lain membacanya saat app start / fetch ulang ketika kembali online; nilai terakhir disimpan localStorage sehingga mode offline memakai status terakhir yang diketahui.
- **Env**: `VITE_FEATURE_ADMIN`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (nilai nyata hanya di `.env` lokal/CI — tidak pernah dikomit; `.env.example` berisi placeholder).

## Aturan Perilaku (dari spec clarified 2026-08-22)

| Situasi | Perilaku |
|---|---|
| Login saat offline | Blokir penuh, pesan **"Login admin memerlukan koneksi internet"**, tanpa percobaan auth lokal |
| Login kredensial salah | Pesan error jelas; mode keringanan TIDAK berubah |
| Toggle keringanan ON | Broadcast global (Remote Config); semua klien online mengambil nilai; perhitungan berikutnya: seluruh denda → 0 (FR-012, 100% penghapusan) |
| Logout / toggle OFF | Denda kembali normal |
| Klien offline | Hitung memakai nilai cache terakhir; fungsi inti tak tersentuh |

## Batas Tanggung Jawab

- Login TIDAK memberi kemampuan write/update data tarif — satu-satunya efek adalah status keringanan.
- `adminStore` (Pinia) hanya membungkus interface ini; komponen tidak pernah memanggil Firebase langsung.
- Utang teknis tercatat di plan.md Complexity Tracking; pelunasan saat fitur admin diaktifkan (audit aturan keamanan + rotasi kredensial).
