import { NextResponse } from "next/server"
import { createId } from "@/lib/id"
import { AssignmentSchema, CreateAssignmentBodySchema } from "@/lib/schemas"
import { listProblems } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import { adminAssignmentsPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const db = getAdminFirestore()
  const assignmentsSnap =
    user.role === "TEACHER"
      ? await db
          .collection(adminAssignmentsPath())
          .where("teacherId", "==", user.id)
          .get()
      : await db.collection(adminAssignmentsPath()).get()

  const assignments = assignmentsSnap.docs.map((d) =>
    AssignmentSchema.parse(d.data())
  )
  const problems = await listProblems()
  const problemById = new Map(problems.map((p) => [p.id, p]))

  return NextResponse.json({
    assignments: assignments.map((a) => ({
      ...a,
      problems: (a.problemIds || [])
        .map((pid) => {
          const prob = problemById.get(pid)
          return prob
            ? { id: prob.id, title: prob.title, difficulty: prob.difficulty }
            : null
        })
        .filter(Boolean),
    })),
  })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json(
      { error: "Teacher access required" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = CreateAssignmentBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const dueAt =
    parsed.data.dueAt ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const assignment = AssignmentSchema.parse({
    id: createId(),
    teacherId: user.id,
    title: parsed.data.title || "New Assignment",
    dueAt,
    problemIds: [],
    createdAt: now,
  })

  const db = getAdminFirestore()
  await db.collection(adminAssignmentsPath()).doc(assignment.id).set(assignment)

  return NextResponse.json({ assignment })
}
