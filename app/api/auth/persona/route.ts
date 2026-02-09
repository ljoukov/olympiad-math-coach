import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { persona } = await request.json()
  if (!["COACH", "QUIZ_MASTER", "RIVAL"].includes(persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 })
  }

  const db = getDb()
  const dbUser = db.users.find((u) => u.id === user.id)
  if (dbUser) {
    dbUser.persona = persona
  }

  return NextResponse.json({ ok: true, persona })
}
