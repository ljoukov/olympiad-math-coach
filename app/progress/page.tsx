"use client"

import useSWR from "swr"
import { NavHeader } from "@/components/nav-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRequireAuth } from "@/hooks/use-auth"
import { authedJsonFetch } from "@/lib/authed-fetch"

type ProgressAttemptRow = {
  id: string
  problemTitle: string
  marks: number | null
  startConfidence: number
  finalConfidence: number | null
  submittedAt: string
}

type ProgressMoveStateRow = {
  moveId: string
  moveName: string
  category: string
  whenToUse: string
  commonTrap: string
  status: string
  pinned: boolean
  lastExampleText: string | null
}

type ProgressResponse = {
  attempts: ProgressAttemptRow[]
  moveStates: ProgressMoveStateRow[]
  calibration: { status: string; avgError: number }
}

const fetcher = (url: string) => authedJsonFetch<ProgressResponse>(url)

function StatusIcon({ status }: { status: string }) {
  if (status === "RELIABLE")
    return <span className="text-green-600">Reliable</span>
  if (status === "SOMETIMES")
    return <span className="text-amber-600">Sometimes</span>
  return <span className="text-red-500">Not yet</span>
}

function CalibrationBadge({ status }: { status: string }) {
  if (status === "GOOD")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        Good calibration
      </Badge>
    )
  if (status === "OKAY")
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        Okay calibration
      </Badge>
    )
  if (status === "NEEDS_WORK")
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        Needs work
      </Badge>
    )
  return <Badge variant="secondary">Not enough data</Badge>
}

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const { data, isLoading } = useSWR<ProgressResponse>(
    user ? "/api/progress" : null,
    fetcher
  )

  const attempts = data?.attempts || []
  const moveStates = data?.moveStates || []
  const calibration = data?.calibration || {
    status: "NOT_ENOUGH_DATA",
    avgError: 0,
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
          <p className="text-muted-foreground">
            Track your toolbox, marks, and calibration over time.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading progress...
          </div>
        ) : (
          <>
            {/* Hamilton Readiness */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hamilton Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    Calibration:
                  </span>
                  <CalibrationBadge status={calibration.status} />
                  {calibration.avgError > 0 && (
                    <span className="text-xs text-muted-foreground">
                      (avg error: {calibration.avgError} pts)
                    </span>
                  )}
                </div>

                {attempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No completed attempts yet. Start solving problems to see
                    your progress!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Last {attempts.length} attempts:
                    </p>
                    <div className="grid gap-2">
                      {attempts.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {a.problemTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Confidence: {a.startConfidence}% &rarr;{" "}
                              {a.finalConfidence}%
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${(a.marks || 0) >= 7 ? "text-green-700" : (a.marks || 0) >= 4 ? "text-amber-700" : "text-red-600"}`}
                            >
                              {a.marks}/10
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Toolbox */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Toolbox</CardTitle>
              </CardHeader>
              <CardContent>
                {moveStates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No move data yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {moveStates.map(
                      (ms: {
                        moveId: string
                        moveName: string
                        category: string
                        whenToUse: string
                        commonTrap: string
                        status: string
                        pinned: boolean
                        lastExampleText: string | null
                      }) => (
                        <div
                          key={ms.moveId}
                          className="rounded-lg border p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                              {ms.moveName}
                            </span>
                            <StatusIcon status={ms.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ms.whenToUse}
                          </p>
                          <div className="text-xs space-y-0.5">
                            <p className="text-red-600/80">
                              <span className="font-medium">Common trap:</span>{" "}
                              {ms.commonTrap}
                            </p>
                            {ms.lastExampleText && (
                              <p className="text-green-700/80">
                                <span className="font-medium">My example:</span>{" "}
                                {ms.lastExampleText}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {ms.category}
                            </Badge>
                            {ms.pinned && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Pinned
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
