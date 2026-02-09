"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher)

  // Default demo user for testing (no sign-in required)
  const defaultUser = {
    id: "student_001",
    email: "student@hamilton.dev",
    role: "STUDENT" as const,
    persona: "COACH" as string | null,
  }
  const user = data?.user || (isLoading ? null : defaultUser)

  const signIn = async (email: string, password: string) => {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    await mutate()
    return json.user
  }

  const signUp = async (email: string, password: string, role: string = "STUDENT") => {
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    await mutate()
    return json.user
  }

  const signOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" })
    await mutate()
  }

  const setPersona = async (persona: string) => {
    await fetch("/api/auth/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    })
    await mutate()
  }

  return { user, isLoading, error, signIn, signUp, signOut, setPersona }
}
