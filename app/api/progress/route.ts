import { NextResponse } from "next/server"
import { SessionAttemptSchema, UserMoveStateSchema } from "@/lib/schemas"
import { listMoves, listProblems } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import { userAttemptsPath, userMoveStatesPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const db = getAdminFirestore()

  const [attemptsSnap, moveStatesSnap, moves, problems] = await Promise.all([
    db.collection(userAttemptsPath(user.id)).get(),
    db.collection(userMoveStatesPath(user.id)).get(),
    listMoves(),
    listProblems(),
  ])

  const problemById = new Map(problems.map((p) => [p.id, p]))
  const moveById = new Map(moves.map((m) => [m.id, m]))

  // Attempts (submitted only)
  const attemptsAll = attemptsSnap.docs.map((d) =>
    SessionAttemptSchema.parse(d.data())
  )
  const submittedAttempts = attemptsAll.filter(
    (a): a is typeof a & { submittedAt: string } =>
      typeof a.submittedAt === "string" && a.submittedAt.length > 0
  )
  const attempts = submittedAttempts
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      problemTitle: problemById.get(a.problemId)?.title || "Unknown",
      marks: a.estimatedMarks,
      startConfidence: a.startConfidence,
      finalConfidence: a.finalConfidence,
      submittedAt: a.submittedAt,
    }))

  // Move states (join with move metadata)
  const storedMoveStates = moveStatesSnap.docs.map((d) =>
    UserMoveStateSchema.parse(d.data())
  )

  type MoveStateRow = {
    moveId: string
    moveName: string
    category: string
    whenToUse: string
    commonTrap: string
    status: string
    pinned: boolean
    lastExampleText: string | null
  }

  const moveStates: MoveStateRow[] = storedMoveStates
    .map((ms): MoveStateRow | null => {
      const move = moveById.get(ms.moveId)
      if (!move) return null
      return {
        moveId: ms.moveId,
        moveName: move.name,
        category: move.category,
        whenToUse: move.whenToUse,
        commonTrap: move.commonTrap,
        status: ms.status,
        pinned: ms.pinned,
        lastExampleText: ms.lastExampleText,
      }
    })
    .filter((ms): ms is MoveStateRow => ms !== null)

  // Ensure all moves have a state (default NOT_YET)
  for (const move of moves) {
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
    const errors = calibratable.map((a) =>
      Math.abs((a.finalConfidence || 0) - (a.marks || 0) * 10)
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
