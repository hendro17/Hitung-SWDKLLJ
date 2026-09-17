// adminService — facade keringanan (T052). Thin wrapper, tanpa duplikat logika.
// CRUD + snapshot tetap di keringananService; file ini tambah:
// observeKeringanan alias, lastFetch timestamp + shouldRefetch (>12h),
// setPeriodeKeringanan via updateKeringanan.
import { updateKeringanan } from './keringananService'

// Re-export kontrak keringanan langsung dari sumbernya (alias nama + cache loader).
export { observeKeringananCollection as observeKeringanan, loadKeringananCache } from './keringananService'

const LS_LAST_FETCH = 'keringanan_last_fetch'

/** Interval refetch koleksi keringanan: 12 jam (spec CHK011 / FR-012). */
export const KERINGANAN_REFETCH_MS = 12 * 60 * 60 * 1000

export function getLastFetchAt(): number | null {
  try {
    const raw = localStorage.getItem(LS_LAST_FETCH)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function setLastFetchAt(now: number = Date.now()): void {
  try {
    localStorage.setItem(LS_LAST_FETCH, String(now))
  } catch {
    /* quota / private mode — best effort */
  }
}

/** true bila belum pernah fetch atau fetch terakhir > 12 jam lalu. */
export function shouldRefetch(now: number = Date.now()): boolean {
  const last = getLastFetchAt()
  if (last === null) return true
  return now - last > KERINGANAN_REFETCH_MS
}

/** Admin-only: ubah periode doc keringanan miliknya (ownership dicek rules). */
export async function setPeriodeKeringanan(
  id: string,
  mulai: string,
  akhir: string,
  updatedBy: string,
): Promise<void> {
  await updateKeringanan(id, { mulai, akhir, updatedBy })
}

/** Dipanggil setiap snapshot sukses: catat timestamp fetch. */
export function markFetched(now: number = Date.now()): void {
  setLastFetchAt(now)
}
