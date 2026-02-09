import type { AIProvider, FeedbackResult, AIStreamOptions } from "./provider"
import type { Problem, HintRung, AttemptClaim } from "@/lib/db"

const personaHintPrefix: Record<string, Record<HintRung, string>> = {
  COACH: {
    NUDGE: "Take a breath and think about this: ",
    POINTER: "Here is a helpful direction: ",
    KEY: "An important step to consider: ",
  },
  QUIZ_MASTER: {
    NUDGE: "Quick question: ",
    POINTER: "Consider this: ",
    KEY: "The key insight is: ",
  },
  RIVAL: {
    NUDGE: "Stuck already? Think about: ",
    POINTER: "I would look at: ",
    KEY: "Fine, here is the crucial step: ",
  },
}

export const mockProvider: AIProvider = {
  async generateHint(
    problem: Problem,
    _attemptText: string,
    rung: HintRung,
    persona: string,
    _stuckConfidence?: number,
    _stream?: AIStreamOptions
  ): Promise<string> {
    const prefix = personaHintPrefix[persona]?.[rung] || ""
    const outline = problem.solutionOutline

    switch (rung) {
      case "NUDGE":
        return prefix + `Have you tried restating what the problem is asking? The problem involves: ${problem.topicTags.join(", ")}.`
      case "POINTER":
        return prefix + (outline[0] || "Start by carefully defining your variables and what you need to show.")
      case "KEY":
        // Give a more substantive hint from the middle of the outline
        const midIdx = Math.floor(outline.length / 2)
        return prefix + (outline[midIdx] || "Think about the core algebraic manipulation needed.")
    }
  },

  async gradeAttempt(
    problem: Problem,
    attemptText: string,
    claims: AttemptClaim[],
    _startConfidence: number,
    _finalConfidence: number,
    hintsUsed: HintRung[],
    _stream?: AIStreamOptions
  ): Promise<FeedbackResult> {
    const rubric = problem.rubricJson
    const text = attemptText.toLowerCase()
    const maxTotal = rubric.reduce((s, r) => s + r.marks, 0)

    const rubricBreakdown = rubric.map((component) => {
      let awarded = 0
      let comment = ""

      // Check for keyword matches
      const matchCount = component.keywords.filter((kw) => text.includes(kw.toLowerCase())).length
      const matchRatio = component.keywords.length > 0 ? matchCount / component.keywords.length : 0

      if (matchRatio >= 0.6) {
        awarded = component.marks
        comment = "Good coverage of key ideas."
      } else if (matchRatio >= 0.3) {
        awarded = Math.ceil(component.marks * 0.6)
        comment = "Partial - some key elements missing."
      } else if (text.length > 50) {
        awarded = Math.ceil(component.marks * 0.3)
        comment = "Attempt shown but key ideas not clearly stated."
      } else {
        awarded = 0
        comment = "Not addressed."
      }

      return {
        name: component.name,
        maxMarks: component.marks,
        awarded,
        comment,
      }
    })

    // Bonus for presentation markers
    const presentationMarkers = ["therefore", "hence", "thus", "qed", "=", "since", "because", "proof"]
    const presCount = presentationMarkers.filter((m) => text.includes(m)).length
    if (presCount >= 2) {
      const presComponent = rubricBreakdown.find((r) => r.name === "Presentation")
      if (presComponent && presComponent.awarded < presComponent.maxMarks) {
        presComponent.awarded = Math.min(presComponent.awarded + 1, presComponent.maxMarks)
        presComponent.comment = "Good mathematical writing style."
      }
    }

    // Bonus for claims
    if (claims.length >= 2) {
      const first = rubricBreakdown[0]
      if (first && first.awarded < first.maxMarks) {
        first.awarded = Math.min(first.awarded + 1, first.maxMarks)
      }
    }

    let totalAwarded = rubricBreakdown.reduce((s, r) => s + r.awarded, 0)

    // Cap if KEY hint was used
    if (hintsUsed.includes("KEY")) {
      totalAwarded = Math.min(totalAwarded, 8)
    }

    // Normalize to /10
    const estimatedMarks = Math.round((totalAwarded / maxTotal) * 10)
    const finalMarks = Math.min(estimatedMarks, 10)

    // Generate tips
    const tips: string[] = []
    const weakest = [...rubricBreakdown].sort((a, b) => (a.awarded / a.maxMarks) - (b.awarded / b.maxMarks))
    for (const comp of weakest.slice(0, 3)) {
      if (comp.awarded < comp.maxMarks) {
        tips.push(`Improve "${comp.name}": ${comp.comment} Try including: ${problem.rubricJson.find((r) => r.name === comp.name)?.keywords.slice(0, 3).join(", ")}.`)
      }
    }
    if (tips.length === 0) {
      tips.push("Strong attempt! Consider adding more rigour to your justifications.")
    }

    // Rewritten solution from outline
    const rewrittenSolution = problem.solutionOutline.map((line, i) => `${i + 1}. ${line}`).join("\n")

    return {
      estimatedMarks: finalMarks,
      rubricBreakdown,
      tips,
      rewrittenSolution,
    }
  },
}
