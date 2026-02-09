import { NextResponse } from "next/server"
import { getAIProvider } from "@/lib/ai"
import { createId } from "@/lib/id"
import {
  AttemptHintSchema,
  HintRequestBodySchema,
  SessionAttemptSchema,
} from "@/lib/schemas"
import { getProblem } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import { attemptDocPath, attemptHintsPath } from "@/lib/server/paths"
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

  const parsed = HintRequestBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { rung, stuckConfidence } = parsed.data

  const db = getAdminFirestore()
  const attemptSnap = await db.doc(attemptDocPath(user.id, id)).get()
  if (!attemptSnap.exists)
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
  const attempt = SessionAttemptSchema.parse(attemptSnap.data())

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

      try {
        send("status", { stage: "processing" })

        const provider = getAIProvider()
        const hintText = await provider.generateHint(
          problem,
          attempt.attemptText || "",
          rung,
          attempt.persona,
          stuckConfidence,
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

        const hint = {
          id: createId(),
          attemptId: id,
          rung,
          hintText,
          createdAt: new Date().toISOString(),
        }
        const validated = AttemptHintSchema.parse(hint)
        await db
          .collection(attemptHintsPath(user.id, id))
          .doc(validated.id)
          .set(validated)

        send("done", { hint: { rung: hint.rung, hintText: hint.hintText } })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Hint generation failed"
        console.error("Hint SSE failed:", err)
        send("error", { error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
