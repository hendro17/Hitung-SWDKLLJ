import { doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { getDb, sha256Hex } from './firebase'

export interface AdminTokenDoc {
  hash: string
  label: string
  tokenRaw: string
  validFrom: string // YYYY-MM-DD
  validUntil: string // YYYY-MM-DD
  status: 'active' | 'revoked' | 'expired'
  createdAt: unknown
  createdBy: string
  revokedAt?: unknown
}

export function generateRawToken(): string {
  return `sk-${crypto.randomUUID()}`
}

export async function hashToken(raw: string): Promise<string> {
  return sha256Hex(raw.trim())
}

function isInRange(from: string, until: string, today = new Date()): boolean {
  const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return t >= parse(from) && t <= parse(until)
}

export async function verifyAdminToken(raw: string): Promise<{ valid: boolean; doc?: AdminTokenDoc }> {
  const hash = await hashToken(raw)
  const snap = await getDoc(doc(getDb(), 'admin_tokens', hash))
  if (!snap.exists()) return { valid: false }
  const data = snap.data() as AdminTokenDoc
  if (data.status !== 'active') return { valid: false, doc: data }
  if (!isInRange(data.validFrom, data.validUntil)) return { valid: false, doc: data }
  return { valid: true, doc: data }
}

export async function createAdminToken(params: { label: string; raw: string; validFrom: string; validUntil: string; createdBy: string }): Promise<string> {
  const hash = await hashToken(params.raw)
  const payload: AdminTokenDoc = {
    hash, label: params.label, tokenRaw: params.raw,
    validFrom: params.validFrom, validUntil: params.validUntil,
    status: 'active', createdAt: serverTimestamp() as unknown as Date, createdBy: params.createdBy,
  }
  await setDoc(doc(getDb(), 'admin_tokens', hash), payload as unknown as Record<string, unknown>)
  return hash
}

export async function listAdminTokens(): Promise<AdminTokenDoc[]> {
  const snap = await getDocs(collection(getDb(), 'admin_tokens'))
  return snap.docs.map((d) => d.data() as AdminTokenDoc)
}

export async function revokeAdminToken(hash: string): Promise<void> {
  await updateDoc(doc(getDb(), 'admin_tokens', hash), { status: 'revoked', revokedAt: serverTimestamp() } as unknown as Record<string, unknown>)
}
