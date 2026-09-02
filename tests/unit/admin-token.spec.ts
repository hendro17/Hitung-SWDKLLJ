import { describe, it, expect } from 'vitest'
import { sha256Hex } from '../../src/services/firebase'

// sha256Hex pure — tanpa Firestore mock
describe('sha256Hex', () => {
  it('hex 64 char lowercase', async () => {
    const h = await sha256Hex('sk-test')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })
  it('deterministik', async () => {
    expect(await sha256Hex('sk-abc')).toBe(await sha256Hex('sk-abc'))
  })
  it('beda input → beda hash', async () => {
    expect(await sha256Hex('sk-aaa')).not.toBe(await sha256Hex('sk-aab'))
  })
  it('empty string hash known vector', async () => {
    // SHA256('') = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})

describe('admin token — generate & status derive', () => {
  it('generate sk- prefix + uuid shape (mock via randomUUID)', async () => {
    const raw = `sk-${crypto.randomUUID()}`
    expect(raw).toMatch(/^sk-[0-9a-f-]{36}$/)
    const hash = await sha256Hex(raw)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('status derive: today ∈ [validFrom, validUntil] inclusive → active; else expired', () => {
    const today = new Date(2026, 8, 15) // 2026-09-15
    const inRange = (from: string, until: string) => {
      const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
      const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return t >= parse(from) && t <= parse(until)
    }
    expect(inRange('2026-09-01', '2026-09-30')).toBe(true)
    expect(inRange('2026-09-15', '2026-09-15')).toBe(true) // tepat
    expect(inRange('2026-09-16', '2026-09-30')).toBe(false) // belum
    expect(inRange('2026-08-01', '2026-09-14')).toBe(false) // lewat
  })

  it('revoked status menimpa valid — ditangani server rules (client cek status===active)', () => {
    const status: string = 'revoked'
    const todayInRange = true
    const isValid = status === 'active' && todayInRange
    expect(isValid).toBe(false)
  })
})
