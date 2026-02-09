const GLOBAL_PROJECT_ID_KEY = "__math_coach_firebase_project_id__"

function tryGetProjectIdFromServiceAccountJson(): string | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: unknown
      projectId?: unknown
    }
    const pid = (parsed.project_id ?? parsed.projectId) as unknown
    return typeof pid === "string" && pid.length > 0 ? pid : null
  } catch {
    return null
  }
}

export function getFirebaseProjectId(): string {
  const g = globalThis as unknown as Record<string, unknown>
  const cached = g[GLOBAL_PROJECT_ID_KEY]
  if (typeof cached === "string" && cached.length > 0) return cached

  const fromSa = tryGetProjectIdFromServiceAccountJson()
  if (fromSa) {
    g[GLOBAL_PROJECT_ID_KEY] = fromSa
    return fromSa
  }

  throw new Error(
    "Firebase project id not configured. Provide GOOGLE_SERVICE_ACCOUNT_JSON with project_id."
  )
}
