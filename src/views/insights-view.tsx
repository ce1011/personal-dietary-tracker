import { useState } from "react"
import { CalorieAdherenceChart } from "@/components/insights/calorie-adherence-chart"
import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { MealDistributionChart } from "@/components/insights/meal-distribution-chart"
import { RangeSelector } from "@/components/insights/range-selector"
import { TopFoodsList } from "@/components/insights/top-foods-list"
import { TopLocationsList } from "@/components/insights/top-locations-list"
import { WeightTrendChart } from "@/components/insights/weight-trend-chart"
import {
  useDietLogsInRange,
  useInsightsRange,
  useWeightLogsInRange,
} from "@/hooks/use-insights"
import { useDailyCalorieGoal, useProfile } from "@/hooks/use-settings"
import type { RangeKey } from "@/lib/insights"

export function InsightsView() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30")
  const { weightRange, dietRange } = useInsightsRange(rangeKey)
  const weightLogs = useWeightLogsInRange(weightRange)
  const dietLogs = useDietLogsInRange(dietRange)
  const [profile] = useProfile()
  const [goal] = useDailyCalorieGoal()

  const hasDietLogs = dietLogs.length > 0

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          飲食手帳
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          統計
        </h1>
        <p className="text-sm text-muted-foreground">
          查看你的體重趨勢、熱量達標與飲食習慣。
        </p>
      </header>

      <RangeSelector value={rangeKey} onChange={setRangeKey} />

      <WeightTrendChart
        logs={weightLogs}
        targetWeight={profile?.targetWeight}
      />

      <CalorieAdherenceChart logs={dietLogs} range={dietRange} goal={goal} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          飲食習慣
        </h2>
        {hasDietLogs ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <MealDistributionChart logs={dietLogs} />
            <TopFoodsList logs={dietLogs} />
            <TopLocationsList logs={dietLogs} />
          </div>
        ) : (
          <InsightEmptyState message="還沒有飲食紀錄。回到今日新增第一筆吧！" />
        )}
      </section>
    </div>
  )
}
