import { type Persona, type Role, UserProfileSchema } from "@/lib/schemas"
import { getBearerToken, verifyFirebaseIdToken } from "./firebase-id-token"
import { getAdminFirestore } from "./firestore"

export type AuthedUser = {
  id: string
  email: string | null
  role: Role
  persona: Persona | null
}

export async function getUserFromRequest(
  request: Request
): Promise<AuthedUser | null> {
  const token = getBearerToken(request)
  if (!token) return null

  let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>
  try {
    decoded = await verifyFirebaseIdToken(token)
  } catch {
    return null
  }

  const db = getAdminFirestore()
  const ref = db.doc(`math-coach/${decoded.uid}`)
  const snap = await ref.get()
  const now = new Date().toISOString()

  if (!snap.exists) {
    const created = UserProfileSchema.parse({
      email: decoded.email,
      role: "STUDENT",
      persona: "COACH",
      createdAt: now,
    })
    await ref.set(created)
    return { id: decoded.uid, ...created }
  }

  let parsed = UserProfileSchema.parse(snap.data())

  // Keep email in sync for Google sign-in users.
  if (decoded.email && parsed.email !== decoded.email) {
    await ref.set({ email: decoded.email }, { merge: true })
    parsed = { ...parsed, email: decoded.email }
  }

  return { id: decoded.uid, ...parsed }
}
