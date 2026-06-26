import { topFoods } from "@/lib/insights"
import type { DietLog } from "@/types"

interface TopFoodsListProps {
  logs: DietLog[]
}

export function TopFoodsList({ logs }: TopFoodsListProps) {
  const foods = topFoods(logs, 5)
  if (foods.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">常見食物</h3>
      <ol className="flex flex-col gap-1.5">
        {foods.map((food, index) => (
          <li
            key={food.name}
            className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
              {index + 1}
            </span>
            <span className="flex-1 truncate text-foreground">{food.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {food.calories.toLocaleString("zh-Hant")} kcal
            </span>
            <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
              {food.count} 次
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
