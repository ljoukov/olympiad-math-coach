"use client"

import { useAuth } from "@/hooks/use-auth"
import { PersonaSelector } from "@/components/persona-selector"
import { NavHeader } from "@/components/nav-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user, isLoading, setPersona } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Auto-logged in as demo student for testing

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {"Welcome back"}
            {user?.persona ? ` (${user.persona.replace("_", " ").toLowerCase()})` : ""}
          </h1>
          <p className="text-muted-foreground">Choose what you would like to work on today.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="group cursor-pointer border-2 border-primary/20 transition-all hover:border-primary hover:shadow-md" onClick={() => router.push("/practice")}>
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Hamilton Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Work through olympiad problems with hints, claims, and feedback.</CardDescription>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary/30 hover:shadow-md" onClick={() => router.push("/progress")}>
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Track your toolbox, marks, and calibration over time.</CardDescription>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary/30 hover:shadow-md" onClick={() => router.push("/teacher")}>
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <GraduationCap className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{user?.role === "TEACHER" ? "Teacher Dashboard" : "Assignments"}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {user?.role === "TEACHER"
                  ? "Create assignments and monitor student progress."
                  : "View assignments from your teacher."}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Your Learning Persona</h2>
          <p className="text-sm text-muted-foreground">Choose how you prefer to receive guidance during problem-solving sessions.</p>
          <PersonaSelector selected={user?.persona ?? null} onSelect={(p) => setPersona(p)} />
        </div>
      </main>
    </div>
  )
}
