import type { Problem, HintRung, AttemptClaim, RubricComponent } from "@/lib/db"

export interface FeedbackResult {
  estimatedMarks: number
  rubricBreakdown: { name: string; maxMarks: number; awarded: number; comment: string }[]
  tips: string[]
  rewrittenSolution: string
}

export type AIDelta = {
  thoughtDelta?: string
  textDelta?: string
}

export type AIStreamOptions = {
  onDelta?: (delta: AIDelta) => void
}

export interface AIProvider {
  generateHint(
    problem: Problem,
    attemptText: string,
    rung: HintRung,
    persona: string,
    stuckConfidence?: number,
    stream?: AIStreamOptions
  ): Promise<string>

  gradeAttempt(
    problem: Problem,
    attemptText: string,
    claims: AttemptClaim[],
    startConfidence: number,
    finalConfidence: number,
    hintsUsed: HintRung[],
    stream?: AIStreamOptions
  ): Promise<FeedbackResult>
}
