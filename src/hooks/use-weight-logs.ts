import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { addDays, dateKey, startOfDay } from "@/lib/date"
import type { WeightLog } from "@/types"

export function useWeightsByDate(date: Date): WeightLog[] {
  return (
    useLiveQuery(async () => {
      const start = startOfDay(date)
      const end = addDays(start, 1)
      const logs = await db.weight_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }, [dateKey(date)]) ?? []
  )
}

export function useTodayWeight(): WeightLog | undefined {
  const logs = useWeightsByDate(new Date())
  return logs.at(-1)
}

export function useLatestWeight(): WeightLog | undefined {
  return (
    useLiveQuery(async () => {
      return db.weight_logs.orderBy("timestamp").reverse().first()
    }) ?? undefined
  )
}

/**
 * 每次紀錄皆新增一筆，保留完整體重變化歷史。
 */
export async function addWeight(weight: number): Promise<void> {
  await db.weight_logs.add({
    id: Date.now(),
    timestamp: new Date(),
    weight,
  })
}
