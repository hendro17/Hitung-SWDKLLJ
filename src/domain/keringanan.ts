// domain/keringanan — selective keringanan per-slot (plan Extension 2026-09-01). Murni: tanpa import Vue/Pinia/Firebase.
import type { HasilPerhitungan } from './types'

export interface KeringananDoc {
  id: string
  label: string
  mulai: string // YYYY-MM-DD inclusive local
  akhir: string // YYYY-MM-DD inclusive local
  pokokTunggakan1: boolean
  dendaTunggakan1: boolean
  pokokTunggakan2: boolean
  dendaTunggakan2: boolean
  pokokTunggakan3: boolean
  dendaTunggakan3: boolean
  pokokTunggakan4: boolean
  dendaTunggakan4: boolean
  createdBy: string
  updatedAt?: unknown
  updatedBy?: string
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayLocalMidnight(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** isKeringananAktif — true bila todayLocal ∈ [mulai, akhir] inclusive */
export function isKeringananAktif(doc: Pick<KeringananDoc, 'mulai' | 'akhir'>, today: Date = new Date()): boolean {
  const t = todayLocalMidnight(today)
  const a = parseLocalDate(doc.mulai)
  const b = parseLocalDate(doc.akhir)
  return t >= a && t <= b
}

/** isExpired — true bila today > akhir */
export function isKeringananExpired(doc: Pick<KeringananDoc, 'akhir'>, today: Date = new Date()): boolean {
  return todayLocalMidnight(today) > parseLocalDate(doc.akhir)
}

/** applyKeringananSelective — nol-kan slot yang flag true; lain tetap */
export function applyKeringananSelective(hasil: HasilPerhitungan, doc: KeringananDoc | null): HasilPerhitungan {
  if (!doc || !isKeringananAktif(doc)) return hasil
  const r = { ...hasil }
  type SlotHasil =
    | 'pokokTunggakan1' | 'dendaTunggakan1'
    | 'pokokTunggakan2' | 'dendaTunggakan2'
    | 'pokokTunggakan3' | 'dendaTunggakan3'
    | 'pokokTunggakan4' | 'dendaTunggakan4'
  const slots: Array<[keyof KeringananDoc, SlotHasil]> = [
    ['pokokTunggakan1', 'pokokTunggakan1'],
    ['dendaTunggakan1', 'dendaTunggakan1'],
    ['pokokTunggakan2', 'pokokTunggakan2'],
    ['dendaTunggakan2', 'dendaTunggakan2'],
    ['pokokTunggakan3', 'pokokTunggakan3'],
    ['dendaTunggakan3', 'dendaTunggakan3'],
    ['pokokTunggakan4', 'pokokTunggakan4'],
    ['dendaTunggakan4', 'dendaTunggakan4']
  ]
  let changed = false
  for (const [flag, slot] of slots) {
    if (doc[flag] === true) {
      r[slot] = 0
      changed = true
    }
  }
  // dendaBerjalan tidak termasuk selective 8 bool — tetap normal (semua denda lama dihapus; kini per-slot)
  if (changed) {
    r.keringananDiterapkan = true
    r.totalPremi =
      r.pokokBerjalan + r.dendaBerjalan + r.pokokTunggakan1 + r.dendaTunggakan1 + r.pokokTunggakan2 + r.dendaTunggakan2 +
      r.pokokTunggakan3 + r.dendaTunggakan3 + r.pokokTunggakan4 + r.dendaTunggakan4 + r.pokokProrata
    // lunas status tetap 0
    if (r.status === 'lunas') r.totalPremi = 0
  }
  return r
}

/** visibleKeringananList — filter !expired */
export function filterVisibleKeringanan(list: KeringananDoc[], today: Date = new Date()): KeringananDoc[] {
  return list.filter((d) => !isKeringananExpired(d, today))
}
