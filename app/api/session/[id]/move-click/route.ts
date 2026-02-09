import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const { moveId } = await request.json()

  const db = getDb()
  const attempt = db.sessionAttempts.find((a) => a.id === id && a.userId === user.id)
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })

  if (!attempt.moveClicks.includes(moveId)) {
    attempt.moveClicks.push(moveId)
  }

  return NextResponse.json({ ok: true })
}
