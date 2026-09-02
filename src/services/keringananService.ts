import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDoc, type Unsubscribe } from 'firebase/firestore'
import { getDb } from './firebase'
import type { KeringananDoc } from '../domain/keringanan'

const COLL = 'keringanan'

export function keringananDocId(): string {
  return crypto.randomUUID()
}

export async function getKeringanan(id: string): Promise<KeringananDoc | null> {
  const snap = await getDoc(doc(getDb(), COLL, id))
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<KeringananDoc, 'id'>) }) as KeringananDoc : null
}

export async function upsertKeringanan(input: Omit<KeringananDoc, 'createdBy' | 'updatedAt' | 'updatedBy'> & { createdBy: string }): Promise<void> {
  const id = input.id || keringananDocId()
  const payload = {
    ...input,
    id,
    updatedAt: serverTimestamp(),
    updatedBy: input.createdBy,
  }
  await setDoc(doc(getDb(), COLL, id), payload as unknown as Record<string, unknown>, { merge: true })
}

export async function updateKeringanan(id: string, patch: Partial<Omit<KeringananDoc, 'id' | 'createdBy'>> & { updatedBy: string }): Promise<void> {
  const existing = await getKeringanan(id)
  const payload: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() }
  if (existing) payload.createdBy = existing.createdBy
  await setDoc(doc(getDb(), COLL, id), payload as Record<string, unknown>, { merge: true })
}

export async function deleteKeringanan(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLL, id))
}

export function observeKeringananCollection(cb: (list: KeringananDoc[]) => void): Unsubscribe {
  return onSnapshot(collection(getDb(), COLL), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<KeringananDoc, 'id'>) }) as KeringananDoc)
    try { localStorage.setItem('keringanan_list', JSON.stringify(list)) } catch {}
    cb(list)
  })
}

export function loadKeringananCache(): KeringananDoc[] {
  try {
    const raw = localStorage.getItem('keringanan_list')
    return raw ? JSON.parse(raw) as KeringananDoc[] : []
  } catch { return [] }
}
