"use client"

import {
  browserLocalPersistence,
  browserSessionPersistence,
  type User as FirebaseUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  getRedirectResult,
  onIdTokenChanged,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth"
import { useRouter } from "next/navigation"
import type React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { authedFetch } from "@/lib/authed-fetch"
import { getFirebaseClient } from "@/lib/firebase/client"
import type { Persona, Role } from "@/lib/schemas"

export type AppUser = {
  id: string
  email: string | null
  role: Role
  persona: Persona | null
}

type AuthContextValue = {
  user: AppUser | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setPersona: (persona: Persona | null) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(): Promise<AppUser | null> {
  const res = await authedFetch("/api/auth/me")
  const json = (await res.json().catch(() => null)) as {
    user?: AppUser | null
  } | null
  return json?.user ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    try {
      const prof = await fetchProfile()
      setUser(prof)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : "Failed to load profile")
    }
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}

    try {
      const { auth } = getFirebaseClient()
      // Ensure any redirect-based sign-in is finalized; safe to call even when there was no redirect.
      void getRedirectResult(auth).catch(() => null)
      unsubscribe = onIdTokenChanged(auth, async (next) => {
        setFirebaseUser(next)
        setError(null)

        if (!next) {
          setUser(null)
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        try {
          const prof = await fetchProfile()
          setUser(prof)
        } catch (err) {
          setUser(null)
          setError(
            err instanceof Error ? err.message : "Failed to load profile"
          )
        } finally {
          setIsLoading(false)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Firebase init failed")
      setIsLoading(false)
    }

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { auth } = getFirebaseClient()
    try {
      await setPersistence(auth, browserLocalPersistence)
    } catch {
      await setPersistence(auth, browserSessionPersistence)
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    await signInWithRedirect(auth, provider)
  }, [])

  const signInAsGuest = useCallback(async () => {
    const { auth } = getFirebaseClient()
    await signInAnonymously(auth)
  }, [])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { auth } = getFirebaseClient()
      await signInWithEmailAndPassword(auth, email, password)
    },
    []
  )

  const signOut = useCallback(async () => {
    const { auth } = getFirebaseClient()
    await firebaseSignOut(auth)
    setUser(null)
  }, [])

  const setPersona = useCallback(
    async (persona: Persona | null) => {
      await authedFetch("/api/auth/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      })
      await refreshProfile()
    },
    [refreshProfile]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      isLoading,
      error,
      signInWithGoogle,
      signInAsGuest,
      signInWithEmail,
      signOut,
      setPersona,
      refreshProfile,
    }),
    [
      user,
      firebaseUser,
      isLoading,
      error,
      signInWithGoogle,
      signInAsGuest,
      signInWithEmail,
      signOut,
      setPersona,
      refreshProfile,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />")
  }
  return ctx
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/sign-in")
    }
  }, [isLoading, user, router])

  return { user, isLoading }
}
