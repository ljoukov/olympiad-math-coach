"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Persona } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const personas: Array<{
  id: Persona
  title: string
  description: string
  icon: string
  color: string
  activeColor: string
}> = [
  {
    id: "COACH",
    title: "Coach",
    description:
      "Calm, supportive guidance. Step-by-step encouragement to build your confidence.",
    icon: "C",
    color: "bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-400",
    activeColor: "bg-blue-100 border-blue-500 ring-2 ring-blue-200",
  },
  {
    id: "QUIZ_MASTER",
    title: "Quiz Master",
    description:
      "Diagnostic questions and crisp feedback. Identifies exactly where you need to improve.",
    icon: "Q",
    color: "bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-400",
    activeColor: "bg-amber-100 border-amber-500 ring-2 ring-amber-200",
  },
  {
    id: "RIVAL",
    title: "Rival",
    description:
      "Challenges you to prove it. Pushes for rigour and precision in every step.",
    icon: "R",
    color: "bg-red-50 border-red-200 text-red-900 hover:border-red-400",
    activeColor: "bg-red-100 border-red-500 ring-2 ring-red-200",
  },
]

interface PersonaSelectorProps {
  selected: Persona | null
  onSelect: (persona: Persona) => void
}

export function PersonaSelector({ selected, onSelect }: PersonaSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {personas.map((p) => (
        <Card
          key={p.id}
          className={cn(
            "cursor-pointer border-2 transition-all",
            selected === p.id ? p.activeColor : p.color
          )}
          onClick={() => onSelect(p.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
                  p.id === "COACH"
                    ? "bg-blue-200 text-blue-800"
                    : p.id === "QUIZ_MASTER"
                      ? "bg-amber-200 text-amber-800"
                      : "bg-red-200 text-red-800"
                )}
              >
                {p.icon}
              </div>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              {p.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
