"use client"

import { useState } from "react"
import useSWR from "swr"
import { NavHeader } from "@/components/nav-header"
import { ProblemCard } from "@/components/problem-card"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-auth"
import { authedJsonFetch } from "@/lib/authed-fetch"

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

export default function PracticePage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const [topic, setTopic] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)

  const params = new URLSearchParams()
  if (topic) params.set("topic", topic)
  if (difficulty) params.set("difficulty", String(difficulty))

  const { data, isLoading } = useSWR<ProblemsResponse>(
    user ? `/api/problems?${params.toString()}` : null,
    fetcher
  )
  const problems = data?.problems || []

  const allTopics = [
    "number-theory",
    "algebra",
    "combinatorics",
    "geometry",
    "proof",
    "inequalities",
    "graph-theory",
    "induction",
  ]
  const difficulties = [1, 2, 3, 4, 5]
  const diffLabel = ["", "Easy", "Medium", "Challenging", "Hard", "Expert"]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Hamilton Practice
          </h1>
          <p className="text-muted-foreground">
            Choose a problem and start solving. Use moves, claims, and hints
            along the way.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">Topic:</span>
            <Button
              variant={topic === null ? "default" : "outline"}
              size="sm"
              onClick={() => setTopic(null)}
            >
              All
            </Button>
            {allTopics.map((t) => (
              <Button
                key={t}
                variant={topic === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTopic(t === topic ? null : t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Difficulty:
            </span>
            <Button
              variant={difficulty === null ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(null)}
            >
              All
            </Button>
            {difficulties.map((d) => (
              <Button
                key={d}
                variant={difficulty === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(d === difficulty ? null : d)}
              >
                {diffLabel[d]}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading problems...
          </div>
        ) : problems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No problems found with current filters.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p) => (
              <ProblemCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
