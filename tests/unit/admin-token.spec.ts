import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args: unknown[]) => ({ args })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn((...args: unknown[]) => ({ args })),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => 'TS'),
}))

vi.mock('../../src/services/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/firebase')>()
  return { ...actual, getDb: vi.fn(() => ({})) }
})

import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { sha256Hex } from '../../src/services/firebase'
import {
  generateRawToken,
  hashToken,
  verifyAdminToken,
  createAdminToken,
  listAdminTokens,
  revokeAdminToken,
  deleteAdminToken,
} from '../../src/services/adminTokenService'

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
    const isValid = (status: string, todayInRange: boolean) => status === 'active' && todayInRange
    expect(isValid('revoked', true)).toBe(false)
    expect(isValid('active', true)).toBe(true)
  })

  it('generateRawToken → sk- + UUIDv4 shape', () => {
    expect(generateRawToken()).toMatch(/^sk-[0-9a-f-]{36}$/)
  })

  it('hashToken trim input sebelum hash', async () => {
    expect(await hashToken('  sk-abc  ')).toBe(await sha256Hex('sk-abc'))
  })
})

describe('admin token service — Firestore mocked', () => {
  beforeEach(() => vi.clearAllMocks())

  const activeDoc = {
    hash: 'h', label: 'Admin A', tokenRaw: 'sk-raw',
    validFrom: '2020-01-01', validUntil: '2099-12-31',
    status: 'active' as const, createdAt: 'TS', createdBy: 'u1',
  }

  it('verify valid hanya active && today ∈ [validFrom,validUntil]', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => activeDoc } as never)
    const r = await verifyAdminToken('sk-raw')
    expect(r.valid).toBe(true)
    expect(r.doc?.tokenRaw).toBe('sk-raw') // copy raw anytime
  })

  it('verify reject bila missing / revoked / expired', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    expect((await verifyAdminToken('sk-x')).valid).toBe(false)
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ ...activeDoc, status: 'revoked' }) } as never)
    expect((await verifyAdminToken('sk-raw')).valid).toBe(false)
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ ...activeDoc, validUntil: '2020-01-02' }) } as never)
    expect((await verifyAdminToken('sk-raw')).valid).toBe(false)
  })

  it('create simpan hash + tokenRaw + status active; list/revoke panggil Firestore', async () => {
    vi.mocked(setDoc).mockResolvedValue(undefined as never)
    const hash = await createAdminToken({ label: 'L', raw: 'sk-abc', validFrom: '2026-09-01', validUntil: '2026-09-30', createdBy: 'u1' })
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(vi.mocked(setDoc)).toHaveBeenCalledOnce()
    const payload = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>
    expect(payload['tokenRaw']).toBe('sk-abc')
    expect(payload['status']).toBe('active')

    vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => activeDoc }] } as never)
    expect((await listAdminTokens())[0].label).toBe('Admin A')

    vi.mocked(updateDoc).mockResolvedValue(undefined as never)
    await revokeAdminToken('h')
    expect(vi.mocked(updateDoc)).toHaveBeenCalledOnce()
    expect((vi.mocked(updateDoc).mock.calls[0][1] as Record<string, unknown>)['status']).toBe('revoked')
    expect(vi.mocked(doc)).toBeDefined()
  })

  it('delete panggil deleteDoc doc db admin_tokens hash, resolves void', async () => {
    vi.mocked(deleteDoc).mockResolvedValue(undefined as never)
    await expect(deleteAdminToken('h')).resolves.toBeUndefined()
    expect(vi.mocked(deleteDoc)).toHaveBeenCalledOnce()
    const ref = vi.mocked(doc).mock.calls[0]
    expect(ref[1]).toBe('admin_tokens')
    expect(ref[2]).toBe('h')
  })
})
