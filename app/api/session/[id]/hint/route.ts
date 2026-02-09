import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId, type HintRung } from "@/lib/db"
import { getAIProvider } from "@/lib/ai"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const { rung, stuckConfidence } = await request.json()

  if (!["NUDGE", "POINTER", "KEY"].includes(rung)) {
    return NextResponse.json({ error: "Invalid rung" }, { status: 400 })
  }

  const db = getDb()
  const attempt = db.sessionAttempts.find((a) => a.id === id && a.userId === user.id)
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  const problem = db.problems.find((p) => p.id === attempt.problemId)
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  let hintText = ""
  try {
    const provider = getAIProvider()
    hintText = await provider.generateHint(
      problem,
      attempt.attemptText || "",
      rung as HintRung,
      attempt.persona,
      stuckConfidence
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hint generation failed"
    console.error("Hint generation failed:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const hint = {
    id: createId(),
    attemptId: id,
    rung: rung as HintRung,
    hintText,
    createdAt: new Date().toISOString(),
  }
  db.attemptHints.push(hint)

  return NextResponse.json({ hint: { rung: hint.rung, hintText: hint.hintText } })
}
