"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Zap, Pin } from "lucide-react"
import { useState } from "react"

interface MoveData {
  id: string
  name: string
  category: "CORE" | "SUGGESTED"
  whenToUse: string
  templateJson: { steps: string[] }
}

interface MovesPanelProps {
  moves: MoveData[]
  suggestedMoveIds: string[]
  pinnedMoveIds: string[]
  clickedMoveIds: string[]
  onMoveClick: (moveId: string) => void
}

export function MovesPanel({
  moves,
  suggestedMoveIds,
  pinnedMoveIds,
  clickedMoveIds,
  onMoveClick,
}: MovesPanelProps) {
  const [expandedMove, setExpandedMove] = useState<string | null>(null)

  const coreMoves = moves.filter((m) => m.category === "CORE")
  const suggestedMoves = moves.filter(
    (m) => m.category === "SUGGESTED" && suggestedMoveIds.includes(m.id)
  )

  const handleClick = (moveId: string) => {
    onMoveClick(moveId)
    setExpandedMove(expandedMove === moveId ? null : moveId)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-primary" />
          Core Moves
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {coreMoves.map((m) => (
            <div key={m.id} className="space-y-1">
              <Button
                variant={clickedMoveIds.includes(m.id) ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs h-auto py-1.5 px-2.5",
                  pinnedMoveIds.includes(m.id) && "ring-1 ring-primary"
                )}
                onClick={() => handleClick(m.id)}
              >
                {pinnedMoveIds.includes(m.id) && <Pin className="h-3 w-3 mr-1" />}
                {m.name}
              </Button>
              {expandedMove === m.id && (
                <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">{m.whenToUse}</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {m.templateJson.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {suggestedMoves.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Suggested for this problem</h3>
          <div className="flex flex-wrap gap-1.5">
            {suggestedMoves.map((m) => (
              <div key={m.id} className="space-y-1">
                <Button
                  variant={clickedMoveIds.includes(m.id) ? "default" : "secondary"}
                  size="sm"
                  className="text-xs h-auto py-1.5 px-2.5"
                  onClick={() => handleClick(m.id)}
                >
                  {m.name}
                  <Badge variant="outline" className="ml-1.5 text-[10px]">suggested</Badge>
                </Button>
                {expandedMove === m.id && (
                  <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">{m.whenToUse}</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {m.templateJson.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
