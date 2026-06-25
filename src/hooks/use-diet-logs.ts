import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { dateKey } from "@/lib/date"
import type { DietLog } from "@/types"

export function useLogsByDate(date: Date) {
  return (
    useLiveQuery(async () => {
      const key = dateKey(date)
      const start = new Date(key)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const logs = await db.diet_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }, [dateKey(date)]) ?? []
  )
}

export function useTodayLogs() {
  return useLogsByDate(new Date())
}

export async function addLog(
  log: Omit<DietLog, "id">
): Promise<number> {
  return db.diet_logs.add({ ...log, id: Date.now() } as DietLog)
}

export async function updateLog(id: number, patch: Partial<DietLog>) {
  await db.diet_logs.update(id, patch)
}

export async function deleteLog(id: number) {
  await db.diet_logs.delete(id)
}
