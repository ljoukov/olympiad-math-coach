import { NextResponse } from "next/server"
import { listProblems } from "@/lib/server/admin-data"
import { getUserFromRequest } from "@/lib/server/request-user"

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const topic = searchParams.get("topic")
  const difficulty = searchParams.get("difficulty")

  let problems = await listProblems()

  if (topic) {
    problems = problems.filter((p) => p.topicTags.includes(topic))
  }
  if (difficulty) {
    const parsed = Number.parseInt(difficulty, 10)
    if (!Number.isFinite(parsed)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 })
    }
    problems = problems.filter((p) => p.difficulty === parsed)
  }

  return NextResponse.json({
    problems: problems.map((p) => ({
      id: p.id,
      title: p.title,
      statement: p.statement,
      topicTags: p.topicTags,
      difficulty: p.difficulty,
      movesSuggested: p.movesSuggested,
    })),
  })
}
