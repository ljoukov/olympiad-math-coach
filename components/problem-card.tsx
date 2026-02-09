"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProblemCardProps {
  id: string
  title: string
  statement: string
  topicTags: string[]
  difficulty: number
}

export function ProblemCard({
  id,
  title,
  statement,
  topicTags,
  difficulty,
}: ProblemCardProps) {
  const difficultyLabel = [
    "",
    "Easy",
    "Medium",
    "Challenging",
    "Hard",
    "Expert",
  ]
  const difficultyColor = [
    "",
    "bg-green-100 text-green-800",
    "bg-blue-100 text-blue-800",
    "bg-amber-100 text-amber-800",
    "bg-orange-100 text-orange-800",
    "bg-red-100 text-red-800",
  ]

  return (
    <Card className="group border border-border transition-all hover:border-primary/30 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {title}
          </CardTitle>
          <Badge
            variant="secondary"
            className={`${difficultyColor[difficulty]} shrink-0 text-xs`}
          >
            {difficultyLabel[difficulty]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {statement}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {topicTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link
              href={`/practice/${id}/start`}
              className="flex items-center gap-1"
            >
              Start <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
