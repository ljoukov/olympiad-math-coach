"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Loader2, AlertCircle } from "lucide-react"

export type LlmUiStage = "idle" | "connecting" | "processing" | "thinking" | "preparing" | "error"

export function LlmStreamStatus({
  stage,
  thinkingMarkdown,
  error,
}: {
  stage: LlmUiStage
  thinkingMarkdown?: string
  error?: string | null
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [stickToBottom, setStickToBottom] = useState(true)

  const label = useMemo(() => {
    switch (stage) {
      case "connecting":
        return "connecting..."
      case "processing":
        return "processing..."
      case "thinking":
        return "thinking..."
      case "preparing":
        return "preparing response..."
      case "error":
        return "error"
      default:
        return ""
    }
  }, [stage])

  useEffect(() => {
    if (!stickToBottom) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [thinkingMarkdown, stickToBottom])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const thresholdPx = 16
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < thresholdPx
    setStickToBottom(atBottom)
  }

  const hasThinking = Boolean(thinkingMarkdown && thinkingMarkdown.trim().length > 0)
  const hasError = Boolean(error && error.trim().length > 0)
  const show = stage !== "idle" || hasThinking || hasError
  if (!show) return null

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {stage !== "idle" && stage !== "error" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : hasError ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        ) : null}
        <span className="font-medium">{hasError ? "error" : label}</span>
        {hasError && (
          <span className="text-destructive">{error}</span>
        )}
      </div>

      {hasThinking && (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="max-h-36 overflow-y-auto rounded-md border bg-background/60 p-2 text-xs leading-relaxed"
          aria-label="Thinking output"
        >
          <ReactMarkdown
            components={{
              p: (props) => <p className="mb-2 last:mb-0" {...props} />,
              ul: (props) => <ul className="list-disc pl-5 mb-2 last:mb-0" {...props} />,
              ol: (props) => <ol className="list-decimal pl-5 mb-2 last:mb-0" {...props} />,
              li: (props) => <li className="mb-1 last:mb-0" {...props} />,
              code: (props) => <code className="font-mono text-[11px]" {...props} />,
              pre: (props) => <pre className="overflow-x-auto rounded bg-muted p-2" {...props} />,
            }}
          >
            {thinkingMarkdown || ""}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
