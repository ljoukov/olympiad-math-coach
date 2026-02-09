import { z } from "zod"
import { FIREBASE_AUTH_ORIGIN } from "@/lib/server/firebase-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const InitSchema = z
  .object({
    apiKey: z.string(),
    authDomain: z.string().optional(),
    databaseURL: z.string().optional().nullable(),
    messagingSenderId: z.string().optional(),
    projectId: z.string(),
    storageBucket: z.string().optional(),
  })
  .passthrough()

async function fetchAndRewrite(
  host: string,
  fetchFn: typeof fetch
): Promise<Response> {
  const res = await fetchFn(`${FIREBASE_AUTH_ORIGIN}/__/firebase/init.json`, {
    redirect: "follow",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error(
      `[auth-init] upstream ${res.status} ${res.statusText}: ${text.slice(0, 300)}`
    )
    return new Response("Bad gateway", { status: 502 })
  }

  const json = await res.json().catch(() => null)
  const parsed = InitSchema.safeParse(json)
  if (!parsed.success) {
    console.error(
      "[auth-init] invalid upstream init.json",
      parsed.error?.message
    )
    return new Response("Upstream payload invalid", { status: 502 })
  }

  const upstream = parsed.data
  upstream.authDomain = host

  const body = JSON.stringify(upstream, null, 2)
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=60",
    },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return fetchAndRewrite(url.host, fetch)
}

export async function HEAD(request: Request) {
  const url = new URL(request.url)
  const res = await fetchAndRewrite(url.host, fetch)
  return new Response(null, { status: res.status, headers: res.headers })
}
