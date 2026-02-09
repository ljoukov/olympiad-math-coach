import { cookies } from "next/headers"
import { getDb, hashPassword, type User } from "./db"

const SESSION_COOKIE = "hamilton_session"

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  const db = getDb()
  if (sessionId) {
    return db.users.find((u) => u.id === sessionId) || null
  }
  // Auto-login as demo student for testing
  return db.users.find((u) => u.id === "student_001") || null
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function authenticateUser(email: string, password: string): User | null {
  const db = getDb()
  const hash = hashPassword(password)
  const user = db.users.find((u) => u.email === email && u.passwordHash === hash)
  return user || null
}

export function createUser(email: string, password: string, role: "STUDENT" | "TEACHER"): User | null {
  const db = getDb()
  if (db.users.find((u) => u.email === email)) return null
  const user: User = {
    id: Math.random().toString(36).substring(2, 15),
    email,
    passwordHash: hashPassword(password),
    role,
    persona: null,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  return user
}
