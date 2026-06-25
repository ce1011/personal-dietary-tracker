import { useMemo } from "react"
import { MEAL_TYPES } from "@/lib/meal-type"
import { cn } from "@/lib/utils"
import type { DietLog, MealType } from "@/types"

const MEAL_ICON: Record<MealType, string> = {
  早餐: "🍳",
  午餐: "🍱",
  晚餐: "🍜",
  零食: "🍪",
}

interface BentoDashboardProps {
  logs: DietLog[]
  goal: number
  selectedMeal: MealType | null
  onSelectMeal: (meal: MealType) => void
  className?: string
}

export function BentoDashboard({
  logs,
  goal,
  selectedMeal,
  onSelectMeal,
  className,
}: BentoDashboardProps) {
  const totals = useMemo(() => {
    const map = new Map<MealType, number>()
    for (const type of MEAL_TYPES) map.set(type, 0)
    for (const log of logs) {
      map.set(log.meal_type, (map.get(log.meal_type) ?? 0) + log.calories)
    }
    return map
  }, [logs])

  const total = useMemo(
    () => logs.reduce((sum, l) => sum + l.calories, 0),
    [logs]
  )

  const exceeded = total > goal
  const remaining = Math.max(goal - total, 0)
  const over = Math.max(total - goal, 0)

  return (
    <div
      className={cn(
        "grid grid-cols-2 grid-rows-3 gap-3",
        className
      )}
    >
      <TotalCell
        total={total}
        goal={goal}
        exceeded={exceeded}
        remaining={remaining}
        over={over}
        style={{ animationDelay: "0ms" }}
      />

      <MealCell
        type="早餐"
        total={totals.get("早餐") ?? 0}
        selected={selectedMeal === "早餐"}
        onClick={() => onSelectMeal("早餐")}
        style={{ animationDelay: "60ms" }}
      />
      <MealCell
        type="午餐"
        total={totals.get("午餐") ?? 0}
        selected={selectedMeal === "午餐"}
        onClick={() => onSelectMeal("午餐")}
        style={{ animationDelay: "120ms" }}
      />
      <MealCell
        type="晚餐"
        total={totals.get("晚餐") ?? 0}
        selected={selectedMeal === "晚餐"}
        onClick={() => onSelectMeal("晚餐")}
        style={{ animationDelay: "180ms" }}
      />
      <MealCell
        type="零食"
        total={totals.get("零食") ?? 0}
        selected={selectedMeal === "零食"}
        onClick={() => onSelectMeal("零食")}
        style={{ animationDelay: "240ms" }}
      />
    </div>
  )
}

function Cell({
  children,
  className,
  selected,
  onClick,
  style,
  as: Component = "button",
}: {
  children: React.ReactNode
  className?: string
  selected?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  as?: "button" | "div"
}) {
  const base = cn(
    "animate-bento-in flex flex-col justify-between rounded-2xl border bg-card p-4 text-left shadow-sm transition-all duration-200",
    Component === "button" && "hover:shadow-md hover:scale-[1.02] active:scale-[0.99]",
    selected
      ? "border-primary bg-primary/5 ring-1 ring-primary"
      : "border-border hover:border-primary/40",
    className
  )
  if (Component === "div") {
    return (
      <div style={style} className={base}>
        {children}
      </div>
    )
  }
  return (
    <button type="button" onClick={onClick} style={style} className={base}>
      {children}
    </button>
  )
}

function TotalCell({
  total,
  goal,
  exceeded,
  remaining,
  over,
  style,
}: {
  total: number
  goal: number
  exceeded: boolean
  remaining: number
  over: number
  style?: React.CSSProperties
}) {
  return (
    <Cell
      as="div"
      className="col-span-1 row-span-2 row-start-1"
      style={style}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        今日熱量
      </span>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-heading text-5xl font-semibold tabular-nums tracking-tighter",
            exceeded ? "text-accent" : "text-foreground"
          )}
        >
          {total.toLocaleString("zh-Hant")}
        </span>
        <span className="text-sm text-muted-foreground">
          / {goal.toLocaleString("zh-Hant")} kcal
        </span>
      </div>
      <span
        className={cn(
          "w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
          exceeded
            ? "bg-shiso-light text-shiso dark:bg-shiso-light dark:text-shiso"
            : "bg-nori-light text-nori dark:bg-nori-light dark:text-nori"
        )}
      >
        {exceeded ? `超標 ${over} kcal` : `剩餘 ${remaining} kcal`}
      </span>
    </Cell>
  )
}

function MealCell({
  type,
  total,
  selected,
  onClick,
  style,
}: {
  type: MealType
  total: number
  selected: boolean
  onClick: () => void
  style?: React.CSSProperties
}) {
  return (
    <Cell selected={selected} onClick={onClick} style={style}>
      <span className="text-lg leading-none">{MEAL_ICON[type]}</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">{type}</span>
        <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">
          {total}
        </span>
      </div>
    </Cell>
  )
}

