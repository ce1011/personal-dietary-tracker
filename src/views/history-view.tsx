import { useState } from "react"
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react"
import { useLogsByDate } from "@/hooks/use-diet-logs"
import { useDailyCalorieGoal } from "@/hooks/use-settings"
import { useLogForm } from "@/components/log-form-context"
import { BentoDashboard } from "@/components/bento-dashboard"
import { LogList } from "@/components/log-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addDays, dateKey, formatLongDate, isToday, startOfDay } from "@/lib/date"
import type { DietLog, MealType } from "@/types"

export function HistoryView({ onBack }: { onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const logs = useLogsByDate(selectedDate)
  const [goal] = useDailyCalorieGoal()
  const { openLogForm } = useLogForm()
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null)

  function shift(days: number) {
    setSelectedDate((d) => addDays(d, days))
  }

  function handleEdit(log: DietLog) {
    openLogForm({ editLog: log })
  }

  function handleSelectMeal(meal: MealType) {
    setSelectedMeal((current) => (current === meal ? null : meal))
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
          aria-label="返回"
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            飲食手帳
          </p>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            歷史紀錄
          </h1>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 rounded-2xl bg-card p-2 shadow-sm">
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          aria-label="前一天"
          onClick={() => shift(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-sm font-medium text-foreground">
            {formatLongDate(selectedDate)}
          </span>
          <Input
            type="date"
            value={dateKey(selectedDate)}
            max={dateKey(new Date())}
            onChange={(e) => {
              const v = e.target.value
              if (v) setSelectedDate(startOfDay(new Date(v)))
            }}
            className="h-7 w-28 text-center text-xs"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          aria-label="後一天"
          onClick={() => shift(1)}
          disabled={isToday(selectedDate)}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <BentoDashboard
        logs={logs}
        goal={goal}
        selectedMeal={selectedMeal}
        onSelectMeal={handleSelectMeal}
      />

      <Button
        size="lg"
        variant="secondary"
        className="h-14 rounded-2xl text-base font-semibold"
        onClick={() => {
          const now = new Date()
          const atTime = new Date(selectedDate)
          atTime.setHours(now.getHours(), now.getMinutes(), 0, 0)
          openLogForm({ defaultDate: atTime })
        }}
      >
        <PlusIcon data-icon="inline-start" />
        新增此日紀錄
      </Button>

      <section className="flex flex-1 flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          當日紀錄
        </h2>
        <LogList logs={logs} onEdit={handleEdit} filterMeal={selectedMeal} />
      </section>
    </div>
  )
}
