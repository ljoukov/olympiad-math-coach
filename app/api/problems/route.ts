import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get("topic")
  const difficulty = searchParams.get("difficulty")

  const db = getDb()
  let problems = db.problems

  if (topic) {
    problems = problems.filter((p) => p.topicTags.includes(topic))
  }
  if (difficulty) {
    problems = problems.filter((p) => p.difficulty === parseInt(difficulty))
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
