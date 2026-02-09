import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const db = getDb()
  const attempt = db.sessionAttempts.find((a) => a.id === id && a.userId === user.id)
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  const problem = db.problems.find((p) => p.id === attempt.problemId)
  const claims = db.attemptClaims.filter((c) => c.attemptId === id)
  const hints = db.attemptHints.filter((h) => h.attemptId === id)
  const moves = db.moves

  return NextResponse.json({
    attempt,
    problem,
    claims,
    hints,
    moves,
  })
}
