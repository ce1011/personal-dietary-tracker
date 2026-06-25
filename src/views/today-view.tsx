import { useState } from "react"
import { PlusIcon, CalendarDaysIcon } from "lucide-react"
import { useTodayLogs } from "@/hooks/use-diet-logs"
import { useDailyCalorieGoal } from "@/hooks/use-settings"
import { useLogForm } from "@/components/log-form-context"
import { BentoDashboard } from "@/components/bento-dashboard"
import { WeightCard } from "@/components/weight-card"
import { LogList } from "@/components/log-list"
import { Button } from "@/components/ui/button"
import { formatLongDate } from "@/lib/date"
import type { DietLog, MealType } from "@/types"

export function TodayView({ onOpenHistory }: { onOpenHistory: () => void }) {
  const logs = useTodayLogs()
  const [goal] = useDailyCalorieGoal()
  const { openLogForm } = useLogForm()
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null)

  function handleEdit(log: DietLog) {
    openLogForm({ editLog: log })
  }

  function handleSelectMeal(meal: MealType) {
    setSelectedMeal((current) => (current === meal ? null : meal))
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            飲食手帳
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            今天吃了什麼？
          </h1>
          <p className="text-sm text-muted-foreground">{formatLongDate(new Date())}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
          aria-label="查看歷史紀錄"
          onClick={onOpenHistory}
        >
          <CalendarDaysIcon />
        </Button>
      </header>

      <WeightCard />

      <BentoDashboard
        logs={logs}
        goal={goal}
        selectedMeal={selectedMeal}
        onSelectMeal={handleSelectMeal}
      />

      <Button
        size="lg"
        className="h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
        onClick={() => openLogForm()}
      >
        <PlusIcon data-icon="inline-start" />
        新增紀錄
      </Button>

      <section className="flex flex-1 flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          本日紀錄
        </h2>
        <LogList logs={logs} onEdit={handleEdit} filterMeal={selectedMeal} />
      </section>
    </div>
  )
}
