import type { RangeKey } from "@/lib/insights"
import { cn } from "@/lib/utils"

const OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "7", label: "7天" },
  { key: "30", label: "30天" },
  { key: "90", label: "90天" },
  { key: "all", label: "全部" },
]

interface RangeSelectorProps {
  value: RangeKey
  onChange: (key: RangeKey) => void
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex justify-center bg-background/80 px-4 pb-2 pt-1 backdrop-blur">
      <div className="flex gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-sm font-medium transition-all",
              value === option.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
