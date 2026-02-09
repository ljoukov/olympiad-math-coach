import { generateJson, loadLocalEnv } from "@ljoukov/llm"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import type { Problem } from "../lib/schemas"

// Avoid pulling Firestore into LLM integration tests.
vi.mock("@/lib/server/admin-data", () => ({
  getMovesByIds: async () => [],
}))

loadLocalEnv()

const RUN = process.env.RUN_LLM_INTEGRATION_TESTS === "1"

function hasNonEmptyEnv(name: string): boolean {
  const v = process.env[name]
  return typeof v === "string" && v.trim().length > 0
}

function resolveJudgeModel(): string | null {
  // Preferred: ChatGPT subscription judge.
  if (
    hasNonEmptyEnv("CHATGPT_AUTH_JSON_B64") ||
    hasNonEmptyEnv("CHATGPT_AUTH_JSON")
  )
    return "chatgpt-gpt-5.2-codex"

  // Fallback: OpenAI API judge (still uses the same judge prompt + schema).
  if (hasNonEmptyEnv("OPENAI_API_KEY")) return "gpt-5.2-codex"

  return null
}

function resolveGeneratorModel(): string | null {
  // Prefer Gemini since that's the default in this repo and has special handling.
  if (hasNonEmptyEnv("GOOGLE_SERVICE_ACCOUNT_JSON")) return "gemini-2.5-pro"

  // Fallback to OpenAI if Gemini credentials aren't present.
  if (hasNonEmptyEnv("OPENAI_API_KEY")) return "gpt-5.2-codex"

  // Last resort: ChatGPT subscription model.
  if (
    hasNonEmptyEnv("CHATGPT_AUTH_JSON_B64") ||
    hasNonEmptyEnv("CHATGPT_AUTH_JSON")
  )
    return "chatgpt-gpt-5.2-codex"

  return null
}

const HintJudgeSchema = z.object({
  pass: z.boolean(),
  score: z.number().int().min(0).max(10),
  reasons: z.array(z.string().min(1)).min(1).max(6),
})

const GradeJudgeSchema = z.object({
  pass: z.boolean(),
  score: z.number().int().min(0).max(10),
  reasons: z.array(z.string().min(1)).min(1).max(8),
})

async function judgeHintQuality(params: {
  judgeModel: string
  problem: Problem
  rung: "NUDGE" | "POINTER" | "KEY"
  attemptText: string
  hintText: string
}) {
  const { judgeModel, problem, rung, attemptText, hintText } = params

  const systemPrompt = [
    "You are a strict evaluator of math tutoring hints.",
    "You must judge correctness, helpfulness, rung compliance, and how much it spoils the solution.",
    "Return JSON only that matches the schema exactly.",
  ].join("\n")

  const prompt = [
    "Evaluate the hint below for a UKMT-style proof problem.",
    "",
    `Rung: ${rung}`,
    "Rung rules:",
    "- NUDGE: 1-2 sentences. No key theorem/insight. Ask a guiding question or suggest a small next action.",
    "- POINTER: 1-3 sentences. Give a direction/method, but do NOT reveal the crucial step.",
    "- KEY: up to 4 sentences. May reveal the crucial step/insight, but do NOT write the full solution.",
    "",
    "Major fail conditions:",
    "- Mathematically incorrect.",
    "- Writes most of the full solution.",
    "- Mentions being an AI, or references internal metadata (e.g. rubric/solutionOutline).",
    "",
    "Problem statement:",
    problem.statement,
    "",
    "Student attempt:",
    attemptText && attemptText.trim().length > 0 ? attemptText : "(empty)",
    "",
    "Hint to evaluate:",
    hintText,
    "",
    "Scoring guidance:",
    "- score: 0-10 integer (10=excellent).",
    "- pass: true if score >= 7 and no major fail conditions are triggered.",
    "",
    "Return JSON with fields: pass, score, reasons (1-6 short items).",
  ].join("\n")

  const { value } = await generateJson({
    model: judgeModel,
    systemPrompt,
    prompt,
    schema: HintJudgeSchema,
    openAiSchemaName: "hint_quality_judge",
    maxAttempts: 3,
  })
  return value
}

async function judgeGradeQuality(params: {
  judgeModel: string
  problem: Problem
  attemptText: string
  feedback: unknown
}) {
  const { judgeModel, problem, attemptText, feedback } = params

  const systemPrompt = [
    "You are a strict evaluator of structured grading output for a math proof practice app.",
    "Return JSON only that matches the schema exactly.",
  ].join("\n")

  const prompt = [
    "Evaluate the grading output below.",
    "",
    "Checks (non-exhaustive):",
    "- The feedback matches the problem and student attempt (no hallucinated facts).",
    "- The rewrittenSolution is correct and written as numbered steps (one step per line).",
    "- Tips are actionable and specific.",
    "- The rubric breakdown is consistent with the rubric component names and mark ranges.",
    "- Does not mention being an AI or internal metadata.",
    "",
    "Problem statement:",
    problem.statement,
    "",
    "Rubric components:",
    ...problem.rubricJson.map(
      (r) => `- ${r.name}: ${r.marks} marks. ${r.description}`
    ),
    "",
    "Reference solution outline (for correctness checking):",
    ...problem.solutionOutline.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Student attempt:",
    attemptText && attemptText.trim().length > 0 ? attemptText : "(empty)",
    "",
    "Feedback JSON to evaluate:",
    JSON.stringify(feedback),
    "",
    "Scoring guidance:",
    "- score: 0-10 integer (10=excellent).",
    "- pass: true if score >= 7 and no major correctness issues are present.",
    "",
    "Return JSON with fields: pass, score, reasons (1-8 short items).",
  ].join("\n")

  const { value } = await generateJson({
    model: judgeModel,
    systemPrompt,
    prompt,
    schema: GradeJudgeSchema,
    openAiSchemaName: "grade_quality_judge",
    maxAttempts: 3,
  })
  return value
}

const judgeModel = resolveJudgeModel()
const generatorModel = resolveGeneratorModel()

const describeIntegration =
  RUN && judgeModel && generatorModel ? describe : describe.skip

describeIntegration("LLM JSON (integration)", () => {
  it("generates valid JSON for hint + grade and passes an LLM judge quality check", async () => {
    const prevModel = process.env.AI_MODEL
    process.env.AI_MODEL = generatorModel ?? prevModel

    try {
      const { llmProvider } = await import("../lib/ai/llmProvider")

      const problem: Problem = {
        id: "it_prob_divisibility_01",
        title: "Divisibility of n^3 - n",
        statement: "Prove that for every integer n, n^3 - n is divisible by 3.",
        topicTags: ["number-theory"],
        difficulty: 1,
        movesSuggested: [],
        rubricJson: [
          {
            name: "Algebra",
            marks: 3,
            description: "Rewrites n^3 - n into a useful product",
            keywords: ["factor", "n(n-1)(n+1)", "n(n^2-1)"],
          },
          {
            name: "Divisibility",
            marks: 4,
            description:
              "Justifies why one of three consecutive integers is divisible by 3",
            keywords: ["mod 3", "consecutive", "remainders"],
          },
          {
            name: "Conclusion",
            marks: 3,
            description: "Clearly concludes divisibility for all integers n",
            keywords: ["therefore", "divisible", "for all integers"],
          },
        ],
        solutionOutline: [
          "Factor n^3 - n = n(n^2 - 1) = n(n - 1)(n + 1).",
          "The factors n-1, n, n+1 are three consecutive integers.",
          "Among three consecutive integers, exactly one is divisible by 3 (consider remainders mod 3).",
          "Therefore their product is divisible by 3, so n^3 - n is divisible by 3 for all integers n.",
        ],
      }

      const hintAttemptText =
        "I rewrote n^3 - n = n(n^2-1) = n(n-1)(n+1), but I'm not sure how to argue this is always divisible by 3."
      const hintText = await llmProvider.generateHint(
        problem,
        hintAttemptText,
        "NUDGE",
        "COACH",
        70
      )
      expect(hintText.trim().length).toBeGreaterThan(0)
      expect(hintText.length).toBeLessThan(800)

      const hintEval = await judgeHintQuality({
        judgeModel: judgeModel!,
        problem,
        rung: "NUDGE",
        attemptText: hintAttemptText,
        hintText,
      })
      expect(
        hintEval.pass,
        `Hint judge failed (model=${judgeModel}, gen=${generatorModel}, score=${hintEval.score}): ${hintEval.reasons.join(" | ")}`
      ).toBe(true)

      const gradeAttemptText =
        "We have n^3 - n = n(n^2 - 1) = n(n - 1)(n + 1). These are three consecutive integers, so their remainders mod 3 are 0,1,2 in some order; in particular one is divisible by 3. Hence the product is divisible by 3, so n^3 - n is divisible by 3 for all integers n."
      const feedback = await llmProvider.gradeAttempt(
        problem,
        gradeAttemptText,
        [],
        60,
        90,
        []
      )

      expect(feedback.estimatedMarks).toBeGreaterThanOrEqual(8)
      expect(feedback.rubricBreakdown.length).toBe(problem.rubricJson.length)
      expect(feedback.tips.length).toBeGreaterThan(0)
      expect(feedback.rewrittenSolution.trim().length).toBeGreaterThan(0)

      const gradeEval = await judgeGradeQuality({
        judgeModel: judgeModel!,
        problem,
        attemptText: gradeAttemptText,
        feedback,
      })
      expect(
        gradeEval.pass,
        `Grade judge failed (model=${judgeModel}, gen=${generatorModel}, score=${gradeEval.score}): ${gradeEval.reasons.join(" | ")}`
      ).toBe(true)
    } finally {
      if (prevModel === undefined) {
        delete process.env.AI_MODEL
      } else {
        process.env.AI_MODEL = prevModel
      }
    }
  }, 240_000)
})
