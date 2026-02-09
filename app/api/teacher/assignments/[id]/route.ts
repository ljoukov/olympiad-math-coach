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

  const assignment = db.assignments.find((a) => a.id === id)
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const problems = db.assignmentProblems
    .filter((ap) => ap.assignmentId === id)
    .sort((x, y) => x.order - y.order)
    .map((ap) => {
      const prob = db.problems.find((p) => p.id === ap.problemId)
      return prob
        ? { id: prob.id, title: prob.title, difficulty: prob.difficulty, statement: prob.statement }
        : null
    })
    .filter(Boolean)

  // Get progress for all students
  const students = db.users.filter((u) => u.role === "STUDENT")
  const studentProgress = students.map((s) => {
    const problemIds = db.assignmentProblems
      .filter((ap) => ap.assignmentId === id)
      .map((ap) => ap.problemId)

    const completedAttempts = db.sessionAttempts.filter(
      (a) => a.userId === s.id && problemIds.includes(a.problemId) && a.submittedAt
    )

    const completedProblemIds = new Set(completedAttempts.map((a) => a.problemId))
    const avgMarks = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((s, a) => s + (a.estimatedMarks || 0), 0) / completedAttempts.length)
      : null

    // Weakest moves
    const moveStates = db.userMoveStates
      .filter((ms) => ms.userId === s.id && ms.status === "NOT_YET")
      .slice(0, 3)
      .map((ms) => db.moves.find((m) => m.id === ms.moveId)?.name || "")

    // Calibration
    const calibratable = completedAttempts.filter((a) => a.finalConfidence != null)
    let calibration = "N/A"
    if (calibratable.length >= 2) {
      const avgErr = calibratable.reduce(
        (s, a) => s + Math.abs((a.finalConfidence || 0) - (a.estimatedMarks || 0) * 10),
        0
      ) / calibratable.length
      calibration = avgErr < 15 ? "Good" : avgErr < 30 ? "Okay" : "Needs work"
    }

    return {
      studentId: s.id,
      email: s.email,
      completed: completedProblemIds.size,
      total: problemIds.length,
      avgMarks,
      weakestMoves: moveStates,
      calibration,
    }
  })

  return NextResponse.json({ assignment, problems, studentProgress })
}
