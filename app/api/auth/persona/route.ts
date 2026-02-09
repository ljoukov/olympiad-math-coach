import { NextResponse } from "next/server"
import { SetPersonaBodySchema } from "@/lib/schemas"
import { getAdminFirestore } from "@/lib/server/firestore"
import { userDocPath } from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = SetPersonaBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 })
  }

  const { persona } = parsed.data

  const db = getAdminFirestore()
  await db.doc(userDocPath(user.id)).set({ persona }, { merge: true })

  return NextResponse.json({ ok: true, persona })
}
