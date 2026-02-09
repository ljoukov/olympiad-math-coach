import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, createId } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Teacher access required" }, { status: 403 })
  }

  const { id } = await params
  const { problemIds } = await request.json()

  const db = getDb()
  const assignment = db.assignments.find((a) => a.id === id)
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existingIds = db.assignmentProblems
    .filter((ap) => ap.assignmentId === id)
    .map((ap) => ap.problemId)

  let maxOrder = db.assignmentProblems
    .filter((ap) => ap.assignmentId === id)
    .reduce((max, ap) => Math.max(max, ap.order), 0)

  for (const pid of problemIds) {
    if (!existingIds.includes(pid)) {
      maxOrder++
      db.assignmentProblems.push({
        id: createId(),
        assignmentId: id,
        problemId: pid,
        order: maxOrder,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
