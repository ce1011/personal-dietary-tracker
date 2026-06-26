import { cn } from "@/lib/utils"

interface InsightStatCardProps {
  label: string
  value: string
  unit?: string
  className?: string
}

export function InsightStatCard({
  label,
  value,
  unit,
  className,
}: InsightStatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-3.5 shadow-sm",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </span>
    </div>
  )
}
