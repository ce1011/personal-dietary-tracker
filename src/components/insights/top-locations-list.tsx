import { topLocations } from "@/lib/insights"
import type { DietLog } from "@/types"

interface TopLocationsListProps {
  logs: DietLog[]
}

export function TopLocationsList({ logs }: TopLocationsListProps) {
  const locations = topLocations(logs)
  if (locations.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">用餐地點</h3>
      <div className="flex flex-col gap-1.5">
        {locations.map((location) => (
          <div
            key={location.location}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-24 shrink-0 truncate text-foreground">
              {location.location}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.max(location.percent, 3)}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
              {Math.round(location.percent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
