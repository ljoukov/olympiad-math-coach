"use client"

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Lightbulb,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RubricItem {
  name: string
  maxMarks: number
  awarded: number
  comment: string
}

interface FeedbackBreakdownProps {
  estimatedMarks: number
  rubricBreakdown: RubricItem[]
  tips: string[]
  rewrittenSolution: string
}

export function FeedbackBreakdown({
  estimatedMarks,
  rubricBreakdown,
  tips,
  rewrittenSolution,
}: FeedbackBreakdownProps) {
  const markColor =
    estimatedMarks >= 7
      ? "text-green-700 bg-green-50 border-green-200"
      : estimatedMarks >= 4
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200"

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 text-center ${markColor}`}>
        <p className="text-sm font-medium mb-1">Estimated Mark</p>
        <p className="text-5xl font-bold">
          {estimatedMarks}
          <span className="text-2xl">/10</span>
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rubric Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rubricBreakdown.map((item, i) => {
            const ratio = item.awarded / item.maxMarks
            const Icon =
              ratio >= 0.8 ? CheckCircle2 : ratio >= 0.4 ? AlertCircle : XCircle
            const color =
              ratio >= 0.8
                ? "text-green-600"
                : ratio >= 0.4
                  ? "text-amber-600"
                  : "text-red-500"

            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {item.awarded}/{item.maxMarks}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.comment}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            What to fix to gain more marks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-primary font-bold shrink-0">+</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            Clean Solution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted/50 p-4 rounded-lg leading-relaxed">
            {rewrittenSolution}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
