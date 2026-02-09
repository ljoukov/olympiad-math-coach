import { initializeApp } from "@ljoukov/firebase-admin-cloudflare/app"
import {
  type Firestore,
  getFirestore,
} from "@ljoukov/firebase-admin-cloudflare/firestore"

const GLOBAL_DB_KEY = "__math_coach_firestore__"

export function getAdminFirestore(): Firestore {
  const g = globalThis as unknown as Record<string, unknown>
  const cached = g[GLOBAL_DB_KEY] as Firestore | undefined
  if (cached) return cached

  // initializeApp() defaults to reading process.env.GOOGLE_SERVICE_ACCOUNT_JSON.
  // This is server-only; never import this module into client components.
  const app = initializeApp()
  const db = getFirestore(app)

  g[GLOBAL_DB_KEY] = db
  return db
}
