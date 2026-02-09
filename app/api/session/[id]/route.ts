import { NextResponse } from "next/server"
import {
  AttemptClaimSchema,
  AttemptHintSchema,
  SessionAttemptSchema,
} from "@/lib/schemas"
import { getProblem, listMoves } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import {
  attemptClaimsPath,
  attemptDocPath,
  attemptHintsPath,
} from "@/lib/server/paths"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const db = getAdminFirestore()

  const attemptSnap = await db.doc(attemptDocPath(user.id, id)).get()
  if (!attemptSnap.exists)
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
  const attempt = SessionAttemptSchema.parse(attemptSnap.data())

  const [problem, movesSnap, claimsSnap, hintsSnap] = await Promise.all([
    getProblem(attempt.problemId),
    listMoves(),
    db.collection(attemptClaimsPath(user.id, id)).get(),
    db.collection(attemptHintsPath(user.id, id)).get(),
  ])
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  const claims = claimsSnap.docs.map((d) => AttemptClaimSchema.parse(d.data()))
  const hints = hintsSnap.docs.map((d) => AttemptHintSchema.parse(d.data()))

  return NextResponse.json({
    attempt,
    problem,
    claims,
    hints,
    moves: movesSnap,
  })
}
