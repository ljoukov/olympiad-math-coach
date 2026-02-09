import { NextResponse } from "next/server"
import { authenticateUser, setSession } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const user = authenticateUser(email, password)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  await setSession(user.id)
  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } })
}
