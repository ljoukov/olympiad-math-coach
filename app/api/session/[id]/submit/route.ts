import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId, type HintRung, type MoveStatus } from "@/lib/db"
import { getAIProvider } from "@/lib/ai"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const { attemptText, claims, finalConfidence } = await request.json()

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
      db.attemptClaims.push({
        id: createId(),
        attemptId: id,
        claimText: c.claimText || "",
        reasonText: c.reasonText || "",
        linkText: c.linkText || "",
        confidence: c.confidence ?? 50,
      })
    }
  }

  // Get hints used
  const hintsUsed = db.attemptHints
    .filter((h) => h.attemptId === id)
    .map((h) => h.rung as HintRung)

  // Grade
  let feedback
  try {
    const provider = getAIProvider()
    feedback = await provider.gradeAttempt(
      problem,
      attemptText || "",
      db.attemptClaims.filter((c) => c.attemptId === id),
      attempt.startConfidence,
      finalConfidence ?? 50,
      hintsUsed
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grading failed"
    console.error("Grading failed:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Update attempt
  attempt.attemptText = attemptText || ""
  attempt.finalConfidence = finalConfidence ?? 50
  attempt.submittedAt = new Date().toISOString()
  attempt.estimatedMarks = feedback.estimatedMarks
  attempt.feedbackJson = feedback as unknown as Record<string, unknown>

  // Update move states
  if (feedback.estimatedMarks >= 7) {
    for (const moveId of attempt.moveClicks) {
      let ums = db.userMoveStates.find(
        (s) => s.userId === user.id && s.moveId === moveId
      )
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
      if (attemptText) {
        ums.lastExampleText = attemptText.substring(0, 200)
      }
    }
  }

  return NextResponse.json({
    feedback,
    attemptId: id,
  })
}
