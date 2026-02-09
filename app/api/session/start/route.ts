import { NextResponse } from "next/server"
import { createId } from "@/lib/id"
import { SessionAttemptSchema, StartSessionBodySchema } from "@/lib/schemas"
import { getProblem } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import { attemptDocPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = StartSessionBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { problemId, persona, startConfidence } = parsed.data

  const problem = await getProblem(problemId)
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  const attemptId = createId()
  const now = new Date().toISOString()

  const attempt = SessionAttemptSchema.parse({
    id: attemptId,
    userId: user.id,
    problemId,
    persona: persona || user.persona || "COACH",
    startedAt: now,
    submittedAt: null,
    startConfidence: startConfidence ?? 50,
    finalConfidence: null,
    attemptText: null,
    estimatedMarks: null,
    feedbackJson: null,
    moveClicks: [],
  })

  const db = getAdminFirestore()
  await db.doc(attemptDocPath(user.id, attemptId)).set(attempt)

  return NextResponse.json({ attemptId })
}
