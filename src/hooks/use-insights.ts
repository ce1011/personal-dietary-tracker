import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { addDays, dateKey, startOfDay } from "@/lib/date"
import type { DateRange, RangeKey } from "@/lib/insights"
import type { DietLog, WeightLog } from "@/types"

export function useWeightLogsInRange(range: DateRange): WeightLog[] {
  return (
    useLiveQuery(async () => {
      const start = startOfDay(range.start)
      const end = addDays(startOfDay(range.end), 1)
      const logs = await db.weight_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )
    }, [dateKey(range.start), dateKey(range.end)]) ?? []
  )
}

export function useDietLogsInRange(range: DateRange): DietLog[] {
  return (
    useLiveQuery(async () => {
      const start = startOfDay(range.start)
      const end = addDays(startOfDay(range.end), 1)
      const logs = await db.diet_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )
    }, [dateKey(range.start), dateKey(range.end)]) ?? []
  )
}

export function useInsightsRange(
  rangeKey: RangeKey
): { weightRange: DateRange; dietRange: DateRange } {
  const earliestWeight = useLiveQuery(async () => {
    return db.weight_logs.orderBy("timestamp").first()
  })
  const earliestDiet = useLiveQuery(async () => {
    return db.diet_logs.orderBy("timestamp").first()
  })
  const today = startOfDay(new Date())
  if (rangeKey === "all") {
    return {
      weightRange: {
        start: earliestWeight ? startOfDay(earliestWeight.timestamp) : today,
        end: today,
      },
      dietRange: {
        start: earliestDiet ? startOfDay(earliestDiet.timestamp) : today,
        end: today,
      },
    }
  }
  const days = Number(rangeKey)
  const start = addDays(today, -(days - 1))
  return {
    weightRange: { start, end: today },
    dietRange: { start, end: today },
  }
}
