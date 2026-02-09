import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          persona: user.persona,
        }
      : null,
  })
}
