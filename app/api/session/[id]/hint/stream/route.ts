import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId, type HintRung } from "@/lib/db"
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

  const rung = (body as { rung?: unknown }).rung
  const stuckConfidence = (body as { stuckConfidence?: unknown }).stuckConfidence

  if (typeof rung !== "string" || !["NUDGE", "POINTER", "KEY"].includes(rung)) {
    return NextResponse.json({ error: "Invalid rung" }, { status: 400 })
  }

  const db = getDb()
  const attempt = db.sessionAttempts.find((a) => a.id === id && a.userId === user.id)
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  const problem = db.problems.find((p) => p.id === attempt.problemId)
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 })

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
          rung as HintRung,
          attempt.persona,
          typeof stuckConfidence === "number" ? stuckConfidence : undefined,
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
          rung: rung as HintRung,
          hintText,
          createdAt: new Date().toISOString(),
        }
        db.attemptHints.push(hint)

        send("done", { hint: { rung: hint.rung, hintText: hint.hintText } })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Hint generation failed"
        console.error("Hint SSE failed:", err)
        send("error", { error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

