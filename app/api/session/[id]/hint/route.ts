import { NextResponse } from "next/server"
import { getAIProvider } from "@/lib/ai"
import { createId } from "@/lib/id"
import {
  AttemptHintSchema,
  HintRequestBodySchema,
  SessionAttemptSchema,
} from "@/lib/schemas"
import { getProblem } from "@/lib/server/admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"
import { attemptDocPath, attemptHintsPath } from "@/lib/server/paths"
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

  const parsed = HintRequestBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { rung, stuckConfidence } = parsed.data

  const db = getAdminFirestore()
  const attemptSnap = await db.doc(attemptDocPath(user.id, id)).get()
  if (!attemptSnap.exists)
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
  const attempt = SessionAttemptSchema.parse(attemptSnap.data())

  const problem = await getProblem(attempt.problemId)
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })

  let hintText = ""
  try {
    const provider = getAIProvider()
    hintText = await provider.generateHint(
      problem,
      attempt.attemptText || "",
      rung,
      attempt.persona,
      stuckConfidence
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Hint generation failed"
    console.error("Hint generation failed:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const hint = {
    id: createId(),
    attemptId: id,
    rung,
    hintText,
    createdAt: new Date().toISOString(),
  }

  const validated = AttemptHintSchema.parse(hint)
  await db
    .collection(attemptHintsPath(user.id, id))
    .doc(validated.id)
    .set(validated)

  return NextResponse.json({
    hint: { rung: hint.rung, hintText: hint.hintText },
  })
}
