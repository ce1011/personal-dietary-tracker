import { ScaleIcon } from "lucide-react"
import { useLatestWeight, useTodayWeight } from "@/hooks/use-weight-logs"
import { useWeightForm } from "@/components/weight-form-context"

export function WeightCard() {
  const today = useTodayWeight()
  const latest = useLatestWeight()
  const { openWeightForm } = useWeightForm()

  const display = today ?? latest
  const hasToday = !!today

  return (
    <button
      type="button"
      onClick={() => openWeightForm({ defaultWeight: display })}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ScaleIcon className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          今日體重
        </span>
        {display ? (
          <span className="flex items-baseline gap-1.5">
            <span className="font-heading text-lg font-semibold tabular-nums text-foreground">
              {display.weight}
            </span>
            <span className="text-xs text-muted-foreground">kg</span>
            {!hasToday && (
              <span className="text-xs text-muted-foreground">（最新）</span>
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">尚未紀錄</span>
        )}
      </div>
      <span className="shrink-0 text-sm font-medium text-primary">紀錄</span>
    </button>
  )
}
