import { FieldValue } from "@ljoukov/firebase-admin-cloudflare/firestore"
import { NextResponse } from "next/server"
import { MoveClickBodySchema } from "@/lib/schemas"
import { getAdminFirestore } from "@/lib/server/firestore"
import { attemptDocPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = MoveClickBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moveId" }, { status: 400 })
  }

  const { moveId } = parsed.data

  const db = getAdminFirestore()
  const ref = db.doc(attemptDocPath(user.id, id))
  const snap = await ref.get()
  if (!snap.exists)
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  await ref.update({ moveClicks: FieldValue.arrayUnion(moveId) })

  return NextResponse.json({ ok: true })
}
