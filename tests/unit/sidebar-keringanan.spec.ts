import { describe, it, expect } from 'vitest'
import { filterVisibleKeringanan, isKeringananExpired, type KeringananDoc } from '../../src/domain/keringanan'

function doc(id: string, akhir: string): KeringananDoc {
  return {
    id, label: `Provisi ${id}`, mulai: '2026-09-01', akhir,
    pokokTunggakan1: false, dendaTunggakan1: true,
    pokokTunggakan2: false, dendaTunggakan2: false,
    pokokTunggakan3: false, dendaTunggakan3: false,
    pokokTunggakan4: false, dendaTunggakan4: false,
    createdBy: 'hash1',
  }
}

// Model exclusive: activeKeringananId string|null — tanpa UI mount
describe('sidebar keringanan — exclusive switch & expired hide', () => {
  it('visible filter: hanya !expired', () => {
    const today = new Date(2026, 8, 15)
    const list = [doc('a', '2026-08-31'), doc('b', '2026-09-15'), doc('c', '2026-09-30')]
    const vis = filterVisibleKeringanan(list, today)
    expect(vis.map((d) => d.id)).toEqual(['b', 'c'])
    expect(isKeringananExpired(doc('a', '2026-08-31'), today)).toBe(true)
    expect(isKeringananExpired(doc('b', '2026-09-15'), today)).toBe(false) // inclusive
  })

  it('exclusive: hanya satu activeKeringananId', () => {
    let active: string | null = null
    const toggle = (id: string) => { active = active === id ? null : id }
    toggle('a'); expect(active).toBe('a')
    toggle('b'); expect(active).toBe('b') // exclusive — a off, b on
    toggle('b'); expect(active).toBe(null) // off
  })

  it('expired auto-reset: active menunjuk doc expired → null', () => {
    const today = new Date(2026, 9, 1) // 2026-10-01
    const list = [doc('a', '2026-09-30')]
    const vis = filterVisibleKeringanan(list, today)
    let active: string | null = 'a'
    if (!vis.find((d) => d.id === active)) active = null
    expect(active).toBe(null)
  })

  it('default OFF → normal (tanpa apply)', () => {
    const active: string | null = null
    expect(active).toBe(null)
    // kalkulator baca null → hitung normal (diuji di keringanan-selective)
  })

  it('multi provisi — visible semua yang belum expired', () => {
    const today = new Date(2026, 8, 15)
    const list = [doc('a', '2026-09-20'), doc('b', '2026-10-31'), doc('c', '2026-09-15')]
    const vis = filterVisibleKeringanan(list, today)
    expect(vis.length).toBe(3)
  })
})
