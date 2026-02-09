import { describe, expect, it } from "vitest"

import {
  adminAssignmentsPath,
  adminMovesPath,
  adminProblemsPath,
  attemptClaimsPath,
  attemptDocPath,
  attemptHintsPath,
  userAttemptsPath,
  userDocPath,
  userMoveStatesPath,
} from "../lib/server/paths"

describe("firestore path helpers", () => {
  it("builds user-scoped paths", () => {
    expect(userDocPath("u1")).toBe("math-coach/u1")
    expect(userAttemptsPath("u1")).toBe("math-coach/u1/attempts")
    expect(userMoveStatesPath("u1")).toBe("math-coach/u1/moveStates")

    expect(attemptDocPath("u1", "a1")).toBe("math-coach/u1/attempts/a1")
    expect(attemptClaimsPath("u1", "a1")).toBe(
      "math-coach/u1/attempts/a1/claims"
    )
    expect(attemptHintsPath("u1", "a1")).toBe("math-coach/u1/attempts/a1/hints")
  })

  it("builds admin/shared paths", () => {
    expect(adminProblemsPath()).toBe("math-coach-admin/global/problems")
    expect(adminMovesPath()).toBe("math-coach-admin/global/moves")
    expect(adminAssignmentsPath()).toBe("math-coach-admin/global/assignments")
  })
})
