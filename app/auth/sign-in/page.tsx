"use client"

import { BookOpen, Chrome, User } from "lucide-react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function SignInPage() {
  const router = useRouter()
  const { user, isLoading, signInWithGoogle, signInAsGuest } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<"google" | "guest" | null>(null)

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/")
    }
  }, [isLoading, user, router])

  const handleGoogle = async () => {
    setError(null)
    setLoading("google")
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed")
    } finally {
      setLoading(null)
    }
  }

  const handleGuest = async () => {
    setError(null)
    setLoading("guest")
    try {
      await signInAsGuest()
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest sign-in failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>Choose a sign-in method to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading !== null}
          >
            <Chrome className="h-4 w-4 mr-2" />
            {loading === "google" ? "Signing in..." : "Continue with Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleGuest}
            disabled={loading !== null}
          >
            <User className="h-4 w-4 mr-2" />
            {loading === "guest" ? "Signing in..." : "Continue as Guest"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
