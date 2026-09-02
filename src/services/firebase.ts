import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

function getApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp())
    enableIndexedDbPersistence(db).catch((err: unknown) => {
      console.warn('[firebase] persistence unavailable', err) // NOSONAR - operational warning for indexedDB fallback
    })
  }
  return db
}

export function getAuthInstance(): Auth {
  if (!auth) auth = getAuth(getApp())
  return auth
}

export async function sha256Hex(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
