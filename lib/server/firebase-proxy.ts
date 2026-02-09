import "server-only"

export const FIREBASE_AUTH_HOST = "pic2toon.firebaseapp.com"
export const FIREBASE_AUTH_ORIGIN = `https://${FIREBASE_AUTH_HOST}` as const

function joinPathnameWithSearch(pathname: string, search: string): string {
  if (!search) return pathname
  return pathname + (search.startsWith("?") ? search : `?${search}`)
}

function stripHopByHopHeaders(headers: Headers): Headers {
  const out = new Headers()
  headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (
      lower === "content-encoding" ||
      lower === "transfer-encoding" ||
      lower === "content-length" ||
      lower === "connection"
    ) {
      return
    }
    out.append(key, value)
  })
  return out
}

function maybeRewriteLocationHeader({
  upstreamLocation,
  requestOrigin,
}: {
  upstreamLocation: string
  requestOrigin: string
}): string {
  try {
    const locUrl = new URL(upstreamLocation, FIREBASE_AUTH_ORIGIN)
    if (
      locUrl.origin === FIREBASE_AUTH_ORIGIN &&
      locUrl.pathname.startsWith("/__/auth/")
    ) {
      return new URL(
        locUrl.pathname + locUrl.search + locUrl.hash,
        requestOrigin
      ).toString()
    }
  } catch {
    // ignore
  }
  return upstreamLocation
}

function filenameFromPath(pathname: string): string {
  const idx = pathname.lastIndexOf("/")
  return idx === -1 ? pathname : pathname.slice(idx + 1)
}

export async function proxyFirebaseAuth(
  request: Request,
  originalPathname?: string
): Promise<Response> {
  const url = new URL(request.url)
  const effectivePathname = originalPathname ?? url.pathname
  const upstreamUrl = new URL(
    joinPathnameWithSearch(effectivePathname, url.search),
    FIREBASE_AUTH_ORIGIN
  )

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  // Avoid upstream gzip/brotli so we can safely manage content-encoding ourselves.
  headers.set("accept-encoding", "identity")
  if (headers.has("origin")) {
    headers.set("origin", FIREBASE_AUTH_ORIGIN)
  }
  headers.set("x-forwarded-host", url.host)
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""))

  const method = request.method
  let body: BodyInit | undefined
  if (method !== "GET" && method !== "HEAD") {
    const buf = await request.arrayBuffer()
    if (buf.byteLength > 0) body = buf
  }

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  })

  const outHeaders = stripHopByHopHeaders(upstreamRes.headers)

  const loc = upstreamRes.headers.get("location")
  if (loc) {
    outHeaders.set(
      "location",
      maybeRewriteLocationHeader({
        upstreamLocation: loc,
        requestOrigin: url.origin,
      })
    )
  }

  // Ensure correct content type for extensionless helper HTML pages.
  const filename = filenameFromPath(effectivePathname)
  if (
    filename === "iframe" ||
    filename === "handler" ||
    filename === "callback"
  ) {
    outHeaders.set("content-type", "text/html; charset=utf-8")
    outHeaders.set("x-content-type-options", "nosniff")
    outHeaders.delete("content-disposition")
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: outHeaders,
  })
}
