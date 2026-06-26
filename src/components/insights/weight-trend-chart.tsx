import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { InsightStatCard } from "@/components/insights/insight-stat-card"
import {
  buildLinePath,
  linearScale,
  niceBounds,
  tickDates,
} from "@/components/insights/svg-chart-primitives"
import { useWeightForm } from "@/components/weight-form-context"
import { formatMonthDay } from "@/lib/date"
import { rollingAverageWeight, weightStats } from "@/lib/insights"
import type { WeightLog } from "@/types"

interface WeightTrendChartProps {
  logs: WeightLog[]
  targetWeight?: number
}

const W = 320
const H = 160
const PAD = { top: 16, right: 16, bottom: 24, left: 40 }

export function WeightTrendChart({
  logs,
  targetWeight,
}: WeightTrendChartProps) {
  const { openWeightForm } = useWeightForm()
  const stats = weightStats(logs)
  const avgPoints = rollingAverageWeight(logs)

  if (logs.length < 2) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          體重趨勢
        </h2>
        <InsightEmptyState
          message="開始記錄體重，連續一週後就能看到趨勢線"
          actionLabel="紀錄體重"
          onAction={() => openWeightForm({})}
        />
      </section>
    )
  }

  const weights = logs.map((log) => log.weight)
  const allValues = [
    ...weights,
    ...(targetWeight !== undefined ? [targetWeight] : []),
  ]
  const [minW, maxW] = niceBounds(
    Math.min(...allValues),
    Math.max(...allValues)
  )
  const earliest = logs[0].timestamp
  const latest = logs[logs.length - 1].timestamp
  const xScale = linearScale(
    [earliest.getTime(), latest.getTime()],
    [PAD.left, W - PAD.right]
  )
  const yScale = linearScale([minW, maxW], [H - PAD.bottom, PAD.top])

  const linePath = buildLinePath(
    avgPoints.map((point) => ({
      x: xScale(point.date.getTime()),
      y: yScale(point.value),
    }))
  )
  const ticks = tickDates(earliest, latest, 4)
  const showGoal =
    targetWeight !== undefined && targetWeight >= minW && targetWeight <= maxW
  const goalY = showGoal ? yScale(targetWeight) : null

  const deltaText =
    stats.delta > 0
      ? `-${stats.delta.toFixed(1)}`
      : `+${Math.abs(stats.delta).toFixed(1)}`

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        體重趨勢
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InsightStatCard label="起始至今" value={deltaText} unit="kg" />
        <InsightStatCard
          label="有紀錄天數"
          value={String(stats.loggedDays)}
          unit="天"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="體重趨勢圖"
        >
          {ticks.map((date, index) => (
            <text
              key={index}
              x={xScale(date.getTime())}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {formatMonthDay(date)}
            </text>
          ))}
          <text
            x={4}
            y={yScale(maxW) + 4}
            className="fill-muted-foreground text-[9px]"
          >
            {maxW.toFixed(1)}
          </text>
          <text
            x={4}
            y={yScale(minW) + 4}
            className="fill-muted-foreground text-[9px]"
          >
            {minW.toFixed(1)}
          </text>
          {showGoal && goalY !== null && (
            <>
              <line
                x1={PAD.left}
                y1={goalY}
                x2={W - PAD.right}
                y2={goalY}
                strokeWidth={1}
                className="stroke-primary/50"
                strokeDasharray="4 3"
              />
              <text
                x={W - PAD.right}
                y={goalY - 4}
                textAnchor="end"
                className="fill-primary/70 text-[8px]"
              >
                目標 {targetWeight}
              </text>
            </>
          )}
          {logs.map((log, index) => (
            <circle
              key={index}
              cx={xScale(log.timestamp.getTime())}
              cy={yScale(log.weight)}
              r={2.5}
              className="fill-muted-foreground/40"
            />
          ))}
          <path
            d={linePath}
            fill="none"
            strokeWidth={2}
            className="stroke-primary"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  )
}
