import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId, type HintRung, type MoveStatus } from "@/lib/db"
import { getAIProvider } from "@/lib/ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sseHeaders(): Headers {
  return new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
}

function encodeSseEvent(event: string, payload: unknown): Uint8Array {
  const data = JSON.stringify(payload)
  const lines = [`event: ${event}`, `data: ${data}`, "", ""].join("\n")
  return new TextEncoder().encode(lines)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const attemptText = (body as { attemptText?: unknown }).attemptText
  const claims = (body as { claims?: unknown }).claims
  const finalConfidence = (body as { finalConfidence?: unknown }).finalConfidence

  const db = getDb()
  const attempt = db.sessionAttempts.find((a) => a.id === id && a.userId === user.id)
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
  if (attempt.submittedAt) return NextResponse.json({ error: "Already submitted" }, { status: 400 })

  const problem = db.problems.find((p) => p.id === attempt.problemId)
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  // Save claims
  db.attemptClaims = db.attemptClaims.filter((c) => c.attemptId !== id)
  if (claims && Array.isArray(claims)) {
    for (const c of claims) {
      const claim = c as Record<string, unknown>
      db.attemptClaims.push({
        id: createId(),
        attemptId: id,
        claimText: typeof claim.claimText === "string" ? claim.claimText : "",
        reasonText: typeof claim.reasonText === "string" ? claim.reasonText : "",
        linkText: typeof claim.linkText === "string" ? claim.linkText : "",
        confidence: typeof claim.confidence === "number" ? claim.confidence : 50,
      })
    }
  }

  // Get hints used
  const hintsUsed = db.attemptHints
    .filter((h) => h.attemptId === id)
    .map((h) => h.rung as HintRung)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encodeSseEvent(event, payload))
      }

      let sentThinking = false
      let sentPreparing = false

      try {
        send("status", { stage: "processing" })

        const provider = getAIProvider()
        const feedback = await provider.gradeAttempt(
          problem,
          typeof attemptText === "string" ? attemptText : "",
          db.attemptClaims.filter((c) => c.attemptId === id),
          attempt.startConfidence,
          typeof finalConfidence === "number" ? finalConfidence : 50,
          hintsUsed,
          {
            onDelta: (delta) => {
              if (delta.thoughtDelta) {
                if (!sentThinking) {
                  sentThinking = true
                  send("status", { stage: "thinking" })
                }
                send("thought", { delta: delta.thoughtDelta })
              }
              if (delta.textDelta && !sentPreparing) {
                sentPreparing = true
                send("status", { stage: "preparing" })
              }
            },
          }
        )

        // Update attempt
        attempt.attemptText = typeof attemptText === "string" ? attemptText : ""
        attempt.finalConfidence = typeof finalConfidence === "number" ? finalConfidence : 50
        attempt.submittedAt = new Date().toISOString()
        attempt.estimatedMarks = feedback.estimatedMarks
        attempt.feedbackJson = feedback as unknown as Record<string, unknown>

        // Update move states
        if (feedback.estimatedMarks >= 7) {
          for (const moveId of attempt.moveClicks) {
            let ums = db.userMoveStates.find((s) => s.userId === user.id && s.moveId === moveId)
            if (!ums) {
              ums = {
                id: createId(),
                userId: user.id,
                moveId,
                status: "NOT_YET",
                pinned: false,
                lastExampleText: null,
              }
              db.userMoveStates.push(ums)
            }
            // Upgrade status
            const order: MoveStatus[] = ["NOT_YET", "SOMETIMES", "RELIABLE"]
            const idx = order.indexOf(ums.status)
            if (idx < order.length - 1) {
              ums.status = order[idx + 1]
            }
            // Save example
            if (typeof attemptText === "string" && attemptText) {
              ums.lastExampleText = attemptText.substring(0, 200)
            }
          }
        }

        send("done", { attemptId: id })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Grading failed"
        console.error("Submit SSE failed:", err)
        send("error", { error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
