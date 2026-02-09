"use client"

import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { FeedbackBreakdown } from "@/components/feedback-breakdown"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-auth"
import { authedJsonFetch } from "@/lib/authed-fetch"
import type {
  AttemptClaim,
  AttemptHint,
  Move,
  Problem,
  SessionAttempt,
} from "@/lib/schemas"

type SessionResponse = {
  attempt: SessionAttempt
  problem: Problem
  claims: AttemptClaim[]
  hints: AttemptHint[]
  moves: Move[]
}

const fetcher = (url: string) => authedJsonFetch<SessionResponse>(url)

export default function ReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { user, isLoading: authLoading } = useRequireAuth()
  const { data, isLoading } = useSWR<SessionResponse>(
    user ? `/api/session/${attemptId}` : null,
    fetcher
  )

  const attempt = data?.attempt
  const problem = data?.problem
  const feedback = attempt?.feedbackJson as {
    estimatedMarks: number
    rubricBreakdown: {
      name: string
      maxMarks: number
      awarded: number
      comment: string
    }[]
    tips: string[]
    rewrittenSolution: string
  } | null

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading review...
        </div>
      </div>
    )
  }

  if (!attempt || !problem || !feedback) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            Review not available yet. You may need to submit your solution
            first.
          </p>
          <Button variant="outline" asChild>
            <Link href={`/session/${attemptId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to session
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Feedback: {problem.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Confidence: {attempt.startConfidence}% (start) /{" "}
              {attempt.finalConfidence}% (final)
            </p>
          </div>
        </div>

        <FeedbackBreakdown
          estimatedMarks={feedback.estimatedMarks}
          rubricBreakdown={feedback.rubricBreakdown}
          tips={feedback.tips}
          rewrittenSolution={feedback.rewrittenSolution}
        />

        <div className="flex gap-3">
          <Button variant="outline" asChild className="flex-1 bg-transparent">
            <Link href="/practice">
              <ArrowLeft className="h-4 w-4 mr-2" /> More Problems
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/progress">
              <BarChart3 className="h-4 w-4 mr-2" /> View Progress
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
