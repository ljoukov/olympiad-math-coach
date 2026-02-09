import { createRemoteJWKSet, jwtVerify } from "jose"
import { z } from "zod"
import { getFirebaseProjectId } from "./firebase-project"

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
)

const FirebaseIdTokenPayloadSchema = z
  .object({
    sub: z.string(),
    user_id: z.string().optional(),
    email: z.string().optional(),
    email_verified: z.boolean().optional(),
    firebase: z
      .object({
        sign_in_provider: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type VerifiedFirebaseIdToken = {
  uid: string
  email: string | null
  emailVerified: boolean
  signInProvider: string | null
}

export function getBearerToken(request: Request): string | null {
  const header =
    request.headers.get("authorization") || request.headers.get("Authorization")
  if (!header) return null
  const [kind, token] = header.split(" ")
  if (kind !== "Bearer" || !token) return null
  return token
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseIdToken> {
  const projectId = getFirebaseProjectId()

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })

  const parsed = FirebaseIdTokenPayloadSchema.parse(payload)
  const uid = parsed.user_id ?? parsed.sub

  return {
    uid,
    email: parsed.email ?? null,
    emailVerified: parsed.email_verified ?? false,
    signInProvider: parsed.firebase?.sign_in_provider ?? null,
  }
}
