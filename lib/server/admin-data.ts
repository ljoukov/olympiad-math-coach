import {
  type Move,
  MoveSchema,
  type Problem,
  ProblemSchema,
} from "@/lib/schemas"
import { SEED_MOVES, SEED_PROBLEMS } from "@/lib/seed-admin-data"
import { getAdminFirestore } from "@/lib/server/firestore"

const ADMIN_BASE_PATH = "math-coach-admin/global"
const GLOBAL_SEEDED_KEY = "__math_coach_admin_seeded__"

function adminCollectionPath(name: string): string {
  return `${ADMIN_BASE_PATH}/${name}`
}

export async function ensureAdminSeeded(): Promise<void> {
  const g = globalThis as unknown as Record<string, unknown>
  if (g[GLOBAL_SEEDED_KEY] === true) return

  const db = getAdminFirestore()

  // Seed problems + moves on first run if empty.
  const [problemsProbe, movesProbe] = await Promise.all([
    db.collection(adminCollectionPath("problems")).limit(1).get(),
    db.collection(adminCollectionPath("moves")).limit(1).get(),
  ])

  const needsProblems = problemsProbe.empty
  const needsMoves = movesProbe.empty
  if (!needsProblems && !needsMoves) {
    g[GLOBAL_SEEDED_KEY] = true
    return
  }

  const seedProblems = SEED_PROBLEMS.map((p) => ProblemSchema.parse(p))
  const seedMoves = SEED_MOVES.map((m) => MoveSchema.parse(m))

  const writer = db.bulkWriter()

  if (needsProblems) {
    for (const p of seedProblems) {
      void writer.set(
        db.collection(adminCollectionPath("problems")).doc(p.id),
        p
      )
    }
  }

  if (needsMoves) {
    for (const m of seedMoves) {
      void writer.set(db.collection(adminCollectionPath("moves")).doc(m.id), m)
    }
  }

  await writer.close()
  g[GLOBAL_SEEDED_KEY] = true
}

export async function listProblems(): Promise<Problem[]> {
  await ensureAdminSeeded()
  const db = getAdminFirestore()
  const snap = await db.collection(adminCollectionPath("problems")).get()
  return snap.docs.map((d) => ProblemSchema.parse(d.data()))
}

export async function getProblem(problemId: string): Promise<Problem | null> {
  await ensureAdminSeeded()
  const db = getAdminFirestore()
  const snap = await db
    .doc(`${adminCollectionPath("problems")}/${problemId}`)
    .get()
  if (!snap.exists) return null
  return ProblemSchema.parse(snap.data())
}

export async function listMoves(): Promise<Move[]> {
  await ensureAdminSeeded()
  const db = getAdminFirestore()
  const snap = await db.collection(adminCollectionPath("moves")).get()
  return snap.docs.map((d) => MoveSchema.parse(d.data()))
}

export async function getMovesByIds(ids: string[]): Promise<Move[]> {
  await ensureAdminSeeded()
  const db = getAdminFirestore()
  const unique = Array.from(new Set(ids)).filter(Boolean)
  if (unique.length === 0) return []

  const refs = unique.map((id) =>
    db.doc(`${adminCollectionPath("moves")}/${id}`)
  )
  const snaps = await db.getAll(...refs)
  return snaps.filter((s) => s.exists).map((s) => MoveSchema.parse(s.data()))
}
