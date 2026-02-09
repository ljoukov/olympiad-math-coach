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

  // Save claims
  const existingClaimsSnap = await db
    .collection(attemptClaimsPath(user.id, id))
    .get()
  const writer = db.bulkWriter()
  try {
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
    const hintsSnap = await db.collection(attemptHintsPath(user.id, id)).get()
    const hintsUsed = hintsSnap.docs
      .map((d) => (d.data() as { rung?: unknown }).rung)
      .map((r) => HintRungSchema.parse(r))

    // Grade
    const provider = getAIProvider()
    let feedback: Awaited<ReturnType<typeof provider.gradeAttempt>>
    try {
      feedback = await provider.gradeAttempt(
        problem,
        attemptText || "",
        savedClaims,
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

    return NextResponse.json({
      feedback,
      attemptId: id,
    })
  } finally {
    // If grading fails, still flush any claim writes/deletes so state is predictable.
    await writer.close()
  }
}
