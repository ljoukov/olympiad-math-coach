"use client"

import { NavHeader } from "@/components/nav-header"
import { MovesPanel } from "@/components/moves-panel"
import { HintLadder } from "@/components/hint-ladder"
import { ClaimBuilder, type Claim } from "@/components/claim-builder"
import { ConfidenceSlider } from "@/components/confidence-slider"
import { LlmStreamStatus, type LlmUiStage } from "@/components/llm-stream-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { fetchSse } from "@/lib/sse"
import { useRouter, useParams } from "next/navigation"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { Send } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SessionPage() {
  const router = useRouter()
  const { attemptId } = useParams<{ attemptId: string }>()
  const { data, isLoading, mutate } = useSWR(`/api/session/${attemptId}`, fetcher)

  const [attemptText, setAttemptText] = useState("")
  const [claims, setClaims] = useState<Claim[]>([])
  const [finalConfidence, setFinalConfidence] = useState(50)
  const [showClaims, setShowClaims] = useState(false)
  const [clickedMoves, setClickedMoves] = useState<string[]>([])
  const [hints, setHints] = useState<{ rung: string; hintText: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitStage, setSubmitStage] = useState<LlmUiStage>("idle")
  const [submitThinking, setSubmitThinking] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const attempt = data?.attempt
  const problem = data?.problem
  const moves = data?.moves || []

  const handleMoveClick = useCallback(async (moveId: string) => {
    if (!clickedMoves.includes(moveId)) {
      setClickedMoves((prev) => [...prev, moveId])
    }
    await fetch(`/api/session/${attemptId}/move-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moveId }),
    })
  }, [attemptId, clickedMoves])

  const handleHintReceived = useCallback((hint: { rung: string; hintText: string }) => {
    setHints((prev) => [...prev, hint])
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitStage("connecting")
    setSubmitThinking("")
    setSubmitError(null)

    try {
      await fetchSse(
        `/api/session/${attemptId}/submit/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptText,
            claims,
            finalConfidence,
          }),
        },
        {
          onEvent: (event, data) => {
            try {
              const payload = JSON.parse(data) as Record<string, unknown>

              if (event === "status") {
                const stage = String(payload.stage || "")
                if (stage === "processing") setSubmitStage("processing")
                else if (stage === "thinking") setSubmitStage("thinking")
                else if (stage === "preparing") setSubmitStage("preparing")
                return
              }

              if (event === "thought") {
                const delta = String(payload.delta || "")
                if (delta) {
                  setSubmitStage((prev) => (prev === "preparing" ? prev : "thinking"))
                  setSubmitThinking((prev) => prev + delta)
                }
                return
              }

              if (event === "done") {
                const gotId = payload.attemptId
                if (typeof gotId === "string" && gotId.length > 0) {
                  setSubmitThinking("")
                  setSubmitError(null)
                  setSubmitStage("idle")
                  router.push(`/session/${gotId}/review`)
                } else {
                  toast.error("Submit failed")
                }
                return
              }

              if (event === "error") {
                const msg = String(payload.error || "Submit failed")
                setSubmitStage("error")
                setSubmitError(msg)
                toast.error(msg)
                return
              }
            } catch {
              // ignore malformed events
            }
          },
        }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed"
      setSubmitStage("error")
      setSubmitError(msg)
      toast.error(msg)
    }

    setSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading session...</div>
      </div>
    )
  }

  if (!attempt || !problem) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Session not found.</div>
      </div>
    )
  }

  if (attempt.submittedAt) {
    router.push(`/session/${attemptId}/review`)
    return null
  }

  const personaGreeting: Record<string, string> = {
    COACH: "Take your time. Read the problem carefully, then restate what is being asked in your own words.",
    QUIZ_MASTER: "First, can you identify what type of problem this is? What tools might apply?",
    RIVAL: "Let us see what you can do. Restate the problem precisely before you begin.",
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm text-primary font-medium">
            {personaGreeting[attempt.persona] || personaGreeting.COACH}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Student workspace */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{problem.statement}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">My Attempt</Label>
              <Textarea
                value={attemptText}
                onChange={(e) => setAttemptText(e.target.value)}
                placeholder="Write your solution here. Use clear mathematical reasoning with statements like 'Let n = ...', 'Therefore ...', etc."
                className="min-h-[240px] font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClaims(!showClaims)}
              >
                {showClaims ? "Hide" : "Show"} Claim Builder
              </Button>
              {showClaims && (
                <ClaimBuilder claims={claims} onChange={setClaims} />
              )}
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <ConfidenceSlider
                value={finalConfidence}
                onChange={setFinalConfidence}
                label="How confident are you in your final solution?"
              />
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || attemptText.trim().length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Solution"}
              </Button>

              <LlmStreamStatus stage={submitStage} thinkingMarkdown={submitThinking} error={submitError} />
            </div>
          </div>

          {/* Right: Guidance panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <MovesPanel
                  moves={moves}
                  suggestedMoveIds={problem.movesSuggested || []}
                  pinnedMoveIds={[]}
                  clickedMoveIds={clickedMoves}
                  onMoveClick={handleMoveClick}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hints</CardTitle>
              </CardHeader>
              <CardContent>
                <HintLadder
                  attemptId={attemptId}
                  hints={hints}
                  onHintReceived={handleHintReceived}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
