import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId, type Persona } from "@/lib/db"

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { problemId, persona, startConfidence } = await request.json()

  const db = getDb()
  const problem = db.problems.find((p) => p.id === problemId)
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  const attemptId = createId()
  db.sessionAttempts.push({
    id: attemptId,
    userId: user.id,
    problemId,
    persona: (persona || user.persona || "COACH") as Persona,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    startConfidence: startConfidence ?? 50,
    finalConfidence: null,
    attemptText: null,
    estimatedMarks: null,
    feedbackJson: null,
    moveClicks: [],
  })

  return NextResponse.json({ attemptId })
}
