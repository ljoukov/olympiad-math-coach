import { z } from "zod"

export const RoleSchema = z.enum(["STUDENT", "TEACHER"])
export type Role = z.infer<typeof RoleSchema>

export const MoveStatusSchema = z.enum(["NOT_YET", "SOMETIMES", "RELIABLE"])
export type MoveStatus = z.infer<typeof MoveStatusSchema>

export const HintRungSchema = z.enum(["NUDGE", "POINTER", "KEY"])
export type HintRung = z.infer<typeof HintRungSchema>

export const PersonaSchema = z.enum(["COACH", "QUIZ_MASTER", "RIVAL"])
export type Persona = z.infer<typeof PersonaSchema>

export const RubricComponentSchema = z.object({
  name: z.string(),
  marks: z.number().int().nonnegative(),
  description: z.string(),
  keywords: z.array(z.string()),
})
export type RubricComponent = z.infer<typeof RubricComponentSchema>

export const ProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  statement: z.string(),
  topicTags: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  movesSuggested: z.array(z.string()),
  rubricJson: z.array(RubricComponentSchema),
  solutionOutline: z.array(z.string()),
})
export type Problem = z.infer<typeof ProblemSchema>

export const MoveSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["CORE", "SUGGESTED"]),
  whenToUse: z.string(),
  templateJson: z.object({ steps: z.array(z.string()) }),
  commonTrap: z.string(),
})
export type Move = z.infer<typeof MoveSchema>

export const UserProfileSchema = z.object({
  email: z.string().email().nullable(),
  role: RoleSchema,
  persona: PersonaSchema.nullable(),
  createdAt: z.string(),
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const SessionAttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  problemId: z.string(),
  persona: PersonaSchema,
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
  startConfidence: z.number().int().min(0).max(100),
  finalConfidence: z.number().int().min(0).max(100).nullable(),
  attemptText: z.string().nullable(),
  estimatedMarks: z.number().int().min(0).max(10).nullable(),
  feedbackJson: z.record(z.string(), z.unknown()).nullable(),
  moveClicks: z.array(z.string()),
})
export type SessionAttempt = z.infer<typeof SessionAttemptSchema>

export const AttemptClaimSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  claimText: z.string(),
  reasonText: z.string(),
  linkText: z.string(),
  confidence: z.number().int().min(0).max(100),
})
export type AttemptClaim = z.infer<typeof AttemptClaimSchema>

export const AttemptHintSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  rung: HintRungSchema,
  hintText: z.string(),
  createdAt: z.string(),
})
export type AttemptHint = z.infer<typeof AttemptHintSchema>

export const UserMoveStateSchema = z.object({
  moveId: z.string(),
  status: MoveStatusSchema,
  pinned: z.boolean(),
  lastExampleText: z.string().nullable(),
})
export type UserMoveState = z.infer<typeof UserMoveStateSchema>

export const AssignmentSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  title: z.string(),
  dueAt: z.string(),
  problemIds: z.array(z.string()),
  createdAt: z.string(),
})
export type Assignment = z.infer<typeof AssignmentSchema>

// ---- API request schemas ----

export const SetPersonaBodySchema = z.object({
  persona: PersonaSchema.nullable(),
})

export const StartSessionBodySchema = z.object({
  problemId: z.string(),
  persona: PersonaSchema.optional(),
  startConfidence: z.number().int().min(0).max(100).optional(),
})

export const MoveClickBodySchema = z.object({
  moveId: z.string(),
})

export const HintRequestBodySchema = z.object({
  rung: HintRungSchema,
  stuckConfidence: z.number().int().min(0).max(100).optional(),
})

export const ClaimInputSchema = z.object({
  claimText: z.string().default(""),
  reasonText: z.string().default(""),
  linkText: z.string().default(""),
  confidence: z.number().int().min(0).max(100).default(50),
})

export const SubmitAttemptBodySchema = z.object({
  attemptText: z.string().default(""),
  claims: z.array(ClaimInputSchema).optional(),
  finalConfidence: z.number().int().min(0).max(100).optional(),
})

export const CreateAssignmentBodySchema = z.object({
  title: z.string().optional(),
  dueAt: z.string().optional(),
})

export const AddAssignmentProblemsBodySchema = z.object({
  problemIds: z.array(z.string()),
})
