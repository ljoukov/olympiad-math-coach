import { NextResponse } from "next/server"
import {
  AssignmentSchema,
  SessionAttemptSchema,
  UserMoveStateSchema,
  UserProfileSchema,
} from "@/lib/schemas"
import { listMoves, listProblems } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import {
  adminAssignmentsPath,
  userAttemptsPath,
  userMoveStatesPath,
} from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const db = getAdminFirestore()

  const assignmentSnap = await db
    .collection(adminAssignmentsPath())
    .doc(id)
    .get()
  if (!assignmentSnap.exists)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  const assignment = AssignmentSchema.parse(assignmentSnap.data())

  const [moves, problems] = await Promise.all([listMoves(), listProblems()])
  const problemById = new Map(problems.map((p) => [p.id, p]))
  const moveById = new Map(moves.map((m) => [m.id, m]))

  const problemsForAssignment = (assignment.problemIds || [])
    .map((pid) => {
      const prob = problemById.get(pid)
      return prob
        ? {
            id: prob.id,
            title: prob.title,
            difficulty: prob.difficulty,
            statement: prob.statement,
          }
        : null
    })
    .filter(Boolean)

  // Students should not receive studentProgress payloads.
  if (user.role !== "TEACHER" || assignment.teacherId !== user.id) {
    return NextResponse.json({
      assignment,
      problems: problemsForAssignment,
      studentProgress: [],
    })
  }

  // Teacher: compute progress for all students (small-scale; optimize later if needed).
  const usersSnap = await db.collection("math-coach").get()
  const students = usersSnap.docs
    .map((d) => ({ id: d.id, profile: UserProfileSchema.parse(d.data()) }))
    .filter((u) => u.profile.role === "STUDENT")

  const assignmentProblemIds = assignment.problemIds || []

  const studentProgress = await Promise.all(
    students.map(async (s) => {
      const attemptsSnap = await db.collection(userAttemptsPath(s.id)).get()
      const attempts = attemptsSnap.docs.map((d) =>
        SessionAttemptSchema.parse(d.data())
      )

      const completedAttempts = attempts.filter(
        (a) =>
          Boolean(a.submittedAt) && assignmentProblemIds.includes(a.problemId)
      )

      const completedProblemIds = new Set(
        completedAttempts.map((a) => a.problemId)
      )
      const avgMarks =
        completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce(
                (sum, a) => sum + (a.estimatedMarks || 0),
                0
              ) / completedAttempts.length
            )
          : null

      // Weakest moves (NOT_YET)
      const moveStatesSnap = await db.collection(userMoveStatesPath(s.id)).get()
      const moveStates = moveStatesSnap.docs.map((d) =>
        UserMoveStateSchema.parse(d.data())
      )
      const weakestMoves = moveStates
        .filter((ms) => ms.status === "NOT_YET")
        .slice(0, 3)
        .map((ms) => moveById.get(ms.moveId)?.name || "")
        .filter(Boolean)

      // Calibration
      const calibratable = completedAttempts.filter(
        (a) => a.finalConfidence != null && a.estimatedMarks != null
      )
      let calibration = "N/A"
      if (calibratable.length >= 2) {
        const avgErr =
          calibratable.reduce(
            (sum, a) =>
              sum +
              Math.abs((a.finalConfidence || 0) - (a.estimatedMarks || 0) * 10),
            0
          ) / calibratable.length
        calibration = avgErr < 15 ? "Good" : avgErr < 30 ? "Okay" : "Needs work"
      }

      return {
        studentId: s.id,
        email: s.profile.email || s.id,
        completed: completedProblemIds.size,
        total: assignmentProblemIds.length,
        avgMarks,
        weakestMoves,
        calibration,
      }
    })
  )

  return NextResponse.json({
    assignment,
    problems: problemsForAssignment,
    studentProgress,
  })
}
