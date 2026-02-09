import "server-only"

import {
  type GeminiModelId,
  LlmJsonCallError,
  loadLocalEnv,
  parseJsonFromLlmText,
  streamText,
} from "@ljoukov/llm"
import { z } from "zod"

import type { AttemptClaim, HintRung, Persona, Problem } from "@/lib/schemas"
import { getMovesByIds } from "@/lib/server/admin-data"
import type { AIProvider, AIStreamOptions, FeedbackResult } from "./provider"

const DEFAULT_MODEL: GeminiModelId = "gemini-2.5-pro"

function resolveModel(): string {
  const envModel = (process.env.AI_MODEL || "").trim()
  return envModel || DEFAULT_MODEL
}

function logLlmJsonError(context: string, err: unknown) {
  const e = err as { name?: unknown; message?: unknown; attempts?: unknown }
  if (!e || typeof e !== "object") return
  if (e.name !== "LlmJsonCallError") return
  const attempts = Array.isArray(e.attempts) ? e.attempts : []
  const compact = attempts.map((a) => {
    const entry = a as { attempt?: unknown; rawText?: unknown; error?: unknown }
    const rawText = typeof entry.rawText === "string" ? entry.rawText : ""
    const errorMessage =
      entry.error instanceof Error
        ? entry.error.message
        : typeof entry.error === "string"
          ? entry.error
          : ""
    return {
      attempt: entry.attempt,
      rawTextPreview: rawText.slice(0, 800),
      errorMessage,
    }
  })
  // Server-side only: helpful for debugging malformed JSON / blocked responses.
  // Do NOT log environment variables or credentials.
  console.error(`[llmProvider] ${context} failed:`, {
    message: typeof e.message === "string" ? e.message : String(e.message),
    attempts: compact,
  })
}

async function generateJsonWithStreaming<T>({
  schema,
  systemPrompt,
  prompt,
  stream,
  maxAttempts = 2,
  debugStage = "llm-response",
}: {
  schema: z.ZodType<T>
  systemPrompt: string
  prompt: string
  stream?: AIStreamOptions
  maxAttempts?: number
  debugStage?: string
}): Promise<T> {
  loadLocalEnv()

  const attempts: Array<{ attempt: number; rawText: string; error: unknown }> =
    []
  const model = resolveModel()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let rawText = ""
    let sawResponseDelta = false

    const call = streamText({
      model,
      systemPrompt,
      prompt:
        attempt === 1
          ? prompt
          : [
              prompt,
              "",
              "IMPORTANT: Output MUST be a single valid JSON object matching the requested schema.",
              "Do not wrap it in markdown. Do not include any commentary.",
            ].join("\n"),
      responseMimeType: "application/json",
    })

    try {
      for await (const event of call.events) {
        if (event.type !== "delta") continue
        if (event.channel === "thought") {
          stream?.onDelta?.({ thoughtDelta: event.text })
          continue
        }
        if (event.channel === "response" && !sawResponseDelta) {
          // Avoid pushing raw JSON into UI streams; callers only use this to
          // transition from "thinking" → "preparing".
          sawResponseDelta = true
          stream?.onDelta?.({ textDelta: " " })
        }
      }

      const result = await call.result
      rawText = result.text

      const parsedJson = parseJsonFromLlmText(rawText)
      return schema.parse(parsedJson)
    } catch (err) {
      call.abort()
      attempts.push({ attempt, rawText, error: err })
      if (attempt >= maxAttempts) {
        throw new LlmJsonCallError(
          `Failed to generate valid JSON (${debugStage}) after ${maxAttempts} attempts.`,
          attempts
        )
      }
    }
  }

  // Unreachable, but keeps TS happy.
  throw new Error("Unexpected: exhausted attempts without throwing")
}

function personaStyle(persona: string): string {
  switch (persona as Persona) {
    case "COACH":
      return "Warm, supportive, and calm. Ask one good question before giving direction."
    case "QUIZ_MASTER":
      return "Socratic and concise. Use questions and short prompts; do not over-explain."
    case "RIVAL":
      return "Challenging but not insulting. Be direct; push for rigor and precision."
    default:
      return "Neutral, concise, student-friendly."
  }
}

function buildHintSystemPrompt(): string {
  return [
    "You are the hint engine for Hamilton Olympiad Practice (UKMT-style proof problems).",
    "Goal: give ONE incremental hint that helps the student make progress without giving away the full solution.",
    "",
    "Rules:",
    "- Follow the requested rung exactly:",
    "  - NUDGE: 1-2 sentences. No key theorem/insight. Ask a guiding question or suggest a small next action.",
    "  - POINTER: 1-3 sentences. Give a direction/method (e.g. rephrase, invariant, parity), but do NOT reveal the crucial step.",
    "  - KEY: up to 4 sentences. You may reveal the crucial step/insight, but do NOT write the full solution.",
    "- Adapt to what the student already wrote (attemptText). Do not repeat what they already did unless correcting a mistake.",
    "- Do not mention rubrics, 'solutionOutline', or internal metadata. Do not mention that you are an AI.",
    "- Keep notation simple and consistent with the problem statement.",
    "- Return JSON only that matches the provided schema.",
  ].join("\n")
}

function buildHintUserPrompt(input: {
  problem: Problem
  attemptText: string
  rung: HintRung
  persona: string
  stuckConfidence?: number
}): string {
  const { problem, attemptText, rung, persona, stuckConfidence } = input

  const stuckLine =
    typeof stuckConfidence === "number"
      ? `Student stuck score (0-100, higher = more stuck): ${Math.max(0, Math.min(100, Math.round(stuckConfidence)))}`
      : "Student stuck score: (not provided)"

  return [
    `Persona style: ${personaStyle(persona)}`,
    `Rung: ${rung}`,
    stuckLine,
    "",
    "Problem:",
    `Title: ${problem.title}`,
    "Statement:",
    problem.statement,
    "",
    `Topic tags: ${(problem.topicTags || []).join(", ") || "(none)"}`,
    "",
    "Student attempt (may be empty):",
    attemptText && attemptText.trim().length > 0 ? attemptText : "(empty)",
    "",
    "Reference solution outline (for correctness only; do NOT quote verbatim unless rung is KEY, and even then keep it partial):",
    ...(problem.solutionOutline?.length
      ? problem.solutionOutline.map((s, i) => `${i + 1}. ${s}`)
      : ["(none)"]),
    "",
    "Output format (JSON only):",
    '{"hintText":"..."}',
  ].join("\n")
}

const HintSchema = z.object({
  hintText: z.string().min(1),
})

function buildGradeSystemPrompt(): string {
  return [
    "You are the grading engine for Hamilton Olympiad Practice.",
    "You must award partial credit using the provided rubric, and generate student-facing feedback.",
    "",
    "Rules:",
    "- Use ONLY the problem statement + rubric + attempt text. Do not assume extra conditions.",
    "- Rubric breakdown must match the rubric components exactly (same names, same max marks).",
    "- Awarded marks must be integers between 0 and maxMarks (inclusive).",
    "- Comments must be short, specific, and describe what was present/missing.",
    "- Tips must be actionable, specific to this attempt, and focused on gaining marks.",
    "- rewrittenSolution must be a clean, correct solution written as numbered steps (one step per line).",
    "- Do not mention that you used a rubric or that you are an AI.",
  ].join("\n")
}

function buildGradeUserPrompt(input: {
  problem: Problem
  attemptText: string
  claims: AttemptClaim[]
  startConfidence: number
  finalConfidence: number
  hintsUsed: HintRung[]
}): string {
  const {
    problem,
    attemptText,
    claims,
    startConfidence,
    finalConfidence,
    hintsUsed,
  } = input

  const rubricLines = problem.rubricJson.map(
    (r) =>
      `- ${r.name}: ${r.marks} marks. ${r.description}. Keywords: ${r.keywords.join(", ")}`
  )

  const claimsBlock =
    claims.length > 0
      ? claims
          .map((c, i) =>
            [
              `Claim ${i + 1} (confidence ${Math.max(0, Math.min(100, Math.round(c.confidence)))}%):`,
              `- claim: ${c.claimText || "(empty)"}`,
              `- reason: ${c.reasonText || "(empty)"}`,
              `- link: ${c.linkText || "(empty)"}`,
            ].join("\n")
          )
          .join("\n\n")
      : "(no claims)"

  return [
    "Problem:",
    `Title: ${problem.title}`,
    "Statement:",
    problem.statement,
    "",
    "Rubric (components):",
    ...rubricLines,
    "",
    "Reference solution outline (to generate the clean solution):",
    ...(problem.solutionOutline?.length
      ? problem.solutionOutline.map((s, i) => `${i + 1}. ${s}`)
      : ["(none)"]),
    "",
    "Student attempt:",
    attemptText && attemptText.trim().length > 0 ? attemptText : "(empty)",
    "",
    "Structured claims provided by student:",
    claimsBlock,
    "",
    `Start confidence: ${Math.max(0, Math.min(100, Math.round(startConfidence)))}%`,
    `Final confidence: ${Math.max(0, Math.min(100, Math.round(finalConfidence)))}%`,
    `Hints used: ${hintsUsed.length > 0 ? hintsUsed.join(", ") : "(none)"}`,
    "",
    "Return JSON matching the schema exactly.",
  ].join("\n")
}

const RubricItemSchema = z.object({
  name: z.string().min(1),
  maxMarks: z.number().int().min(0),
  awarded: z.number().int().min(0),
  comment: z.string().min(1),
})

const FeedbackSchema = z.object({
  estimatedMarks: z.number().int().min(0).max(10),
  rubricBreakdown: z.array(RubricItemSchema).min(1),
  tips: z.array(z.string().min(1)).min(1),
  rewrittenSolution: z.string().min(1),
})

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  const v = Math.round(value)
  return Math.min(max, Math.max(min, v))
}

function normalizeFeedback(
  problem: Problem,
  raw: z.infer<typeof FeedbackSchema>,
  hintsUsed: HintRung[]
): FeedbackResult {
  const rubric = problem.rubricJson
  const byName = new Map(raw.rubricBreakdown.map((r) => [r.name, r]))

  const normalizedBreakdown = rubric.map((r) => {
    const got = byName.get(r.name)
    const awarded = clampInt(got?.awarded ?? 0, 0, r.marks)
    const comment =
      got?.comment && String(got.comment).trim().length > 0
        ? String(got.comment).trim()
        : awarded === r.marks
          ? "Fully addressed."
          : awarded > 0
            ? "Partially addressed."
            : "Not addressed."

    return {
      name: r.name,
      maxMarks: r.marks,
      awarded,
      comment,
    }
  })

  const maxTotal = rubric.reduce((s, r) => s + r.marks, 0)
  const totalAwarded = normalizedBreakdown.reduce((s, r) => s + r.awarded, 0)
  const estimatedFromRubric =
    maxTotal > 0 ? clampInt((totalAwarded / maxTotal) * 10, 0, 10) : 0

  let estimatedMarks = estimatedFromRubric
  let tips = raw.tips.map((t) => String(t).trim()).filter(Boolean)
  if (tips.length === 0)
    tips = ["Add clearer justifications for each step you use."]

  if (hintsUsed.includes("KEY") && estimatedMarks > 8) {
    estimatedMarks = 8
    tips = [
      "Marks are capped at 8/10 because you used a KEY hint. Try a second attempt using only NUDGE/POINTER hints to unlock full marks.",
      ...tips,
    ]
  }

  // Keep tips reasonably short for the UI.
  tips = tips.slice(0, 5)

  const rewrittenSolution =
    raw.rewrittenSolution && raw.rewrittenSolution.trim().length > 0
      ? raw.rewrittenSolution.trim()
      : (problem.solutionOutline || [])
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n")

  return {
    estimatedMarks,
    rubricBreakdown: normalizedBreakdown,
    tips,
    rewrittenSolution,
  }
}

export const llmProvider: AIProvider = {
  async generateHint(
    problem: Problem,
    attemptText: string,
    rung: HintRung,
    persona: string,
    stuckConfidence?: number,
    stream?: AIStreamOptions
  ): Promise<string> {
    // Pull context like move names if the problem references move ids.
    const moveDocs = await getMovesByIds(problem.movesSuggested || [])
    const suggestedMoves = moveDocs.map((m) => `- ${m.name}: ${m.whenToUse}`)

    const system = buildHintSystemPrompt()
    const user = [
      buildHintUserPrompt({
        problem,
        attemptText,
        rung,
        persona,
        stuckConfidence,
      }),
      "",
      suggestedMoves.length > 0
        ? [
            "Moves suggested for this problem (optional to mention):",
            ...suggestedMoves,
          ].join("\n")
        : "Moves suggested for this problem: (none)",
    ].join("\n")

    let result: z.infer<typeof HintSchema>
    try {
      result = await generateJsonWithStreaming({
        debugStage: "hint",
        schema: HintSchema,
        systemPrompt: system,
        prompt: user,
        stream,
      })
    } catch (err) {
      logLlmJsonError("generateHint", err)
      throw err
    }

    return result.hintText.trim()
  },

  async gradeAttempt(
    problem: Problem,
    attemptText: string,
    claims: AttemptClaim[],
    startConfidence: number,
    finalConfidence: number,
    hintsUsed: HintRung[],
    stream?: AIStreamOptions
  ): Promise<FeedbackResult> {
    const system = buildGradeSystemPrompt()
    const user = buildGradeUserPrompt({
      problem,
      attemptText,
      claims,
      startConfidence,
      finalConfidence,
      hintsUsed,
    })

    let raw: z.infer<typeof FeedbackSchema>
    try {
      raw = await generateJsonWithStreaming({
        debugStage: "gradeAttempt",
        schema: FeedbackSchema,
        systemPrompt: system,
        prompt: user,
        stream,
      })
    } catch (err) {
      logLlmJsonError("gradeAttempt", err)
      throw err
    }

    return normalizeFeedback(problem, raw, hintsUsed)
  },
}
