"use client"

import { NavHeader } from "@/components/nav-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useParams } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, ArrowRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AssignmentDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useSWR(`/api/teacher/assignments/${id}`, fetcher)

  const assignment = data?.assignment
  const problems = data?.problems || []
  const studentProgress = data?.studentProgress || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Assignment not found.</p>
          <Button variant="outline" asChild>
            <Link href="/teacher"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teacher"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground">
              Due: {new Date(assignment.dueAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Problems list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problems ({problems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {problems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No problems assigned yet.</p>
            ) : (
              problems.map((p: { id: string; title: string; difficulty: number; statement: string }) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.statement}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-primary shrink-0">
                    <Link href={`/practice/${p.id}/start`}>
                      Start <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Teacher: Student progress */}
        {user?.role === "TEACHER" && studentProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentProgress.map((s: {
                studentId: string
                email: string
                completed: number
                total: number
                avgMarks: number | null
                weakestMoves: string[]
                calibration: string
              }) => (
                <div key={s.studentId} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{s.email}</span>
                    <Badge variant="secondary">{s.completed}/{s.total} completed</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {s.avgMarks !== null && (
                      <span>Avg marks: <span className="font-semibold text-foreground">{s.avgMarks}/10</span></span>
                    )}
                    <span>Calibration: {s.calibration}</span>
                  </div>
                  {s.weakestMoves.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Weakest moves:</span>
                      {s.weakestMoves.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-red-600">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
