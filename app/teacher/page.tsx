"use client"

import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { NavHeader } from "@/components/nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRequireAuth } from "@/hooks/use-auth"
import { authedJsonFetch } from "@/lib/authed-fetch"

type AssignmentListItem = {
  id: string
  title: string
  dueAt: string
  problems: { id: string; title: string; difficulty: number }[]
}

type TeacherAssignmentsResponse = {
  assignments: AssignmentListItem[]
}

const fetcher = (url: string) =>
  authedJsonFetch<TeacherAssignmentsResponse>(url)

export default function TeacherPage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const { data, isLoading } = useSWR<TeacherAssignmentsResponse>(
    user ? "/api/teacher/assignments" : null,
    fetcher
  )

  const assignments = data?.assignments || []

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === "TEACHER" ? "Teacher Dashboard" : "Assignments"}
            </h1>
            <p className="text-muted-foreground">
              {user?.role === "TEACHER"
                ? "Manage assignments and monitor student progress."
                : "View assignments from your teacher."}
            </p>
          </div>
          {user?.role === "TEACHER" && (
            <Button asChild>
              <Link href="/teacher/assignments/new">
                <Plus className="h-4 w-4 mr-2" /> New Assignment
              </Link>
            </Button>
          )}
        </div>

        {authLoading || isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No assignments yet.</p>
              {user?.role === "TEACHER" && (
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  asChild
                >
                  <Link href="/teacher/assignments/new">
                    Create your first assignment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map((a) => (
              <Card
                key={a.id}
                className="hover:border-primary/30 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Due: {new Date(a.dueAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {a.problems.length} problem
                      {a.problems.length !== 1 ? "s" : ""}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-primary"
                    >
                      <Link href={`/teacher/assignments/${a.id}`}>
                        View <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
