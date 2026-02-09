export type SseEventHandler = (event: string, data: string) => void

type FetchSseOptions = {
  signal?: AbortSignal
  headers?: Record<string, string>
  onEvent: SseEventHandler
}

function parseSseEventBlock(block: string): { event: string; data: string } | null {
  const lines = block.split(/\r?\n/u)
  let event = "message"
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith(":")) continue // comment / ping

    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim() || "message"
      continue
    }
    if (line.startsWith("data:")) {
      // Per SSE spec, everything after ":" is the value (optional leading space).
      const value = line.slice("data:".length).replace(/^ /u, "")
      dataLines.push(value)
      continue
    }
  }

  if (dataLines.length === 0) return null
  return { event, data: dataLines.join("\n") }
}

export async function fetchSse(
  url: string,
  init: RequestInit,
  { signal, headers, onEvent }: FetchSseOptions
): Promise<void> {
  const res = await fetch(url, {
    ...init,
    signal,
    headers: {
      Accept: "text/event-stream",
      ...(init.headers ? (init.headers as Record<string, string>) : {}),
      ...(headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `SSE request failed with HTTP ${res.status}`)
  }
  if (!res.body) {
    throw new Error("SSE response has no body")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line.
    while (true) {
      const idx = buffer.indexOf("\n\n")
      const crlfIdx = idx === -1 ? buffer.indexOf("\r\n\r\n") : -1
      const cutAt = idx !== -1 ? idx + 2 : crlfIdx !== -1 ? crlfIdx + 4 : -1
      if (cutAt === -1) break

      const rawBlock = buffer.slice(0, cutAt)
      buffer = buffer.slice(cutAt)

      const normalizedBlock = rawBlock.replace(/\r\n/g, "\n").trim()
      if (!normalizedBlock) continue

      const parsed = parseSseEventBlock(normalizedBlock)
      if (parsed) {
        onEvent(parsed.event, parsed.data)
      }
    }
  }
}

