import { useMemo } from "react"
import { MEAL_TYPES } from "@/lib/meal-type"
import { LogItem } from "@/components/log-item"
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SoupIcon } from "lucide-react"
import type { DietLog, MealType } from "@/types"

interface LogListProps {
  logs: DietLog[]
  onEdit: (log: DietLog) => void
  filterMeal?: MealType | null
}

export function LogList({ logs, onEdit, filterMeal }: LogListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, DietLog[]>()
    for (const type of MEAL_TYPES) map.set(type, [])
    for (const log of logs) {
      const arr = map.get(log.meal_type)
      if (arr) arr.push(log)
    }
    return MEAL_TYPES.map((type) => {
      const items = map.get(type) ?? []
      return { type, items }
    }).filter(
      (g) => g.items.length > 0 && (!filterMeal || g.type === filterMeal)
    )
  }, [logs, filterMeal])

  if (logs.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyMedia variant="icon">
          <SoupIcon />
        </EmptyMedia>
        <EmptyTitle>尚無紀錄</EmptyTitle>
        <EmptyDescription>
          今天還沒吃東西嗎？新增第一筆紀錄吧。
        </EmptyDescription>
      </Empty>
    )
  }

  if (filterMeal && groups.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyTitle>這一餐還沒有紀錄</EmptyTitle>
        <EmptyDescription>點擊上方按鈕為這一餐新增紀錄。</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.type} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group.type}
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-col">
            {group.items.map((log) => (
              <LogItem key={log.id} log={log} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
