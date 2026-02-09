"use client"

import { getFirebaseClient } from "@/lib/firebase/client"

export async function getIdToken(): Promise<string | null> {
  const { auth } = getFirebaseClient()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  const headers = new Headers(init.headers)
  for (const [k, v] of Object.entries(authHeaders)) {
    headers.set(k, v)
  }

  return fetch(input, { ...init, headers })
}

export async function authedJsonFetch<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await authedFetch(input, init)
  const json = (await res.json().catch(() => null)) as T
  if (!res.ok) {
    const err = (json as unknown as { error?: unknown } | null)?.error
    throw new Error(
      typeof err === "string" ? err : `Request failed with HTTP ${res.status}`
    )
  }
  return json
}
