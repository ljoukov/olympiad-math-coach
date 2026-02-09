import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId } from "@/lib/db"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const db = getDb()
  const assignments = db.assignments.filter(
    (a) => a.teacherId === user.id || user.role === "STUDENT"
  )

  return NextResponse.json({
    assignments: assignments.map((a) => {
      const problems = db.assignmentProblems
        .filter((ap) => ap.assignmentId === a.id)
        .sort((x, y) => x.order - y.order)
        .map((ap) => {
          const prob = db.problems.find((p) => p.id === ap.problemId)
          return prob ? { id: prob.id, title: prob.title, difficulty: prob.difficulty } : null
        })
        .filter(Boolean)

      return { ...a, problems }
    }),
  })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Teacher access required" }, { status: 403 })
  }

  const { title, dueAt } = await request.json()
  const db = getDb()

  const assignment = {
    id: createId(),
    teacherId: user.id,
    title: title || "New Assignment",
    dueAt: dueAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
  db.assignments.push(assignment)

  return NextResponse.json({ assignment })
}
