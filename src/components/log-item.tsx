import { useState } from "react"
import { PencilIcon, Trash2Icon, MapPinIcon } from "lucide-react"
import { toast } from "sonner"
import { formatTime } from "@/lib/date"
import { deleteLog } from "@/hooks/use-diet-logs"
import { Button } from "@/components/ui/button"
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
import type { DietLog } from "@/types"

export function LogItem({
  log,
  onEdit,
}: {
  log: DietLog
  onEdit: (log: DietLog) => void
}) {
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteLog(log.id)
      toast.success("已刪除紀錄")
    } catch {
      toast.error("刪除失敗")
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40">
      <div className="flex w-10 shrink-0 justify-center">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {formatTime(log.timestamp)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">
          {log.food_name}
          {log.quantity && log.serving_unit ? (
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ×{log.quantity} {log.serving_unit}
            </span>
          ) : null}
        </span>
        {log.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3" />
            {log.location}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-secondary-foreground">
          {log.calories}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label="編輯"
          onClick={() => onEdit(log)}
        >
          <PencilIcon />
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="刪除"
            >
              <Trash2Icon />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>刪除這筆紀錄？</AlertDialogTitle>
              <AlertDialogDescription>
                「{log.food_name}」({log.calories} kcal) 將被永久刪除。
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
    </div>
  )
}
