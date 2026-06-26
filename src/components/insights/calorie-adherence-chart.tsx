import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { InsightStatCard } from "@/components/insights/insight-stat-card"
import {
  linearScale,
  tickDates,
} from "@/components/insights/svg-chart-primitives"
import { formatMonthDay } from "@/lib/date"
import {
  adherenceStats,
  dailyCalorieTotals,
  type DateRange,
} from "@/lib/insights"
import { cn } from "@/lib/utils"
import type { DietLog } from "@/types"

interface CalorieAdherenceChartProps {
  logs: DietLog[]
  range: DateRange
  goal: number
}

const W = 320
const H = 160
const PAD = { top: 16, right: 12, bottom: 24, left: 12 }

export function CalorieAdherenceChart({
  logs,
  range,
  goal,
}: CalorieAdherenceChartProps) {
  const totals = dailyCalorieTotals(logs, range)
  const stats = adherenceStats(totals, goal)

  const loggedDays = totals.filter((day) => day.total !== null)

  if (loggedDays.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          熱量達標
        </h2>
        <InsightEmptyState message="還沒有飲食紀錄。回到今日新增第一筆吧！" />
      </section>
    )
  }

  const maxTotal = Math.max(...totals.map((day) => day.total ?? 0), goal)
  const yScale = linearScale([0, maxTotal * 1.1], [H - PAD.bottom, PAD.top])
  const dayCount = totals.length
  const chartW = W - PAD.left - PAD.right
  const barW =
    dayCount > 30 ? Math.max(chartW / dayCount, 1.5) : chartW / dayCount - 1
  const gap = dayCount > 30 ? 0 : 1

  const goalY = yScale(goal)
  const ticks = tickDates(range.start, range.end, 4)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        熱量達標
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InsightStatCard
          label="達標率"
          value={`${Math.round(stats.adherenceRate)}`}
          unit="%"
        />
        <InsightStatCard
          label="日均熱量"
          value={Math.round(stats.avgDailyCalories).toLocaleString("zh-Hant")}
          unit="kcal"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="每日熱量圖"
        >
          <line
            x1={PAD.left}
            y1={goalY}
            x2={W - PAD.right}
            y2={goalY}
            strokeWidth={1}
            className="stroke-muted-foreground"
            strokeDasharray="4 3"
          />
          <text
            x={W - PAD.right}
            y={goalY - 3}
            textAnchor="end"
            className="fill-muted-foreground text-[8px]"
          >
            {goal.toLocaleString("zh-Hant")}
          </text>
          {totals.map((day, index) => {
            const x = PAD.left + index * (barW + gap)
            if (day.total === null) {
              return (
                <line
                  key={index}
                  x1={x + barW / 2}
                  y1={H - PAD.bottom}
                  x2={x + barW / 2}
                  y2={H - PAD.bottom + 2}
                  strokeWidth={1}
                  className="stroke-muted-foreground/30"
                />
              )
            }
            const barH = H - PAD.bottom - yScale(day.total)
            const over = day.total > goal
            return (
              <rect
                key={index}
                x={x}
                y={yScale(day.total)}
                width={barW}
                height={barH}
                rx={1}
                className={cn(over ? "fill-accent" : "fill-primary")}
              />
            )
          })}
          {ticks.map((date, index) => {
            const tickIdx = Math.round(
              ((date.getTime() - range.start.getTime()) /
                (range.end.getTime() - range.start.getTime())) *
                (dayCount - 1)
            )
            const x = PAD.left + tickIdx * (barW + gap) + barW / 2
            return (
              <text
                key={index}
                x={x}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {formatMonthDay(date)}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
