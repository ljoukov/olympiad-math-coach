import { NextResponse } from "next/server"
import {
  AddAssignmentProblemsBodySchema,
  AssignmentSchema,
} from "@/lib/schemas"
import { getAdminFirestore } from "@/lib/server/firestore"
import { adminAssignmentsPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request)
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json(
      { error: "Teacher access required" },
      { status: 403 }
    )
  }

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = AddAssignmentProblemsBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { problemIds } = parsed.data

  const db = getAdminFirestore()
  const ref = db.collection(adminAssignmentsPath()).doc(id)
  const snap = await ref.get()
  if (!snap.exists)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const assignment = AssignmentSchema.parse(snap.data())
  if (assignment.teacherId !== user.id) {
    return NextResponse.json(
      { error: "Teacher access required" },
      { status: 403 }
    )
  }

  const existingIds = assignment.problemIds || []
  const toAdd = problemIds.filter((pid) => !existingIds.includes(pid))

  if (toAdd.length > 0) {
    await ref.set({ problemIds: [...existingIds, ...toAdd] }, { merge: true })
  }

  return NextResponse.json({ ok: true })
}
