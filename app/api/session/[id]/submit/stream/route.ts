import { NextResponse } from "next/server"
import { getAIProvider } from "@/lib/ai"
import { createId } from "@/lib/id"
import {
  AttemptClaimSchema,
  HintRungSchema,
  MoveStatusSchema,
  SessionAttemptSchema,
  SubmitAttemptBodySchema,
  UserMoveStateSchema,
} from "@/lib/schemas"
import { getProblem } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import {
  attemptClaimsPath,
  attemptDocPath,
  attemptHintsPath,
  userMoveStatesPath,
} from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

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
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = SubmitAttemptBodySchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { attemptText, claims, finalConfidence } = parsedBody.data

  const db = getAdminFirestore()
  const attemptRef = db.doc(attemptDocPath(user.id, id))
  const attemptSnap = await attemptRef.get()
  if (!attemptSnap.exists)
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
  const attempt = SessionAttemptSchema.parse(attemptSnap.data())
  if (attempt.submittedAt)
    return NextResponse.json({ error: "Already submitted" }, { status: 400 })

  const problem = await getProblem(attempt.problemId)
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encodeSseEvent(event, payload))
      }

      let sentThinking = false
      let sentPreparing = false

      const writer = db.bulkWriter()
      let writerClosed = false

      try {
        send("status", { stage: "processing" })

        // Save claims (replace all existing)
        const existingClaimsSnap = await db
          .collection(attemptClaimsPath(user.id, id))
          .get()
        for (const doc of existingClaimsSnap.docs) {
          void writer.delete(doc.ref)
        }

        const savedClaims = (claims ?? []).map((c) =>
          AttemptClaimSchema.parse({
            id: createId(),
            attemptId: id,
            claimText: c.claimText,
            reasonText: c.reasonText,
            linkText: c.linkText,
            confidence: c.confidence,
          })
        )

        for (const claim of savedClaims) {
          void writer.set(
            db.collection(attemptClaimsPath(user.id, id)).doc(claim.id),
            claim
          )
        }

        // Get hints used
        const hintsSnap = await db
          .collection(attemptHintsPath(user.id, id))
          .get()
        const hintsUsed = hintsSnap.docs
          .map((d) => (d.data() as { rung?: unknown }).rung)
          .map((r) => HintRungSchema.parse(r))

        const provider = getAIProvider()
        const feedback = await provider.gradeAttempt(
          problem,
          attemptText || "",
          savedClaims,
          attempt.startConfidence,
          finalConfidence ?? 50,
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
        const submittedAt = new Date().toISOString()
        const updatedAttempt = SessionAttemptSchema.parse({
          ...attempt,
          attemptText: attemptText || "",
          finalConfidence: finalConfidence ?? 50,
          submittedAt,
          estimatedMarks: feedback.estimatedMarks,
          feedbackJson: feedback as unknown as Record<string, unknown>,
        })
        void writer.set(attemptRef, updatedAttempt)

        // Update move states
        if (feedback.estimatedMarks >= 7) {
          const order = MoveStatusSchema.options

          for (const moveId of updatedAttempt.moveClicks) {
            const ref = db.doc(`${userMoveStatesPath(user.id)}/${moveId}`)
            const snap = await ref.get()
            const existing = snap.exists
              ? UserMoveStateSchema.parse(snap.data())
              : UserMoveStateSchema.parse({
                  moveId,
                  status: "NOT_YET",
                  pinned: false,
                  lastExampleText: null,
                })

            const idx = order.indexOf(existing.status)
            const nextStatus =
              idx === -1 || idx >= order.length - 1
                ? existing.status
                : order[idx + 1]

            const next = UserMoveStateSchema.parse({
              ...existing,
              moveId,
              status: nextStatus,
              lastExampleText: attemptText
                ? attemptText.substring(0, 200)
                : existing.lastExampleText,
            })
            void writer.set(ref, next)
          }
        }

        await writer.close()
        writerClosed = true

        send("done", { attemptId: id })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Grading failed"
        console.error("Submit SSE failed:", err)
        send("error", { error: message })
      } finally {
        if (!writerClosed) {
          // Ensure any claim writes/deletes are flushed even if grading fails.
          try {
            await writer.close()
          } catch (err) {
            console.error("BulkWriter close failed:", err)
          }
        }
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
