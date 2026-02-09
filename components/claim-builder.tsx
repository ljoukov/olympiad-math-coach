"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export interface Claim {
  claimText: string
  reasonText: string
  linkText: string
  confidence: number
}

interface ClaimBuilderProps {
  claims: Claim[]
  onChange: (claims: Claim[]) => void
}

export function ClaimBuilder({ claims, onChange }: ClaimBuilderProps) {
  const addClaim = () => {
    onChange([
      ...claims,
      { claimText: "", reasonText: "", linkText: "", confidence: 50 },
    ])
  }

  const removeClaim = (index: number) => {
    onChange(claims.filter((_, i) => i !== index))
  }

  const updateClaim = (
    index: number,
    field: keyof Claim,
    value: string | number
  ) => {
    const updated = [...claims]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Claim Builder</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addClaim}
          className="text-xs bg-transparent"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Claim
        </Button>
      </div>

      {claims.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Break your solution into logical claims. Each claim should state what
          you believe, why, and how it connects to the goal.
        </p>
      )}

      {claims.map((claim, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Claim {i + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeClaim(i)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <Input
              placeholder="I claim that..."
              value={claim.claimText}
              onChange={(e) => updateClaim(i, "claimText", e.target.value)}
              className="text-sm h-8"
            />
            <Input
              placeholder="Because..."
              value={claim.reasonText}
              onChange={(e) => updateClaim(i, "reasonText", e.target.value)}
              className="text-sm h-8"
            />
            <Input
              placeholder="This helps the goal because..."
              value={claim.linkText}
              onChange={(e) => updateClaim(i, "linkText", e.target.value)}
              className="text-sm h-8"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">
                Confidence: {claim.confidence}%
              </span>
              <Slider
                value={[claim.confidence]}
                onValueChange={(v) => updateClaim(i, "confidence", v[0])}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
