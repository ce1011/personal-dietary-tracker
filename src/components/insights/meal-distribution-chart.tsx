import { mealDistribution } from "@/lib/insights"
import type { DietLog, MealType } from "@/types"

const MEAL_ICON: Record<MealType, string> = {
  早餐: "🍳",
  午餐: "🍱",
  晚餐: "🍜",
  零食: "🍪",
}

const SEGMENT_COLORS: Record<MealType, string> = {
  早餐: "stroke-primary",
  午餐: "stroke-primary/70",
  晚餐: "stroke-primary/50",
  零食: "stroke-accent/70",
}

interface MealDistributionChartProps {
  logs: DietLog[]
}

const R = 50
const STROKE = 18
const CIRCUMFERENCE = 2 * Math.PI * R

export function MealDistributionChart({ logs }: MealDistributionChartProps) {
  const slices = mealDistribution(logs)
  const totalCalories = slices.reduce((sum, slice) => sum + slice.calories, 0)

  let offset = 0
  const arcs = slices.map((slice) => {
    const fraction = slice.percent / 100
    const dash = fraction * CIRCUMFERENCE
    const arc = {
      ...slice,
      dasharray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashoffset: -offset,
    }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 120 120"
        className="size-28 shrink-0 -rotate-90"
        role="img"
        aria-label="餐別分布"
      >
        <circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted/40"
        />
        {totalCalories > 0 &&
          arcs.map((arc) => (
            <circle
              key={arc.type}
              cx={60}
              cy={60}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              className={SEGMENT_COLORS[arc.type]}
              strokeDasharray={arc.dasharray}
              strokeDashoffset={arc.dashoffset}
            />
          ))}
      </svg>
      <div className="flex flex-1 flex-col gap-1.5">
        {slices.map((slice) => (
          <div key={slice.type} className="flex items-center gap-2 text-sm">
            <span className="text-base">{MEAL_ICON[slice.type]}</span>
            <span className="flex-1 text-foreground">{slice.type}</span>
            <span className="tabular-nums text-muted-foreground">
              {slice.calories.toLocaleString("zh-Hant")} kcal
            </span>
            <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
              {Math.round(slice.percent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
