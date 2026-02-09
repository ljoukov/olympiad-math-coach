import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const db = getDb()

  // Get user's attempts (submitted only)
  const attempts = db.sessionAttempts
    .filter((a) => a.userId === user.id && a.submittedAt)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
    .slice(0, 10)
    .map((a) => {
      const problem = db.problems.find((p) => p.id === a.problemId)
      return {
        id: a.id,
        problemTitle: problem?.title || "Unknown",
        marks: a.estimatedMarks,
        startConfidence: a.startConfidence,
        finalConfidence: a.finalConfidence,
        submittedAt: a.submittedAt,
      }
    })

  // Get move states
  const moveStates = db.userMoveStates
    .filter((s) => s.userId === user.id)
    .map((s) => {
      const move = db.moves.find((m) => m.id === s.moveId)
      return {
        moveId: s.moveId,
        moveName: move?.name || "",
        category: move?.category || "",
        whenToUse: move?.whenToUse || "",
        commonTrap: move?.commonTrap || "",
        status: s.status,
        pinned: s.pinned,
        lastExampleText: s.lastExampleText,
      }
    })

  // Ensure all moves have states
  for (const move of db.moves) {
    if (!moveStates.find((ms) => ms.moveId === move.id)) {
      moveStates.push({
        moveId: move.id,
        moveName: move.name,
        category: move.category,
        whenToUse: move.whenToUse,
        commonTrap: move.commonTrap,
        status: "NOT_YET",
        pinned: false,
        lastExampleText: null,
      })
    }
  }

  // Calibration
  let calibrationStatus = "NOT_ENOUGH_DATA"
  let avgError = 0
  const calibratable = attempts.filter(
    (a) => a.finalConfidence != null && a.marks != null
  )
  if (calibratable.length >= 3) {
    const errors = calibratable.map(
      (a) => Math.abs((a.finalConfidence || 0) - (a.marks || 0) * 10)
    )
    avgError = Math.round(errors.reduce((s, e) => s + e, 0) / errors.length)
    if (avgError < 15) calibrationStatus = "GOOD"
    else if (avgError < 30) calibrationStatus = "OKAY"
    else calibrationStatus = "NEEDS_WORK"
  }

  return NextResponse.json({
    attempts,
    moveStates,
    calibration: { status: calibrationStatus, avgError },
  })
}
