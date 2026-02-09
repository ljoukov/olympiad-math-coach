"use client"

import { NavHeader } from "@/components/nav-header"
import { PersonaSelector } from "@/components/persona-selector"
import { ConfidenceSlider } from "@/components/confidence-slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StartSessionPage() {
  const { user, setPersona } = useAuth()
  const router = useRouter()
  const { problemId } = useParams<{ problemId: string }>()
  const [confidence, setConfidence] = useState(50)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(user?.persona || null)
  const [starting, setStarting] = useState(false)

  const { data } = useSWR(`/api/problems`, fetcher)
  const problem = data?.problems?.find((p: { id: string }) => p.id === problemId)

  const handleStart = async () => {
    if (!problem) return
    setStarting(true)

    if (selectedPersona && selectedPersona !== user?.persona) {
      await setPersona(selectedPersona)
    }

    const res = await fetch("/api/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId,
        persona: selectedPersona || "COACH",
        startConfidence: confidence,
      }),
    })
    const json = await res.json()
    if (json.attemptId) {
      router.push(`/session/${json.attemptId}`)
    }
    setStarting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Start Session</h1>

        {problem ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>{problem.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{problem.statement}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="text-muted-foreground">Loading problem...</div>
        )}

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Choose your persona</h2>
          <PersonaSelector
            selected={selectedPersona}
            onSelect={setSelectedPersona}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">How confident are you?</h2>
          <ConfidenceSlider
            value={confidence}
            onChange={setConfidence}
            label="How confident are you that you can solve this?"
          />
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary font-medium">
            Starter tip: Restate what is being asked in your own words before diving in.
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={starting || !problem}
          className="w-full"
        >
          {starting ? "Starting..." : "Begin Solving"}
        </Button>
      </main>
    </div>
  )
}
