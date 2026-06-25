import { useState } from "react"
import {
  PencilIcon,
  Trash2Icon,
  MapPinIcon,
  PlusIcon,
  UtensilsIcon,
} from "lucide-react"
import { toast } from "sonner"
import { deletePreset } from "@/hooks/use-preset-meals"
import { useLogForm } from "@/components/log-form-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { PresetMeal } from "@/types"

const PRESET_ICON: Record<string, string> = {
  早餐: "🍳",
  午餐: "🍱",
  晚餐: "🍜",
  零食: "🍪",
}

export function PresetList({
  presets,
  onEdit,
}: {
  presets: PresetMeal[]
  onEdit: (preset: PresetMeal) => void
}) {
  const { openLogForm } = useLogForm()

  if (presets.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyMedia variant="icon">
          <UtensilsIcon />
        </EmptyMedia>
        <EmptyTitle>尚無預設餐點</EmptyTitle>
        <EmptyDescription>
          把常吃的組合存起來，未來一鍵帶入紀錄。
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          onEdit={() => onEdit(preset)}
          onUse={() => openLogForm({ preset })}
        />
      ))}
    </div>
  )
}

function PresetCard({
  preset,
  onEdit,
  onUse,
}: {
  preset: PresetMeal
  onEdit: () => void
  onUse: () => void
}) {
  const [open, setOpen] = useState(false)
  const icon = preset.default_meal_type
    ? PRESET_ICON[preset.default_meal_type]
    : "🍽️"

  async function handleDelete() {
    try {
      await deletePreset(preset.id)
      toast.success("已刪除預設餐點")
    } catch {
      toast.error("刪除失敗")
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
          {icon}
        </div>
        <button
          type="button"
          onClick={onUse}
          className="flex min-w-0 flex-1 flex-col gap-1 text-left"
          aria-label={`一鍵帶入 ${preset.meal_name}`}
        >
          <span className="truncate font-medium text-foreground">
            {preset.meal_name}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="tabular-nums">
              {preset.calories} kcal
              {preset.serving_unit ? ` / ${preset.serving_unit}` : ""}
            </Badge>
            {preset.default_meal_type && (
              <Badge variant="outline">{preset.default_meal_type}</Badge>
            )}
            {preset.default_location && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPinIcon className="size-3" />
                {preset.default_location}
              </span>
            )}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon-sm"
            className="rounded-full"
            aria-label="一鍵帶入"
            onClick={onUse}
          >
            <PlusIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="編輯"
            onClick={onEdit}
          >
            <PencilIcon />
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label="刪除"
              >
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>刪除這個預設餐點？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{preset.meal_name}」將被永久刪除。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-2xl">取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-2xl">
                  刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
