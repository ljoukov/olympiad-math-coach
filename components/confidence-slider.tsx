"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

const labels = [
  { min: 0, max: 20, text: "Not confident", color: "text-red-600" },
  { min: 21, max: 40, text: "Slightly confident", color: "text-orange-600" },
  { min: 41, max: 60, text: "Somewhat confident", color: "text-amber-600" },
  { min: 61, max: 80, text: "Fairly confident", color: "text-blue-600" },
  { min: 81, max: 100, text: "Very confident", color: "text-green-600" },
]

function getLabel(value: number) {
  return labels.find((l) => value >= l.min && value <= l.max) || labels[2]
}

interface ConfidenceSliderProps {
  value: number
  onChange: (value: number) => void
  label: string
}

export function ConfidenceSlider({
  value,
  onChange,
  label,
}: ConfidenceSliderProps) {
  const info = getLabel(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className={`text-sm font-semibold ${info.color}`}>
          {value}% - {info.text}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={0}
        max={100}
        step={5}
        className="w-full"
      />
    </div>
  )
}
