export const USERS_COLLECTION = "math-coach"
export const ADMIN_BASE_PATH = "math-coach-admin/global"

export function userDocPath(userId: string): string {
  return `${USERS_COLLECTION}/${userId}`
}

export function userMoveStatesPath(userId: string): string {
  return `${userDocPath(userId)}/moveStates`
}

export function userAttemptsPath(userId: string): string {
  return `${userDocPath(userId)}/attempts`
}

export function attemptDocPath(userId: string, attemptId: string): string {
  return `${userAttemptsPath(userId)}/${attemptId}`
}

export function attemptClaimsPath(userId: string, attemptId: string): string {
  return `${attemptDocPath(userId, attemptId)}/claims`
}

export function attemptHintsPath(userId: string, attemptId: string): string {
  return `${attemptDocPath(userId, attemptId)}/hints`
}

export function adminProblemsPath(): string {
  return `${ADMIN_BASE_PATH}/problems`
}

export function adminMovesPath(): string {
  return `${ADMIN_BASE_PATH}/moves`
}

export function adminAssignmentsPath(): string {
  return `${ADMIN_BASE_PATH}/assignments`
}
