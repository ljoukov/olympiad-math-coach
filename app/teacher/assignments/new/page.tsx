"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRequireAuth } from "@/hooks/use-auth"
import { authedFetch, authedJsonFetch } from "@/lib/authed-fetch"

type ProblemListItem = {
  id: string
  title: string
  statement: string
  topicTags: string[]
  difficulty: number
  movesSuggested: string[]
}

type ProblemsResponse = {
  problems: ProblemListItem[]
}

const fetcher = (url: string) => authedJsonFetch<ProblemsResponse>(url)

export default function NewAssignmentPage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const router = useRouter()
  const { data } = useSWR<ProblemsResponse>(
    user ? "/api/problems" : null,
    fetcher
  )
  const problems = data?.problems || []

  const [title, setTitle] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </div>
    )
  }

  if (user && user.role !== "TEACHER") {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Teacher access required.
        </div>
      </div>
    )
  }

  const toggleProblem = (id: string) => {
    setSelectedProblems((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!user || user.role !== "TEACHER") {
      toast.error("Teacher access required")
      return
    }
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    setCreating(true)

    const res = await authedFetch("/api/teacher/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dueAt:
          dueAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    })
    const json = await res.json()

    if (json.assignment && selectedProblems.length > 0) {
      await authedFetch(
        `/api/teacher/assignments/${json.assignment.id}/problems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemIds: selectedProblems }),
        }
      )
    }

    toast.success("Assignment created")
    router.push("/teacher")
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">New Assignment</h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week 3 - Number Theory"
            />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Select Problems</Label>
          <div className="grid gap-2">
            {problems.map(
              (p: {
                id: string
                title: string
                difficulty: number
                topicTags: string[]
              }) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-colors ${selectedProblems.includes(p.id) ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => toggleProblem(p.id)}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Checkbox checked={selectedProblems.includes(p.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {p.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Difficulty: {p.difficulty} | {p.topicTags.join(", ")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleCreate}
          disabled={creating}
          className="w-full"
        >
          {creating
            ? "Creating..."
            : `Create Assignment (${selectedProblems.length} problems)`}
        </Button>
      </main>
    </div>
  )
}
