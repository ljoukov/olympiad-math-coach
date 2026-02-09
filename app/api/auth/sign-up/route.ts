import { NextResponse } from "next/server"
import { createUser, setSession } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const user = createUser(email, password, role || "STUDENT")
  if (!user) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  await setSession(user.id)
  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } })
}
