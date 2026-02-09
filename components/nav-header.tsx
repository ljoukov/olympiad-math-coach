"use client"

import { BarChart3, BookOpen, GraduationCap, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export function NavHeader() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary font-bold text-lg"
        >
          <BookOpen className="h-5 w-5" />
          <span>Hamilton Practice</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/practice" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Practice</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/progress" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </Link>
          </Button>
          {user.role === "TEACHER" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher" className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Teacher</span>
              </Link>
            </Button>
          )}
          <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
            <span className="text-sm text-muted-foreground">
              {user.email || "Guest"}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
