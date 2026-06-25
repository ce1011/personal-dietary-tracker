import { UtensilsIcon, StarIcon, SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type Tab = "today" | "presets" | "settings"

const TABS: Array<{ id: Tab; label: string; icon: typeof UtensilsIcon }> = [
  { id: "today", label: "今日", icon: UtensilsIcon },
  { id: "presets", label: "預設", icon: StarIcon },
  { id: "settings", label: "設定", icon: SettingsIcon },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav className="mx-5 mb-4 rounded-2xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="flex items-stretch justify-around">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
