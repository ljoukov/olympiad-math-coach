"use client"

import { Button } from "@/components/ui/button"
import { ConfidenceSlider } from "@/components/confidence-slider"
import { LlmStreamStatus, type LlmUiStage } from "@/components/llm-stream-status"
import { fetchSse } from "@/lib/sse"
import { Lightbulb, ArrowRight, Key } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface Hint {
  rung: string
  hintText: string
}

interface HintLadderProps {
  attemptId: string
  hints: Hint[]
  onHintReceived: (hint: Hint) => void
}

export function HintLadder({ attemptId, hints, onHintReceived }: HintLadderProps) {
  const [stuckConfidence, setStuckConfidence] = useState(50)
  const [loading, setLoading] = useState<string | null>(null)
  const [showConfidence, setShowConfidence] = useState(false)
  const [pendingRung, setPendingRung] = useState<string | null>(null)
  const [streamStage, setStreamStage] = useState<LlmUiStage>("idle")
  const [thinking, setThinking] = useState("")
  const [streamError, setStreamError] = useState<string | null>(null)

  const rungs = [
    { id: "NUDGE", label: "Nudge", icon: Lightbulb, description: "A gentle push in the right direction" },
    { id: "POINTER", label: "Pointer", icon: ArrowRight, description: "A more specific direction to explore" },
    { id: "KEY", label: "Key Step", icon: Key, description: "The crucial insight (may cap marks at 8)" },
  ]

  const requestHint = async (rung: string) => {
    if (!showConfidence) {
      setPendingRung(rung)
      setShowConfidence(true)
      return
    }

    setLoading(rung)

    setStreamStage("connecting")
    setThinking("")
    setStreamError(null)
    try {
      await fetchSse(
        `/api/session/${attemptId}/hint/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rung, stuckConfidence }),
        },
        {
          onEvent: (event, data) => {
            try {
              const payload = JSON.parse(data) as Record<string, unknown>

              if (event === "status") {
                const stage = String(payload.stage || "")
                if (stage === "processing") setStreamStage("processing")
                else if (stage === "thinking") setStreamStage("thinking")
                else if (stage === "preparing") setStreamStage("preparing")
                return
              }

              if (event === "thought") {
                const delta = String(payload.delta || "")
                if (delta) {
                  setStreamStage((prev) => (prev === "preparing" ? prev : "thinking"))
                  setThinking((prev) => prev + delta)
                }
                return
              }

              if (event === "done") {
                const hint = payload.hint as Hint | undefined
                if (hint?.hintText) {
                  onHintReceived(hint)
                } else {
                  toast.error("No hint returned")
                }
                setThinking("")
                setStreamError(null)
                setStreamStage("idle")
                return
              }

              if (event === "error") {
                const msg = String(payload.error || "Failed to get hint")
                setStreamStage("error")
                setStreamError(msg)
                toast.error(msg)
                return
              }
            } catch {
              // ignore malformed events
            }
          },
        }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get hint"
      setStreamStage("error")
      setStreamError(msg)
      toast.error(msg)
    }

    setLoading(null)
    setShowConfidence(false)
    setPendingRung(null)
  }

  const confirmHint = () => {
    if (pendingRung) {
      requestHint(pendingRung)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        Hint Ladder
      </h3>

      <div className="flex gap-2">
        {rungs.map((r) => (
          <Button
            key={r.id}
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-auto py-2 flex flex-col items-center gap-1 bg-transparent"
            onClick={() => requestHint(r.id)}
            disabled={loading !== null}
          >
            <r.icon className="h-4 w-4" />
            <span>{r.label}</span>
          </Button>
        ))}
      </div>

      {showConfidence && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
          <p className="text-xs text-amber-800 font-medium">Before receiving a hint, rate how stuck you feel:</p>
          <ConfidenceSlider
            value={stuckConfidence}
            onChange={setStuckConfidence}
            label="How stuck am I?"
          />
          <Button size="sm" onClick={confirmHint} disabled={loading !== null}>
            {loading ? "Loading..." : `Get ${pendingRung?.toLowerCase()} hint`}
          </Button>
        </div>
      )}

      <LlmStreamStatus stage={streamStage} thinkingMarkdown={thinking} error={streamError} />

      {hints.length > 0 && (
        <div className="space-y-2">
          {hints.map((h, i) => (
            <div key={i} className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold text-primary">{h.rung}</span>
              </div>
              <p className="text-sm text-foreground">{h.hintText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
