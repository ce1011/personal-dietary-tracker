import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { useAllPresets } from "@/hooks/use-preset-meals"
import { PresetList } from "@/components/preset-list"
import { PresetForm } from "@/components/preset-form"
import { Button } from "@/components/ui/button"
import type { PresetMeal } from "@/types"

export function PresetsView() {
  const presets = useAllPresets()
  const [formOpen, setFormOpen] = useState(false)
  const [editPreset, setEditPreset] = useState<PresetMeal | undefined>(undefined)

  function openNew() {
    setEditPreset(undefined)
    setFormOpen(true)
  }

  function openEdit(preset: PresetMeal) {
    setEditPreset(preset)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            快速紀錄
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            常用餐點
          </h1>
          <p className="text-sm text-muted-foreground">
            點擊餐點即可一鍵帶入今日紀錄。
          </p>
        </div>
        <Button
          size="icon-lg"
          className="rounded-full shadow-lg shadow-primary/20"
          aria-label="新增預設"
          onClick={openNew}
        >
          <PlusIcon />
        </Button>
      </header>

      <div className="flex flex-1 flex-col">
        <PresetList presets={presets} onEdit={openEdit} />
      </div>

      <PresetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editPreset={editPreset}
      />
    </div>
  )
}
